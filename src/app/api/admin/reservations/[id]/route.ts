import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import {
  assignRoomAndConfirm,
  getReservationForAdmin,
  moveReservationRoom,
  transitionReservation,
  type ReservationStatus,
} from "@/lib/reservations";
import { isRoomKey } from "@/lib/rooms";
import { notifyReservationConfirmedBySms } from "@/lib/solapi";

export const runtime = "nodejs";

function formatCompactDate(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
}

function formatReservationSmsDateLine(reservation: {
  reservation_type: "stay" | "day_use";
  check_in: string;
  check_out: string;
}) {
  if (reservation.reservation_type === "day_use") {
    return formatCompactDate(reservation.check_in);
  }
  return `${formatCompactDate(reservation.check_in)}~${formatCompactDate(reservation.check_out)}`;
}

async function notifyConfirmedReservation(reservationId: number) {
  let reservation;
  try {
    reservation = await getReservationForAdmin(reservationId, { mask: false });
  } catch (err) {
    console.error("[solapi] 예약 확정 문자 대상 조회 실패:", err);
    return;
  }
  if (!reservation?.representative) {
    console.warn("[solapi] 예약 확정 문자 수신 대표자 없음 - 문자 발송 스킵");
    return;
  }

  await notifyReservationConfirmedBySms({
    to: reservation.representative.phone ?? undefined,
    name: reservation.representative.name,
    reservationType: reservation.reservation_type,
    dateLine: formatReservationSmsDateLine({
      reservation_type: reservation.reservation_type,
      check_in: reservation.check_in,
      check_out: reservation.check_out,
    }),
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (admin.role !== "admin") {
    return NextResponse.json(
      { error: "조회 권한 관리자는 예약 상태를 변경할 수 없습니다." },
      { status: 403 },
    );
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
  const b = body as Record<string, unknown>;
  const action = b.action;

  try {
    if (action === "assign_room") {
      const roomKey = b.roomKey;
      if (!isRoomKey(roomKey)) {
        return NextResponse.json({ error: "roomKey 가 올바르지 않습니다." }, { status: 400 });
      }
      await assignRoomAndConfirm(id, roomKey, {
        username: admin.username,
        displayName: admin.displayName,
      });
      await notifyConfirmedReservation(id);
      return NextResponse.json({ ok: true });
    }

    if (action === "move_room") {
      const roomKey = b.roomKey;
      if (!isRoomKey(roomKey)) {
        return NextResponse.json({ error: "roomKey 가 올바르지 않습니다." }, { status: 400 });
      }
      const result = await moveReservationRoom(id, roomKey, {
        username: admin.username,
        displayName: admin.displayName,
      });
      return NextResponse.json({ ok: true, result });
    }

    let next: ReservationStatus;
    if (action === "confirm") next = "confirmed";
    else if (action === "cancel") next = "cancelled";
    else {
      return NextResponse.json(
        { error: "action 은 confirm | cancel | assign_room | move_room 이어야 합니다." },
        { status: 400 },
      );
    }

    const updated = await transitionReservation(id, next, admin.username, admin.displayName);
    if (next === "confirmed") {
      await notifyConfirmedReservation(id);
    }
    return NextResponse.json({ ok: true, reservation: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "상태 변경 실패";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
