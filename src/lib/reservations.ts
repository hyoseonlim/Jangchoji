import "server-only";
import { getSupabaseAdmin } from "./supabase-server";
import { encrypt, decrypt, hashPhone, maskName, maskPhone } from "./encryption";
import {
  CONFIG_LABELS,
  CONFIG_KEYS,
  type ConfigKey,
  type GroupSize,
  type PackageLine,
  type PackagePriceRow,
  type PackageSelections,
  computeSelectionLines,
  dayTypeForDate,
  isConfigKey,
  nightsBetween,
  perPersonStayTotalByConfig,
  seasonForDate,
  summarizePackageLines,
  summarizeSeason,
} from "./pricing";
import {
  ROOMS,
  ROOM_KEYS,
  ROOM_TYPE_META,
  isRoomKey,
  isRoomType,
  type RoomKey,
  type RoomType,
} from "./rooms";

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export type GuestInput = { name: string; phone?: string; isRepresentative: boolean };

// 온라인 스코프 : 4인 이상 숙박 패키지만 예약 가능 (수기 등록은 관리자가 값 자유롭게 지정 가능)
export const FIXED_GROUP_SIZE: GroupSize = "4";
export const MIN_GUESTS = 4;

// 고객 예약 : 유형만 선택. 서버가 자동으로 A/B 배정.
export type CreateReservationInput = {
  packageSelections: PackageSelections;
  roomType: RoomType;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  guests: GuestInput[];
  memo?: string;
  depositorName?: string;
  paymentConfirmed: boolean;
};

// 관리자 수기 등록 · 편집 공용 입력. 온라인과 달리 :
//   - 수량 합계 ≠ guestsCount 허용 (예외 조합 등록)
//   - 상태 직접 지정 가능 (pending / confirmed)
//   - 가격 오버라이드 가능 (price_override + price_note)
export type AdminReservationInput = {
  packageSelections: PackageSelections;
  roomKey: RoomKey;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  guests: GuestInput[]; // 대표자 1명 (이름·전화 필수), 동행은 선택 (이름 필수)
  memo?: string;
  depositorName?: string; // 없으면 대표자 이름
  status: "pending" | "confirmed";
  priceOverride?: number; // 지정 시 total_price 로 저장. 미지정 시 계산가 사용
  priceNote?: string; // 오버라이드 사유
};

export type QuoteResult = {
  total: number;
  guestsCount: number;
  lines: PackageLine[];
  season: "peak" | "off" | "mixed";
  packageLabel: string;
};

export async function listActivePackagePrices(): Promise<PackagePriceRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("config_key, season, day_type, price")
    .eq("group_size", FIXED_GROUP_SIZE)
    .eq("is_active", true);
  if (error) throw new Error(`상품 가격 조회 실패: ${error.message}`);
  return (data ?? [])
    .filter((r) => isConfigKey(r.config_key))
    .map((r) => ({
      config_key: r.config_key as ConfigKey,
      season: r.season as PackagePriceRow["season"],
      day_type: r.day_type as PackagePriceRow["day_type"],
      price: r.price,
    }));
}

// 서버 사이드 총액 계산. 온라인은 수량 합계 = guestsCount 를 강제하지만,
// 관리자 편집·수기 등록은 relaxed 옵션으로 이 강제를 skip 할 수 있다.
export async function quoteReservation(
  packageSelections: PackageSelections,
  checkIn: string,
  checkOut: string,
  guestsCount: number,
  opts: { relaxed?: boolean; groupSize?: GroupSize } = {},
): Promise<QuoteResult> {
  const { relaxed = false, groupSize = FIXED_GROUP_SIZE } = opts;
  const nights = nightsBetween(checkIn, checkOut);
  if (nights.length === 0) {
    throw new Error("체크아웃은 체크인 다음날 이후여야 합니다.");
  }
  if (!Number.isInteger(guestsCount) || guestsCount < 1) {
    throw new Error("인원 수가 올바르지 않습니다.");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("config_key, season, day_type, price")
    .eq("group_size", groupSize)
    .eq("is_active", true);

  if (error) throw new Error(`가격 조회 실패: ${error.message}`);
  if (!data || data.length === 0) throw new Error("상품 가격이 등록되지 않았습니다.");

  const rows: PackagePriceRow[] = data
    .filter((r) => isConfigKey(r.config_key))
    .map((r) => ({
      config_key: r.config_key as ConfigKey,
      season: r.season as PackagePriceRow["season"],
      day_type: r.day_type as PackagePriceRow["day_type"],
      price: r.price,
    }));

  const perPersonByConfig = perPersonStayTotalByConfig(rows, checkIn, checkOut);
  const result = computeSelectionLines(perPersonByConfig, packageSelections);
  if (!result) throw new Error("선택한 패키지 요금을 계산할 수 없습니다.");
  if (result.lines.length === 0) throw new Error("최소 1개 이상의 패키지를 선택해주세요.");
  if (!relaxed && result.totalQuantity !== guestsCount) {
    throw new Error(
      `선택한 패키지 수량(${result.totalQuantity}명)이 예약 인원(${guestsCount}명)과 일치해야 합니다.`,
    );
  }

  return {
    total: result.total,
    guestsCount,
    lines: result.lines,
    season: summarizeSeason(nights),
    packageLabel: summarizePackageLines(result.lines),
  };
}

// packages JSONB 원소 shape
type StoredPackage = {
  configKey: ConfigKey;
  label: string;
  quantity: number;
  perPersonSubtotal: number;
  lineTotal: number;
};

function toStored(lines: PackageLine[]): StoredPackage[] {
  return lines.map((l) => ({
    configKey: l.configKey,
    label: l.label,
    quantity: l.quantity,
    perPersonSubtotal: l.perPersonSubtotal,
    lineTotal: l.lineTotal,
  }));
}

function parseStored(v: unknown): StoredPackage[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((el): StoredPackage[] => {
    if (typeof el !== "object" || el === null) return [];
    const o = el as Record<string, unknown>;
    if (!isConfigKey(o.configKey)) return [];
    const quantity = typeof o.quantity === "number" ? o.quantity : 0;
    const perPersonSubtotal = typeof o.perPersonSubtotal === "number" ? o.perPersonSubtotal : 0;
    const lineTotal = typeof o.lineTotal === "number" ? o.lineTotal : perPersonSubtotal * quantity;
    const label = typeof o.label === "string" ? o.label : CONFIG_LABELS[o.configKey];
    return [{ configKey: o.configKey, label, quantity, perPersonSubtotal, lineTotal }];
  });
}

// ========================================
// 온라인 예약 생성 (기존)
// ========================================
export async function createReservation(input: CreateReservationInput) {
  if (!input.paymentConfirmed) {
    throw new Error("입금 확인에 체크한 뒤 예약을 완료할 수 있습니다.");
  }
  if (input.guests.length === 0) {
    throw new Error("예약자 정보를 1명 이상 입력해주세요.");
  }
  const reps = input.guests.filter((g) => g.isRepresentative);
  if (reps.length !== 1) {
    throw new Error("대표 예약자를 정확히 1명 지정해주세요.");
  }
  if (!reps[0].phone || reps[0].phone.replace(/\D+/g, "").length < 9) {
    throw new Error("대표 예약자의 전화번호를 입력해주세요.");
  }
  if (!isRoomType(input.roomType)) throw new Error("객실 유형을 선택해주세요.");
  const roomType = ROOM_TYPE_META[input.roomType];
  if (
    !Number.isInteger(input.guestsCount) ||
    input.guestsCount < roomType.minGuests ||
    input.guestsCount > roomType.maxGuests
  ) {
    throw new Error(
      `${roomType.title}은 최소 ${roomType.minGuests}인 / 최대 ${roomType.maxGuests}인까지 예약 가능합니다.`,
    );
  }

  const quote = await quoteReservation(
    input.packageSelections,
    input.checkIn,
    input.checkOut,
    input.guestsCount,
  );

  // 물리 객실 자동 배정 (A/B 순으로 검사, 첫 가용 방 사용)
  const avail = await getRoomAvailability(input.checkIn, input.checkOut);
  const assignedKey = roomType.physicals.find((k) => avail[k]);
  if (!assignedKey) {
    throw new Error(
      `${roomType.title}은 선택하신 일정에 이미 예약 마감입니다. 다른 객실 유형이나 날짜를 선택해주세요.`,
    );
  }

  const depositorRaw = (input.depositorName ?? "").trim() || reps[0].name.trim();
  const supabase = getSupabaseAdmin();

  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .insert({
      packages: toStored(quote.lines),
      package_label: quote.packageLabel,
      season: quote.season,
      guests_count: input.guestsCount,
      check_in: input.checkIn,
      check_out: input.checkOut,
      total_price: quote.total,
      status: "pending",
      memo: input.memo ?? null,
      depositor_name_enc: encrypt(depositorRaw),
      room_key: assignedKey,
      source: "online",
    })
    .select("*")
    .single();

  if (rErr || !reservation) {
    if (rErr?.message && /exclu|no_double_book|conflicting|overlap/i.test(rErr.message)) {
      throw new Error("선택하신 일정에 해당 객실이 이미 예약되었습니다. 다른 객실이나 날짜를 선택해주세요.");
    }
    throw new Error(`예약 생성 실패: ${rErr?.message}`);
  }

  await writeGuestRows(reservation.id, input.guests, { rollbackReservationOnError: true });

  await supabase.from("reservation_history").insert({
    reservation_id: reservation.id,
    admin_username: null,
    action: "created",
    before_status: null,
    after_status: "pending",
  });

  return { reservation, quote };
}

// ========================================
// 관리자 수기 등록
// ========================================
export async function adminCreateReservation(
  input: AdminReservationInput,
  admin: { username: string; displayName: string },
) {
  if (input.guests.length === 0) throw new Error("예약자 정보를 1명 이상 입력해주세요.");
  const reps = input.guests.filter((g) => g.isRepresentative);
  if (reps.length !== 1) throw new Error("대표 예약자를 정확히 1명 지정해주세요.");
  if (!reps[0].phone || reps[0].phone.replace(/\D+/g, "").length < 9) {
    throw new Error("대표 예약자의 전화번호를 입력해주세요.");
  }
  if (!isRoomKey(input.roomKey)) throw new Error("객실을 선택해주세요.");
  const room = ROOMS[input.roomKey];
  if (
    !Number.isInteger(input.guestsCount) ||
    input.guestsCount < room.minGuests ||
    input.guestsCount > room.maxGuests
  ) {
    throw new Error(
      `${room.title}은 최소 ${room.minGuests}인 / 최대 ${room.maxGuests}인까지 예약 가능합니다.`,
    );
  }
  if (input.status !== "pending" && input.status !== "confirmed") {
    throw new Error("등록 시 상태는 pending 또는 confirmed 여야 합니다.");
  }

  // 수기 등록은 수량 합계 ≠ 인원수 도 허용 (relaxed)
  const quote = await quoteReservation(
    input.packageSelections,
    input.checkIn,
    input.checkOut,
    input.guestsCount,
    { relaxed: true },
  );

  const finalPrice =
    typeof input.priceOverride === "number" && Number.isInteger(input.priceOverride)
      ? input.priceOverride
      : quote.total;
  const priceNote = input.priceOverride != null ? (input.priceNote ?? null) : null;

  const depositorRaw = (input.depositorName ?? "").trim() || reps[0].name.trim();
  const supabase = getSupabaseAdmin();

  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .insert({
      packages: toStored(quote.lines),
      package_label: quote.packageLabel,
      season: quote.season,
      guests_count: input.guestsCount,
      check_in: input.checkIn,
      check_out: input.checkOut,
      total_price: finalPrice,
      status: input.status,
      memo: input.memo ?? null,
      depositor_name_enc: encrypt(depositorRaw),
      room_key: input.roomKey,
      source: "manual",
      created_by_admin: admin.username,
      price_override: input.priceOverride ?? null,
      price_note: priceNote,
    })
    .select("*")
    .single();

  if (rErr || !reservation) {
    if (rErr?.message && /exclu|no_double_book|conflicting|overlap/i.test(rErr.message)) {
      throw new Error("선택하신 일정에 해당 객실이 이미 예약되었습니다.");
    }
    throw new Error(`예약 생성 실패: ${rErr?.message}`);
  }

  await writeGuestRows(reservation.id, input.guests, { rollbackReservationOnError: true });

  await supabase.from("reservation_history").insert({
    reservation_id: reservation.id,
    admin_username: admin.username,
    admin_display_name: admin.displayName,
    action: "admin_created",
    before_status: null,
    after_status: input.status,
  });

  return { reservation, quote, finalPrice };
}

// ========================================
// 관리자 편집 (필드 수정 + 변경 이력 기록)
// ========================================
type ReservationRow = {
  id: number;
  packages: unknown;
  package_label: string;
  season: string;
  guests_count: number;
  check_in: string;
  check_out: string;
  total_price: number;
  status: ReservationStatus;
  memo: string | null;
  depositor_name_enc: string | null;
  room_key: string | null;
  source: string;
  created_by_admin: string | null;
  price_override: number | null;
  price_note: string | null;
};

type FieldChange = { field: string; before: unknown; after: unknown };

export async function updateReservation(
  reservationId: number,
  input: AdminReservationInput,
  admin: { username: string; displayName: string },
) {
  if (input.guests.length === 0) throw new Error("예약자 정보를 1명 이상 입력해주세요.");
  const reps = input.guests.filter((g) => g.isRepresentative);
  if (reps.length !== 1) throw new Error("대표 예약자를 정확히 1명 지정해주세요.");
  if (!reps[0].phone || reps[0].phone.replace(/\D+/g, "").length < 9) {
    throw new Error("대표 예약자의 전화번호를 입력해주세요.");
  }
  if (!isRoomKey(input.roomKey)) throw new Error("객실을 선택해주세요.");
  if (input.status !== "pending" && input.status !== "confirmed") {
    throw new Error("편집 시 상태는 pending 또는 confirmed 여야 합니다. 취소는 별도 액션으로.");
  }

  const supabase = getSupabaseAdmin();

  // 현재 값 로드
  const { data: current, error: cErr } = await supabase
    .from("reservations")
    .select("*, reservation_guests(name_enc,phone_enc,is_representative)")
    .eq("id", reservationId)
    .single();
  if (cErr || !current) throw new Error("예약을 찾을 수 없습니다.");
  if (current.status === "cancelled") throw new Error("취소된 예약은 편집할 수 없습니다.");

  const cur = current as unknown as ReservationRow & {
    reservation_guests: Array<{ name_enc: string; phone_enc: string | null; is_representative: boolean }>;
  };

  // 재계산 (relaxed : 관리자는 수량-인원 불일치 허용)
  const quote = await quoteReservation(
    input.packageSelections,
    input.checkIn,
    input.checkOut,
    input.guestsCount,
    { relaxed: true },
  );

  const finalPrice =
    typeof input.priceOverride === "number" && Number.isInteger(input.priceOverride)
      ? input.priceOverride
      : quote.total;
  const priceNote = input.priceOverride != null ? (input.priceNote ?? null) : null;

  // guests 대표자 이름 (입금자명 자동 채움용)
  const depositorRaw = (input.depositorName ?? "").trim() || reps[0].name.trim();

  // 변경 diff 계산 (기록용)
  const changes: FieldChange[] = [];
  const push = (field: string, before: unknown, after: unknown) => {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes.push({ field, before, after });
    }
  };
  push("checkIn", cur.check_in, input.checkIn);
  push("checkOut", cur.check_out, input.checkOut);
  push("roomKey", cur.room_key, input.roomKey);
  push("guestsCount", cur.guests_count, input.guestsCount);
  push("status", cur.status, input.status);
  push("memo", cur.memo ?? "", input.memo ?? "");
  push("season", cur.season, quote.season);
  push("packageLabel", cur.package_label, quote.packageLabel);
  push("totalPrice", cur.total_price, finalPrice);
  push("priceOverride", cur.price_override, input.priceOverride ?? null);
  push("priceNote", cur.price_note, priceNote);

  // guests 는 이름 리스트로 비교 (암호문 그대로는 매번 달라짐)
  const prevGuestNames = cur.reservation_guests
    .map((g) => decrypt(g.name_enc))
    .sort();
  const nextGuestNames = [...input.guests.map((g) => g.name.trim())].sort();
  push("guests", prevGuestNames.join(", "), nextGuestNames.join(", "));

  // 입금자명 변경
  const prevDepositor = cur.depositor_name_enc ? decrypt(cur.depositor_name_enc) : "";
  push("depositorName", prevDepositor, depositorRaw);

  // 실제 업데이트
  const { error: uErr } = await supabase
    .from("reservations")
    .update({
      packages: toStored(quote.lines),
      package_label: quote.packageLabel,
      season: quote.season,
      guests_count: input.guestsCount,
      check_in: input.checkIn,
      check_out: input.checkOut,
      total_price: finalPrice,
      status: input.status,
      memo: input.memo ?? null,
      depositor_name_enc: encrypt(depositorRaw),
      room_key: input.roomKey,
      price_override: input.priceOverride ?? null,
      price_note: priceNote,
      last_edited_at: new Date().toISOString(),
      last_edited_by: admin.username,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId);

  if (uErr) {
    if (uErr.message && /exclu|no_double_book|conflicting|overlap/i.test(uErr.message)) {
      throw new Error("변경한 일정·객실이 다른 예약과 겹칩니다.");
    }
    throw new Error(`예약 수정 실패: ${uErr.message}`);
  }

  // guests 전체 교체 (편집은 자주 있지 않고 5명 내외라 delete + insert 로 단순화)
  const { error: dgErr } = await supabase
    .from("reservation_guests")
    .delete()
    .eq("reservation_id", reservationId);
  if (dgErr) throw new Error(`예약자 정리 실패: ${dgErr.message}`);
  await writeGuestRows(reservationId, input.guests, { rollbackReservationOnError: false });

  // 이력 기록 (변경사항 있을 때만)
  if (changes.length > 0) {
    await supabase.from("reservation_history").insert({
      reservation_id: reservationId,
      admin_username: admin.username,
      admin_display_name: admin.displayName,
      action: "edited",
      before_status: cur.status,
      after_status: input.status,
      changes,
    });
  }

  return { changes };
}

async function writeGuestRows(
  reservationId: number,
  guests: GuestInput[],
  opts: { rollbackReservationOnError: boolean },
) {
  const supabase = getSupabaseAdmin();
  const guestRows = guests.map((g) => ({
    reservation_id: reservationId,
    name_enc: encrypt(g.name.trim()),
    phone_enc: g.phone ? encrypt(g.phone.trim()) : null,
    phone_hash: g.phone ? hashPhone(g.phone) : null,
    is_representative: g.isRepresentative,
  }));
  const { error } = await supabase.from("reservation_guests").insert(guestRows);
  if (error) {
    if (opts.rollbackReservationOnError) {
      await supabase.from("reservations").delete().eq("id", reservationId);
    }
    throw new Error(`예약자 저장 실패: ${error.message}`);
  }
}

// ========================================
// Admin row (list) — 확장
// ========================================
export type AdminGuestDetail = { name: string; phone: string | null; isRepresentative: boolean };

export type AdminReservationRow = {
  id: number;
  status: ReservationStatus;
  packages: StoredPackage[];
  package_label: string;
  room_key: RoomKey | null;
  season: string;
  guests_count: number;
  check_in: string;
  check_out: string;
  total_price: number;
  memo: string | null;
  depositor_name: string | null;
  source: "online" | "manual";
  created_by_admin: string | null;
  price_override: number | null;
  price_note: string | null;
  last_edited_at: string | null;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
  representative: { name: string; phone: string | null } | null;
  guest_names: string[];
  guests: AdminGuestDetail[]; // 편집용 전체 게스트 정보
};

export type RoomAvailability = Record<RoomKey, boolean>;

// excludeId : 편집 시 자기 자신은 충돌 판정에서 제외
export async function getRoomAvailability(
  checkIn: string,
  checkOut: string,
  excludeId?: number,
): Promise<RoomAvailability> {
  const result = Object.fromEntries(ROOM_KEYS.map((k) => [k, true])) as RoomAvailability;
  const nights = nightsBetween(checkIn, checkOut);
  if (nights.length === 0) return result;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("reservations")
    .select("id, room_key, check_in, check_out, status")
    .in("status", ["pending", "confirmed"])
    .not("room_key", "is", null)
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);
  if (excludeId != null) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw new Error(`객실 조회 실패: ${error.message}`);

  for (const r of data ?? []) {
    if (isRoomKey(r.room_key)) result[r.room_key] = false;
  }
  return result;
}

export async function listReservationsForAdmin(opts: {
  status?: ReservationStatus;
  mask?: boolean;
}): Promise<AdminReservationRow[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("reservations")
    .select(
      "id,status,packages,package_label,room_key,season,guests_count,check_in,check_out,total_price,memo,depositor_name_enc,source,created_by_admin,price_override,price_note,last_edited_at,last_edited_by,created_at,updated_at,reservation_guests(name_enc,phone_enc,is_representative)",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (opts.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  if (error) throw new Error(`예약 조회 실패: ${error.message}`);

  return (data ?? []).map((r) => {
    const guestRows = (r.reservation_guests ?? []) as Array<{
      name_enc: string;
      phone_enc: string | null;
      is_representative: boolean;
    }>;
    const decrypted: AdminGuestDetail[] = guestRows.map((g) => {
      const n = decrypt(g.name_enc);
      const p = g.phone_enc ? decrypt(g.phone_enc) : null;
      return {
        name: opts.mask ? maskName(n) : n,
        phone: opts.mask && p ? maskPhone(p) : p,
        isRepresentative: g.is_representative,
      };
    });
    // 대표자를 앞으로 정렬
    decrypted.sort((a, b) => Number(b.isRepresentative) - Number(a.isRepresentative));
    const rep = decrypted.find((g) => g.isRepresentative) ?? null;
    const depositor = r.depositor_name_enc ? decrypt(r.depositor_name_enc) : null;

    return {
      id: r.id,
      status: r.status,
      packages: parseStored(r.packages),
      package_label: r.package_label,
      room_key: isRoomKey(r.room_key) ? r.room_key : null,
      season: r.season,
      guests_count: r.guests_count,
      check_in: r.check_in,
      check_out: r.check_out,
      total_price: r.total_price,
      memo: r.memo,
      depositor_name: depositor ? (opts.mask ? maskName(depositor) : depositor) : null,
      source: (r.source === "manual" ? "manual" : "online") as "manual" | "online",
      created_by_admin: r.created_by_admin ?? null,
      price_override: r.price_override ?? null,
      price_note: r.price_note ?? null,
      last_edited_at: r.last_edited_at ?? null,
      last_edited_by: r.last_edited_by ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      representative: rep ? { name: rep.name, phone: rep.phone } : null,
      guest_names: decrypted.map((g) => g.name),
      guests: decrypted,
    };
  });
}

export async function transitionReservation(
  reservationId: number,
  after: ReservationStatus,
  adminUsername: string,
  adminDisplayName: string,
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("transition_reservation", {
    p_reservation_id: reservationId,
    p_after_status: after,
    p_admin_username: adminUsername,
    p_admin_display_name: adminDisplayName,
  });
  if (error) throw new Error(`상태 전이 실패: ${error.message}`);
  return data;
}

export type ReservationHistoryChange = {
  field: string;
  before: unknown;
  after: unknown;
};

export type ReservationHistoryEntry = {
  id: number;
  reservation_id: number;
  admin_username: string | null;
  admin_display_name: string | null;
  action: string;
  before_status: ReservationStatus | null;
  after_status: ReservationStatus | null;
  changes: ReservationHistoryChange[] | null;
  created_at: string;
};

export async function listReservationHistory(
  reservationId: number,
): Promise<ReservationHistoryEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reservation_history")
    .select(
      "id,reservation_id,admin_username,admin_display_name,action,before_status,after_status,changes,created_at",
    )
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(`이력 조회 실패: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    reservation_id: r.reservation_id,
    admin_username: r.admin_username,
    admin_display_name: r.admin_display_name,
    action: r.action,
    before_status: r.before_status,
    after_status: r.after_status,
    changes: Array.isArray(r.changes) ? (r.changes as ReservationHistoryChange[]) : null,
    created_at: r.created_at,
  }));
}

export { CONFIG_KEYS, CONFIG_LABELS, dayTypeForDate, seasonForDate };
