import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "호실 변경은 각 예약 상세의 호실 바꾸기에서만 가능합니다." },
    { status: 410 },
  );
}
