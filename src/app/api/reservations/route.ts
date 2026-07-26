import { NextResponse } from "next/server";
import { createReservation } from "@/lib/reservations";
import { isConfigKey, type PackageSelections } from "@/lib/pricing";
import { isRoomType, ROOM_TYPE_META } from "@/lib/rooms";
import { notifyAdmin } from "@/lib/discord";

export const runtime = "nodejs";

type GuestBody = { name?: unknown; phone?: unknown; isRepresentative?: unknown };

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseSelections(v: unknown): PackageSelections | null {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return null;
  const out: PackageSelections = {};
  for (const [k, val] of Object.entries(v)) {
    if (!isConfigKey(k)) return null;
    if (typeof val !== "number" || !Number.isInteger(val) || val < 0 || val > 20) return null;
    if (val > 0) out[k] = val;
  }
  return out;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("잘못된 요청 본문");
  }
  if (typeof body !== "object" || body === null) return badRequest("잘못된 요청 본문");
  const b = body as Record<string, unknown>;

  const selections = parseSelections(b.packageSelections);
  if (!selections || Object.keys(selections).length === 0) {
    return badRequest("패키지를 1개 이상 선택해주세요.");
  }
  const totalQuantity = Object.values(selections).reduce((s, n) => s + (n ?? 0), 0);

  if (!isRoomType(b.roomType)) return badRequest("객실 유형을 선택해주세요.");
  const roomType = ROOM_TYPE_META[b.roomType];
  if (
    typeof b.guestsCount !== "number" ||
    !Number.isInteger(b.guestsCount) ||
    b.guestsCount < roomType.minGuests ||
    b.guestsCount > roomType.maxGuests
  ) {
    return badRequest(
      `${roomType.title}은 최소 ${roomType.minGuests}인 / 최대 ${roomType.maxGuests}인까지 예약 가능합니다.`,
    );
  }
  if (totalQuantity !== b.guestsCount) {
    return badRequest(
      `선택한 패키지 수량(${totalQuantity}명)이 예약 인원(${b.guestsCount}명)과 일치해야 합니다.`,
    );
  }
  if (typeof b.checkIn !== "string" || !ISO_DATE_RE.test(b.checkIn)) return badRequest("checkIn 형식 오류");
  if (typeof b.checkOut !== "string" || !ISO_DATE_RE.test(b.checkOut)) return badRequest("checkOut 형식 오류");
  if (b.checkOut <= b.checkIn) return badRequest("체크아웃은 체크인 이후여야 합니다.");
  if (!Array.isArray(b.guests)) return badRequest("guests 형식 오류");
  if (b.paymentConfirmed !== true) return badRequest("입금 확인 체크가 필요합니다.");
  const memo = typeof b.memo === "string" ? b.memo.slice(0, 1000) : undefined;
  const depositorName =
    typeof b.depositorName === "string" && b.depositorName.trim().length > 0
      ? b.depositorName.trim().slice(0, 40)
      : undefined;

  let guests: { name: string; phone?: string; isRepresentative: boolean }[];
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
    return badRequest(err instanceof Error ? err.message : "예약자 정보 오류");
  }

  try {
    const { reservation, quote } = await createReservation({
      packageSelections: selections,
      roomType: b.roomType,
      guestsCount: b.guestsCount,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      guests,
      memo,
      depositorName,
      paymentConfirmed: true,
    });

    const rep = guests.find((g) => g.isRepresentative);
    const priceStr = new Intl.NumberFormat("ko-KR").format(quote.total);
    const memoLine = memo && memo.trim().length > 0 ? `요청사항: ${memo.trim()}\n` : "";
    await notifyAdmin(
      `날짜: ${reservation.check_in} ~ ${reservation.check_out}\n` +
      `예약자: ${rep?.name ?? "-"}\n` +
      `인원: ${reservation.guests_count}명\n` +
      `패키지명: ${quote.packageLabel}\n` +
      `입금금액: ₩${priceStr}\n` +
      memoLine +
      `[확인하러 가기](https://건전한레저.com/ko/admin)`,
    );

    return NextResponse.json({
      id: reservation.id,
      status: reservation.status,
      totalPrice: reservation.total_price,
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      packageLabel: reservation.package_label,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "예약 처리 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
