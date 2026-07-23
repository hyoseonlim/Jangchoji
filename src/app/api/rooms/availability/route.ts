import { NextResponse } from "next/server";
import { getRoomAvailability } from "@/lib/reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  if (!checkIn || !ISO_DATE_RE.test(checkIn)) {
    return NextResponse.json({ error: "checkIn 형식 오류" }, { status: 400 });
  }
  if (!checkOut || !ISO_DATE_RE.test(checkOut)) {
    return NextResponse.json({ error: "checkOut 형식 오류" }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: "체크아웃은 체크인 이후여야 합니다." }, { status: 400 });
  }
  try {
    const availability = await getRoomAvailability(checkIn, checkOut);
    return NextResponse.json({ availability }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
