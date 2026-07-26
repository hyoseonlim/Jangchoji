import "server-only";

// 관리자에게 새 예약 등 이벤트를 알림. 환경변수 미설정 시 조용히 스킵.
// 설정 방법:
//   1) Discord 서버 → 채널 편집 → 연동 → 웹후크 → 새 웹후크 생성
//   2) 발급된 URL을 .env.local 의 DISCORD_WEBHOOK_URL 에 저장
// embed 로 발송하여 [텍스트](URL) 마스킹 링크가 렌더링되도록 함.
// (webhook content 필드는 마스킹 링크 미지원 — embed description/fields 에서만 동작)
export async function notifyAdmin(text: string): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn("[discord] DISCORD_WEBHOOK_URL 미설정 — 알림 스킵");
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        embeds: [{ description: text, color: 0x00c2d1 }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[discord] 응답 오류 status=${res.status} body=${body}`);
    }
  } catch (err) {
    console.error("[discord] 알림 발송 실패:", err);
  }
}
