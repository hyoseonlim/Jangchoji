import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { listReservationsForAdmin, type ReservationStatus } from "@/lib/reservations";

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
