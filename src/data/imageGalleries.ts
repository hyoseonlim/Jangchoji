// Static galleries served from /public/images/<folder>/*.
// To add images: drop new files into public/images/<folder>/ and bump the count below.
// Paths are percent-encoded so Next.js can safely emit them in HTTP Link preload headers
// (raw non-ASCII characters break the header ByteString requirement).

const enc = (paths: string[]) => paths.map(encodeURI);

// 파일명이 {1..count}.{ext} 형태인 폴더용 헬퍼.
const seq = (folder: string, count: number, ext: "jpeg" | "png" = "jpeg") =>
  enc(Array.from({ length: count }, (_, i) => `/images/${folder}/${i + 1}.${ext}`));

// 확장자가 인덱스별로 다른 폴더용 헬퍼. exts[i] 가 (i+1).ext 로 매핑.
const seqMixed = (folder: string, exts: readonly ("jpeg" | "png")[]) =>
  enc(exts.map((ext, i) => `/images/${folder}/${i + 1}.${ext}`));

const rides = seq("놀이기구", 15);
const ski = seq("스키보드", 16);
const surf = seq("서핑", 19);
const waterpark = seq("워터파크", 18);
const cafe = seq("배카페", 10);
const rooftop = seq("루프탑", 23);
const stay = seq("숙소", 10);
const bbq = seqMixed("바베큐", ["png", "png", "png", "png", "png", "jpeg", "jpeg", "jpeg"]);
const main = enc(Array.from({ length: 8 }, (_, i) => `/images/메인/${i}.jpeg`));
// info: 5·11·26 은 jpeg, 나머지는 png
const info = seqMixed(
  "info",
  Array.from({ length: 28 }, (_, i) => {
    const n = i + 1;
    return n === 5 || n === 11 || n === 26 ? "jpeg" : "png";
  }),
);

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
  activityDetails: {
    rides,
    ski,
    wakesurf: surf,
    waterpark,
    bbq,
    cafe,
    rooftop,
    stay4: stay,
    stay5: stay,
    stay6: stay,
    stay8: stay,
  },
};
