// 정적 이미지·에셋 URL 헬퍼.
// NEXT_PUBLIC_ASSET_URL 이 설정되어 있으면 그 도메인을 prefix 로 붙임 (예: Cloudflare R2).
// 없으면 로컬 /public 경로 그대로 사용 (개발용 폴백).
//
// R2 버킷은 public/images 폴더의 '내용물'을 루트로 담고 있어서
// CDN URL 생성 시 /images prefix 를 제거해야 함.
//
// 사용 예:
//   assetUrl("/images/메인/0.webp")
//     BASE 있음 → "https://img.example.com/%EB%A9%94%EC%9D%B8/0.webp"
//     BASE 없음 → "/images/%EB%A9%94%EC%9D%B8/0.webp"

const BASE = process.env.NEXT_PUBLIC_ASSET_URL?.replace(/\/+$/, "") ?? "";

export function assetUrl(path: string): string {
  if (!BASE) return encodeURI(path);
  return `${BASE}${encodeURI(path.replace(/^\/images/, ""))}`;
}
