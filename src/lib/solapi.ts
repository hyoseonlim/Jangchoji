import "server-only";
import { createHmac, randomBytes } from "node:crypto";

type SolapiMessage = {
  to: string;
  from: string;
  text: string;
};

type ReservationSmsInput = {
  to?: string;
  name: string;
  reservationType: "stay" | "day_use";
  dateLine: string;
};

const SOLAPI_SEND_URL = "https://api.solapi.com/messages/v4/send-many/detail";

function normalizePhoneNumber(value: string | undefined): string | null {
  const digits = value?.replace(/\D+/g, "") ?? "";
  if (digits.length < 9 || digits.length > 11) return null;
  return digits;
}

function createAuthHeader(apiKey: string, apiSecret: string): string {
  const dateTime = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", apiSecret)
    .update(dateTime + salt)
    .digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}`;
}

async function sendSolapiMessage(message: SolapiMessage): Promise<void> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  if (!apiKey || !apiSecret) {
    console.warn("[solapi] SOLAPI_API_KEY / SOLAPI_API_SECRET 미설정 - 문자 발송 스킵");
    return;
  }

  const res = await fetch(SOLAPI_SEND_URL, {
    method: "POST",
    headers: {
      authorization: createAuthHeader(apiKey, apiSecret),
      "content-type": "application/json",
    },
    body: JSON.stringify({ messages: [message] }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SOLAPI 응답 오류 status=${res.status} body=${body}`);
  }

  const data = (await res.json().catch(() => null)) as
    | { failedMessageList?: Array<{ statusCode?: string; statusMessage?: string }> }
    | null;
  const failed = data?.failedMessageList?.[0];
  if (failed) {
    throw new Error(`SOLAPI 메시지 등록 실패 code=${failed.statusCode ?? "-"} message=${failed.statusMessage ?? "-"}`);
  }
}

function buildReservationConfirmedText(input: ReservationSmsInput): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") || "https://건전한레저.com";
  const infoPath = input.reservationType === "day_use" ? "/i/day" : "/i/stay";
  const infoUrl = `${siteUrl}${infoPath}`.replace(/^https?:\/\//, "");

  return (
    `[건전한레저 확정 안내]\n` +
    `♥ ${input.name}님 (${input.dateLine})\n` +
    `♥ 안내: ${infoUrl}`
  );
}

export async function notifyReservationConfirmedBySms(input: ReservationSmsInput): Promise<void> {
  if (process.env.SOLAPI_RESERVATION_SMS_ENABLED === "false") {
    return;
  }

  const from = normalizePhoneNumber(process.env.SOLAPI_FROM);
  if (!from) {
    console.warn("[solapi] SOLAPI_FROM 미설정 또는 형식 오류 - 문자 발송 스킵");
    return;
  }

  const to = normalizePhoneNumber(input.to);
  if (!to) {
    console.warn("[solapi] 수신번호 없음 또는 형식 오류 - 문자 발송 스킵");
    return;
  }

  try {
    await sendSolapiMessage({
      to,
      from,
      text: buildReservationConfirmedText(input),
    });
  } catch (err) {
    console.error("[solapi] 예약 확정 문자 발송 실패:", err);
  }
}
