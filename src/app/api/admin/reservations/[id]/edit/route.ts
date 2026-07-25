import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { updateReservation } from "@/lib/reservations";
import { parseAdminInputBody } from "../../_shared";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (admin.role !== "admin") {
    return NextResponse.json({ error: "변경 권한이 없습니다." }, { status: 403 });
  }

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "잘못된 id" }, { status: 400 });
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
    const { changes } = await updateReservation(id, parsed.input, {
      username: admin.username,
      displayName: admin.displayName,
    });
    return NextResponse.json({ ok: true, changes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "예약 수정 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
