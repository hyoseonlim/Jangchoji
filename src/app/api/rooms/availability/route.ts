import { NextResponse } from "next/server";
import {
  checkCapacity,
  MIN_GUESTS,
  validateOnlineGuestPolicy,
} from "@/lib/reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 고객 예약 폼용 이진 판정.
// 요청 : ?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guestsCount=N
// 응답 : { available: boolean, reason?: string }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const guestsRaw = searchParams.get("guestsCount");
  if (!checkIn || !ISO_DATE_RE.test(checkIn)) {
    return NextResponse.json({ error: "checkIn 형식 오류" }, { status: 400 });
  }
  if (!checkOut || !ISO_DATE_RE.test(checkOut)) {
    return NextResponse.json({ error: "checkOut 형식 오류" }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: "체크아웃은 체크인 이후여야 합니다." }, { status: 400 });
  }
  const guestsCount = Number(guestsRaw);
  if (!Number.isInteger(guestsCount) || guestsCount < MIN_GUESTS) {
    return NextResponse.json(
      { error: `guestsCount 는 ${MIN_GUESTS} 이상 정수여야 합니다.` },
      { status: 400 },
    );
  }
  const policyError = validateOnlineGuestPolicy(checkIn, checkOut, guestsCount);
  if (policyError) {
    return NextResponse.json(
      {
        available: false,
        reason: policyError,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }
  try {
    const ok = await checkCapacity(checkIn, checkOut, guestsCount);
    return NextResponse.json(
      ok ? { available: true } : { available: false, reason: "선택하신 일정은 예약이 마감되었습니다." },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
