import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { swapReservationRooms } from "@/lib/reservations";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (admin.role !== "admin") {
    return NextResponse.json({ error: "변경 권한이 없습니다." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const idA = Number(b.idA);
  const idB = Number(b.idB);
  if (!Number.isInteger(idA) || idA <= 0 || !Number.isInteger(idB) || idB <= 0) {
    return NextResponse.json({ error: "idA / idB 형식 오류" }, { status: 400 });
  }
  if (idA === idB) {
    return NextResponse.json({ error: "서로 다른 두 예약을 선택해주세요." }, { status: 400 });
  }

  try {
    await swapReservationRooms(idA, idB, {
      username: admin.username,
      displayName: admin.displayName,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "호실 스왑 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
