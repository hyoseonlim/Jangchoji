// Static galleries served from /public/images/<folder>/*.webp (또는 R2).
// 새 이미지 추가: public/images/<folder>/ 에 다음 번호로 파일 넣고 아래 seq() 카운트만 올림.
// NEXT_PUBLIC_ASSET_URL 로 CDN(예: Cloudflare R2)에서 서빙되며, 없으면 로컬 폴더 폴백.

import { assetUrl } from "@/lib/assetUrl";

// 파일명이 {1..count}.webp 형태인 폴더용 헬퍼.
const seq = (folder: string, count: number) =>
  Array.from({ length: count }, (_, i) => assetUrl(`/images/${folder}/${i + 1}.webp`));

const rides = seq("놀이기구", 15);
const ski = seq("스키보드", 16);
const surf = seq("서핑", 19);
const waterpark = seq("워터파크", 18);
const cafe = seq("배카페", 10);
const rooftop = seq("루프탑", 23);
const stay = seq("숙소", 10);
const bbq = seq("바베큐", 8);
const info = seq("info", 29);
// 메인 슬라이드는 0.webp 부터 시작.
const main = Array.from({ length: 8 }, (_, i) => assetUrl(`/images/메인/${i}.webp`));

export const galleries = {
  rides,
  ski,
  surf,
  waterpark,
  cafe,
  bbq,
  rooftop,
  stay,
  main,
  info,
  // 상세 페이지도 메인 슬라이드와 동일한 사진들을 재사용.
  // 숙소 방별 상세는 R2 의 숙소/상세/*.webp 를 사용.
  activityDetails: {
    rides,
    ski,
    wakesurf: surf,
    waterpark,
    bbq,
    cafe,
    rooftop,
    stay4: [assetUrl("/images/숙소/상세/4인실.webp")],
    stay5: [assetUrl("/images/숙소/상세/5인실.webp")],
    stay6: [
      assetUrl("/images/숙소/상세/6인실.webp"),
      assetUrl("/images/숙소/상세/6인실1.webp"),
    ],
    stay8: [
      assetUrl("/images/숙소/상세/8인실.webp"),
      assetUrl("/images/숙소/상세/8인실1.webp"),
      assetUrl("/images/숙소/상세/8인실2.webp"),
    ],
  },
};
