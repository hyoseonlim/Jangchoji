import { isConfigKey, type PackageSelections } from "@/lib/pricing";
import { isRoomKey, ROOMS } from "@/lib/rooms";
import type { AdminReservationInput, GuestInput } from "@/lib/reservations";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type GuestBody = { name?: unknown; phone?: unknown; isRepresentative?: unknown };

function parseSelections(v: unknown): PackageSelections | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  const out: PackageSelections = {};
  for (const [k, val] of Object.entries(v)) {
    if (!isConfigKey(k)) return null;
    if (typeof val !== "number" || !Number.isInteger(val) || val < 0 || val > 50) return null;
    if (val > 0) out[k] = val;
  }
  return out;
}

export type ParsedResult =
  | { input: AdminReservationInput }
  | { error: string };

// 관리자 수기 등록·편집에 공통으로 쓰는 body 파서 (온라인 폼과 달리 relaxed).
export function parseAdminInputBody(body: unknown): ParsedResult {
  if (typeof body !== "object" || body === null) return { error: "잘못된 요청 본문" };
  const b = body as Record<string, unknown>;

  const selections = parseSelections(b.packageSelections);
  if (!selections || Object.keys(selections).length === 0) {
    return { error: "패키지를 1개 이상 선택해주세요." };
  }

  if (!isRoomKey(b.roomKey)) return { error: "객실을 선택해주세요." };
  const room = ROOMS[b.roomKey];

  if (
    typeof b.guestsCount !== "number" ||
    !Number.isInteger(b.guestsCount) ||
    b.guestsCount < room.minGuests ||
    b.guestsCount > room.maxGuests
  ) {
    return {
      error: `${room.title}은 최소 ${room.minGuests}인 / 최대 ${room.maxGuests}인까지 예약 가능합니다.`,
    };
  }
  if (typeof b.checkIn !== "string" || !ISO_DATE_RE.test(b.checkIn)) return { error: "checkIn 형식 오류" };
  if (typeof b.checkOut !== "string" || !ISO_DATE_RE.test(b.checkOut)) return { error: "checkOut 형식 오류" };
  if (b.checkOut <= b.checkIn) return { error: "체크아웃은 체크인 이후여야 합니다." };
  if (!Array.isArray(b.guests)) return { error: "guests 형식 오류" };

  let guests: GuestInput[];
  try {
    guests = (b.guests as GuestBody[]).map((g, i) => {
      if (typeof g.name !== "string" || g.name.trim().length === 0 || g.name.trim().length > 40) {
        throw new Error(`${i + 1}번째 예약자 이름을 확인해주세요.`);
      }
      if (g.phone != null && typeof g.phone !== "string") {
        throw new Error(`${i + 1}번째 예약자 전화번호 형식 오류`);
      }
      return {
        name: g.name.trim(),
        phone: typeof g.phone === "string" && g.phone.trim().length > 0 ? g.phone.trim() : undefined,
        isRepresentative: g.isRepresentative === true,
      };
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "예약자 정보 오류" };
  }

  const status = b.status;
  if (status !== "pending" && status !== "confirmed") {
    return { error: "status 는 pending 또는 confirmed 여야 합니다." };
  }

  const memo =
    typeof b.memo === "string" && b.memo.trim().length > 0 ? b.memo.trim().slice(0, 1000) : undefined;
  const depositorName =
    typeof b.depositorName === "string" && b.depositorName.trim().length > 0
      ? b.depositorName.trim().slice(0, 40)
      : undefined;

  let priceOverride: number | undefined;
  let priceNote: string | undefined;
  if (b.priceOverride != null) {
    if (typeof b.priceOverride !== "number" || !Number.isInteger(b.priceOverride)) {
      return { error: "priceOverride 는 정수여야 합니다." };
    }
    priceOverride = b.priceOverride;
    if (typeof b.priceNote !== "string" || b.priceNote.trim().length === 0) {
      return { error: "가격 오버라이드 사유(priceNote)를 입력해주세요." };
    }
    priceNote = b.priceNote.trim().slice(0, 200);
  }

  return {
    input: {
      packageSelections: selections,
      roomKey: b.roomKey,
      guestsCount: b.guestsCount,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      guests,
      memo,
      depositorName,
      status,
      priceOverride,
      priceNote,
    },
  };
}
