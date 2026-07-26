import "server-only";

// 관리자에게 새 예약 등 이벤트를 알림. 환경변수 미설정 시 조용히 스킵.
// 설정 방법:
//   1) Discord 서버 → 채널 편집 → 연동 → 웹후크 → 새 웹후크 생성
//   2) 발급된 URL을 .env.local 의 DISCORD_WEBHOOK_URL 에 저장
export async function notifyAdmin(text: string): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
  } catch (err) {
    console.error("[discord] 알림 발송 실패:", err);
  }
}
