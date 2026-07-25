import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { getRoomAvailability } from "@/lib/reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 관리자 편집·수기 등록 시 사용. excludeId 로 자기 자신을 충돌 판정에서 제외 가능.
export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const excludeIdRaw = searchParams.get("excludeId");
  if (!checkIn || !ISO_DATE_RE.test(checkIn)) {
    return NextResponse.json({ error: "checkIn 형식 오류" }, { status: 400 });
  }
  if (!checkOut || !ISO_DATE_RE.test(checkOut)) {
    return NextResponse.json({ error: "checkOut 형식 오류" }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: "체크아웃은 체크인 이후여야 합니다." }, { status: 400 });
  }
  let excludeId: number | undefined;
  if (excludeIdRaw) {
    const n = Number(excludeIdRaw);
    if (!Number.isInteger(n) || n <= 0) {
      return NextResponse.json({ error: "excludeId 형식 오류" }, { status: 400 });
    }
    excludeId = n;
  }
  try {
    const availability = await getRoomAvailability(checkIn, checkOut, excludeId);
    return NextResponse.json({ availability }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
