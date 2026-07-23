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
import { ROOMS, ROOM_KEYS, type RoomKey, isRoomKey } from "./rooms";

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export type GuestInput = { name: string; phone?: string; isRepresentative: boolean };

// 현재 스코프: 4인 이상 숙박 패키지만 예약 가능 (2-3인 상품은 데이터로만 보관, 사용 안 함).
export const FIXED_GROUP_SIZE: GroupSize = "4";
export const MIN_GUESTS = 4;

export type CreateReservationInput = {
  packageSelections: PackageSelections;
  roomKey: RoomKey;
  guestsCount: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: GuestInput[];
  memo?: string;
  depositorName?: string;
  paymentConfirmed: boolean;
};

export type QuoteResult = {
  total: number;
  guestsCount: number;
  lines: PackageLine[];
  season: "peak" | "off" | "mixed";
  packageLabel: string;
};

// 현재 스코프(group_size='4') 에서 활성 상품의 (config_key, season, day_type, price) 를 반환.
// 예약 폼 서버 렌더링 시 프리페치 → 클라이언트가 로컬에서 총액 계산.
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

// 서버 사이드에서 총액 계산 : products.price(1인 1박) × 밤 수 × 수량.
export async function quoteReservation(
  packageSelections: PackageSelections,
  checkIn: string,
  checkOut: string,
  guestsCount: number,
  groupSize: GroupSize = FIXED_GROUP_SIZE,
): Promise<QuoteResult> {
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
  if (!data || data.length === 0) {
    throw new Error("상품 가격이 등록되지 않았습니다.");
  }

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
  if (result.totalQuantity !== guestsCount) {
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

// packages JSONB 컬럼에 저장할 원소 shape
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
  if (!isRoomKey(input.roomKey)) {
    throw new Error("객실을 선택해주세요.");
  }
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

  const quote = await quoteReservation(
    input.packageSelections,
    input.checkIn,
    input.checkOut,
    input.guestsCount,
  );

  const depositorRaw = (input.depositorName ?? "").trim() || reps[0].name.trim();
  const supabase = getSupabaseAdmin();

  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .insert({
      packages: toStored(quote.lines),
      package_label: quote.packageLabel,
      season: quote.season,
      group_size: FIXED_GROUP_SIZE,
      guests_count: input.guestsCount,
      check_in: input.checkIn,
      check_out: input.checkOut,
      total_price: quote.total,
      status: "pending",
      memo: input.memo ?? null,
      depositor_name_enc: encrypt(depositorRaw),
      room_key: input.roomKey,
    })
    .select("*")
    .single();

  if (rErr || !reservation) {
    if (rErr?.message && /exclu|no_double_book|conflicting|overlap/i.test(rErr.message)) {
      throw new Error("선택하신 일정에 해당 객실이 이미 예약되었습니다. 다른 객실이나 날짜를 선택해주세요.");
    }
    throw new Error(`예약 생성 실패: ${rErr?.message}`);
  }

  const guestRows = input.guests.map((g) => ({
    reservation_id: reservation.id,
    name_enc: encrypt(g.name.trim()),
    phone_enc: g.phone ? encrypt(g.phone.trim()) : null,
    phone_hash: g.phone ? hashPhone(g.phone) : null,
    is_representative: g.isRepresentative,
  }));

  const { error: gErr } = await supabase.from("reservation_guests").insert(guestRows);
  if (gErr) {
    await supabase.from("reservations").delete().eq("id", reservation.id);
    throw new Error(`예약자 저장 실패: ${gErr.message}`);
  }

  await supabase.from("reservation_history").insert({
    reservation_id: reservation.id,
    admin_username: null,
    action: "created",
    before_status: null,
    after_status: "pending",
  });

  return { reservation, quote };
}

export type AdminReservationRow = {
  id: number;
  status: ReservationStatus;
  packages: StoredPackage[];
  package_label: string;
  room_key: RoomKey | null;
  season: string;
  group_size: string;
  guests_count: number;
  check_in: string;
  check_out: string;
  total_price: number;
  memo: string | null;
  depositor_name: string | null;
  created_at: string;
  updated_at: string;
  representative: { name: string; phone: string | null } | null;
  guest_names: string[];
};

export type RoomAvailability = Record<RoomKey, boolean>;

export async function getRoomAvailability(
  checkIn: string,
  checkOut: string,
): Promise<RoomAvailability> {
  const result = Object.fromEntries(ROOM_KEYS.map((k) => [k, true])) as RoomAvailability;
  const nights = nightsBetween(checkIn, checkOut);
  if (nights.length === 0) return result;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reservations")
    .select("room_key, check_in, check_out, status")
    .in("status", ["pending", "confirmed"])
    .not("room_key", "is", null)
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

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
      "id,status,packages,package_label,room_key,season,group_size,guests_count,check_in,check_out,total_price,memo,depositor_name_enc,created_at,updated_at,reservation_guests(name_enc,phone_enc,is_representative)",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (opts.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  if (error) throw new Error(`예약 조회 실패: ${error.message}`);

  return (data ?? []).map((r) => {
    const guests = (r.reservation_guests ?? []) as Array<{
      name_enc: string;
      phone_enc: string | null;
      is_representative: boolean;
    }>;
    const rep = guests.find((g) => g.is_representative);
    const decryptGuest = (name: string, phone: string | null) => {
      const n = decrypt(name);
      const p = phone ? decrypt(phone) : null;
      return { name: opts.mask ? maskName(n) : n, phone: opts.mask && p ? maskPhone(p) : p };
    };
    const depositor = r.depositor_name_enc ? decrypt(r.depositor_name_enc) : null;
    return {
      id: r.id,
      status: r.status,
      packages: parseStored(r.packages),
      package_label: r.package_label,
      room_key: isRoomKey(r.room_key) ? r.room_key : null,
      season: r.season,
      group_size: r.group_size,
      guests_count: r.guests_count,
      check_in: r.check_in,
      check_out: r.check_out,
      total_price: r.total_price,
      memo: r.memo,
      depositor_name: depositor ? (opts.mask ? maskName(depositor) : depositor) : null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      representative: rep ? decryptGuest(rep.name_enc, rep.phone_enc) : null,
      guest_names: guests.map((g) => {
        const n = decrypt(g.name_enc);
        return opts.mask ? maskName(n) : n;
      }),
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

export type ReservationHistoryEntry = {
  id: number;
  reservation_id: number;
  admin_username: string | null;
  admin_display_name: string | null;
  action: string;
  before_status: ReservationStatus | null;
  after_status: ReservationStatus | null;
  created_at: string;
};

export async function listReservationHistory(
  reservationId: number,
): Promise<ReservationHistoryEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reservation_history")
    .select(
      "id,reservation_id,admin_username,admin_display_name,action,before_status,after_status,created_at",
    )
    .eq("reservation_id", reservationId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(`이력 조회 실패: ${error.message}`);
  return (data ?? []) as ReservationHistoryEntry[];
}

// dayTypeForDate 를 별도 유틸로 export 하지 않지만, 향후 이력 표시 등에 필요할 때를 위해 유지.
export { CONFIG_KEYS, CONFIG_LABELS, dayTypeForDate, seasonForDate };
