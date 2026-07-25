import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import {
  adminCreateReservation,
  listReservationsForAdmin,
  type ReservationStatus,
} from "@/lib/reservations";
import { parseAdminInputBody } from "./_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status: ReservationStatus | undefined =
    statusParam === "pending" || statusParam === "confirmed" || statusParam === "cancelled"
      ? statusParam
      : undefined;

  try {
    const rows = await listReservationsForAdmin({ status, mask: false });
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 관리자 수기 예약 등록
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
  const parsed = parseAdminInputBody(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const { reservation } = await adminCreateReservation(parsed.input, {
      username: admin.username,
      displayName: admin.displayName,
    });
    return NextResponse.json({
      id: reservation.id,
      status: reservation.status,
      totalPrice: reservation.total_price,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "예약 등록 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
