import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { listReservationHistory } from "@/lib/reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "잘못된 id" }, { status: 400 });
  }

  try {
    const entries = await listReservationHistory(id);
    return NextResponse.json(
      { entries },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "이력 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
