import "server-only";

// 관리자에게 새 예약 등 이벤트를 알림. 환경변수 미설정 시 조용히 스킵.
// 설정 방법:
//   1) @BotFather 에게 /newbot 으로 봇 생성 → TELEGRAM_BOT_TOKEN 획득
//   2) 관리자가 봇과 대화 시작 → https://api.telegram.org/bot<TOKEN>/getUpdates 로 chat_id 확인
//   3) .env.local 에 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 설정
export async function notifyAdmin(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("[telegram] 알림 발송 실패:", err);
  }
}
