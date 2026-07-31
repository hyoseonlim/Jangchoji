import "server-only";
import { createHmac, randomBytes } from "node:crypto";

// Solapi (구 CoolSMS) 문자 발송.
// 환경변수 미설정 시 조용히 스킵 (개발 환경 편의).
// 설정 방법:
//   1) https://solapi.com 회원가입 → 사업자·발신번호 등록
//   2) 콘솔 → API Key 발급 → SOLAPI_API_KEY / SOLAPI_API_SECRET 저장
//   3) 발신번호(사업자 소유 유선/휴대전화)를 SMS_SENDER_NUMBER 에 저장
// 문자 유형 (KISA 규격) :
//   - SMS : ≤ 90 byte (한글 45자)
//   - LMS : ≤ 2000 byte (한글 약 1000자) — 자동 승격
// 한글 2byte 계산으로 자동 유형 선택.

const SOLAPI_URL = "https://api.solapi.com";

export type SendSmsOptions = {
  to: string;
  text: string;
  subject?: string; // LMS 제목 (40자 이내). 미지정 시 자동 생략.
  type?: "SMS" | "LMS"; // 미지정 시 본문 길이로 자동 선택
};

export type SendSmsResult =
  | { ok: true; groupId?: string; messageId?: string; type: "SMS" | "LMS" }
  | { ok: false; error: string };

export async function sendSms(opts: SendSmsOptions): Promise<SendSmsResult> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SMS_SENDER_NUMBER;
  if (!apiKey || !apiSecret || !from) {
    console.warn("[sms] Solapi 환경변수 미설정 — 발송 스킵");
    return { ok: false, error: "sms_not_configured" };
  }

  const to = normalizeKrPhone(opts.to);
  if (!to) return { ok: false, error: "invalid_phone" };

  const senderNorm = normalizeKrPhone(from);
  if (!senderNorm) return { ok: false, error: "invalid_sender" };

  const type: "SMS" | "LMS" = opts.type ?? (byteLenEucKr(opts.text) > 90 ? "LMS" : "SMS");
  const message: Record<string, unknown> = {
    to,
    from: senderNorm,
    text: opts.text,
    type,
  };
  if (type === "LMS" && opts.subject) {
    message.subject = opts.subject.slice(0, 40);
  }

  const date = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", apiSecret).update(date + salt).digest("hex");
  const auth = `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

  try {
    const res = await fetch(`${SOLAPI_URL}/messages/v4/send`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: auth,
      },
      body: JSON.stringify({ message }),
    });
    const bodyText = await res.text();
    const json = safeParse(bodyText);

    if (!res.ok) {
      const errMsg =
        (json && typeof json === "object" && "errorMessage" in json && typeof json.errorMessage === "string"
          ? json.errorMessage
          : bodyText) || `HTTP ${res.status}`;
      console.error(`[sms] Solapi status=${res.status} err=${errMsg}`);
      return { ok: false, error: errMsg };
    }

    const groupId =
      json && typeof json === "object" && "groupId" in json && typeof json.groupId === "string"
        ? json.groupId
        : undefined;
    const messageId =
      json && typeof json === "object" && "messageId" in json && typeof json.messageId === "string"
        ? json.messageId
        : undefined;
    return { ok: true, groupId, messageId, type };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[sms] 발송 실패", err);
    return { ok: false, error: msg };
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// 한국 휴대전화·유선번호 정규화. 하이픈·공백·+82 제거 후 숫자만 반환.
// 82 국가코드는 앞에서 0으로 치환. 유효 길이는 9~11자리(02 지역번호 포함).
function normalizeKrPhone(raw: string): string | null {
  let digits = raw.replace(/\D+/g, "");
  if (digits.startsWith("82")) digits = "0" + digits.slice(2);
  if (digits.length < 9 || digits.length > 11) return null;
  return digits;
}

// EUC-KR 근사 바이트 수: 한글·한자 등 non-ASCII 는 2byte, 나머지 1byte.
// (Solapi 는 UTF-8 로 전송하지만 유형 판정은 KISA EUC-KR 기준.)
function byteLenEucKr(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    n += s.charCodeAt(i) > 127 ? 2 : 1;
  }
  return n;
}
