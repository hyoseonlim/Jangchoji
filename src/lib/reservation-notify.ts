import "server-only";
import { getSupabaseAdmin } from "./supabase-server";
import { decrypt } from "./encryption";
import { sendSms } from "./sms";

// 관리자 예약 확정 시 대표 예약자에게 안내 문자 발송.
// 실패해도 예약 확정 흐름은 절대 중단하지 않는다 (best-effort).

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

function formatDateKR(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const w = WEEKDAY_KO[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일(${w})`;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const [ay, am, ad] = checkIn.split("-").map(Number);
  const [by, bm, bd] = checkOut.split("-").map(Number);
  const a = new Date(ay, am - 1, ad).getTime();
  const b = new Date(by, bm - 1, bd).getTime();
  return Math.max(1, Math.round((b - a) / 86400000));
}

export async function sendReservationConfirmSms(reservationId: number): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id,reservation_type,status,check_in,check_out,reservation_guests(name_enc,phone_enc,is_representative)",
    )
    .eq("id", reservationId)
    .single();
  if (error || !data) {
    console.error(`[sms] 예약 ${reservationId} 조회 실패`, error?.message);
    return;
  }
  if (data.status !== "confirmed") {
    console.warn(`[sms] 예약 ${reservationId} 상태가 confirmed 가 아님(${data.status}) — 발송 스킵`);
    return;
  }

  const guests = (data.reservation_guests ?? []) as Array<{
    name_enc: string;
    phone_enc: string | null;
    is_representative: boolean;
  }>;
  const rep = guests.find((g) => g.is_representative);
  if (!rep) {
    console.warn(`[sms] 예약 ${reservationId} 대표자 없음 — 발송 스킵`);
    return;
  }
  const phone = rep.phone_enc ? decrypt(rep.phone_enc) : null;
  if (!phone) {
    console.warn(`[sms] 예약 ${reservationId} 대표자 전화 없음 — 발송 스킵`);
    return;
  }
  const name = decrypt(rep.name_enc);

  const text = buildConfirmMessage({
    name,
    reservationType: data.reservation_type === "day_use" ? "day_use" : "stay",
    checkIn: data.check_in,
    checkOut: data.check_out,
  });

  const result = await sendSms({
    to: phone,
    text,
    subject: "[건전한레저] 예약 확인",
  });
  if (!result.ok) {
    console.error(`[sms] 예약 ${reservationId} 문자 발송 실패: ${result.error}`);
  }
}

function buildConfirmMessage(opts: {
  name: string;
  reservationType: "stay" | "day_use";
  checkIn: string;
  checkOut: string;
}): string {
  const scheduleLine =
    opts.reservationType === "day_use"
      ? formatDateKR(opts.checkIn)
      : `${formatDateKR(opts.checkIn)} ~ ${formatDateKR(opts.checkOut)} / ${nightsBetween(
          opts.checkIn,
          opts.checkOut,
        )}박`;

  return `안녕하세요.
건전한레저입니다. 😊

예약해 주셔서 감사합니다.
아래 예약 내용을 확인해 주세요.

■ 예약자
${opts.name}

■ 이용 일정
${scheduleLine}

■ 추가 이용 안내
플라이피쉬는 놀이기구 패키지에 포함되지 않으며,
이용 시 1인 15,000원이 추가됩니다.
(현장 결제 가능)

■ 객실 안내

- 간단한 취사도구, 전자레인지, 냉장고 구비
- 밥솥과 물컵은 제공되지 않습니다.
- 세면도구(칫솔, 치약, 수건 등)는 개별 준비해 주세요.

■ 입·퇴실 안내

- 입실 : 오후 3시
- 퇴실 : 오전 11시

입실 전과 퇴실 후에도 워터파크 및 수상레저 이용이 가능합니다.

■ 놀이기구 운영시간
성수기(7월 17일 ~ 8월 16일)
오전 9:00 ~ 오후 6:00
(점심시간 오후 1:00 ~ 2:00)

비수기 평일
오전 10:00 ~ 오후 6:00

비수기 주말
오전 9:00 ~ 오후 6:00

■ 홈페이지
건전한레저.com

■ 주소
경기도 가평군 가평읍 북한강변로 226-28

문의
010-9159-6448

즐겁고 안전한 추억을 만들 수 있도록 최선을 다해 준비하겠습니다.
감사합니다.
건전한레저 드림`;
}
