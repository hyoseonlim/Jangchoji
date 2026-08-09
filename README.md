## 문자 발송

관리자가 예약을 확정하면 대표 예약자 전화번호로 SOLAPI 문자를 발송합니다.
환경변수가 없거나 번호 형식이 맞지 않으면 예약은 정상 접수되고 문자만 조용히 스킵됩니다.

### SOLAPI 설정

1. SOLAPI 콘솔에서 계정 실명인증을 완료합니다.
2. 문자에 사용할 발신번호를 사전 등록합니다.
3. API Key / API Secret을 발급합니다.
4. 로컬 `.env.local` 과 Vercel Environment Variables에 아래 값을 추가합니다.

```bash
SOLAPI_API_KEY=발급받은_API_KEY
SOLAPI_API_SECRET=발급받은_API_SECRET
SOLAPI_FROM=01020072883
SOLAPI_CONTACT_PHONE=010-9159-6448
```

`SOLAPI_FROM`은 SOLAPI에 등록된 발신번호이며, 하이픈 없이 숫자만 넣습니다.
일시적으로 문자 발송을 끄려면 아래 값을 추가합니다.

```bash
SOLAPI_RESERVATION_SMS_ENABLED=false
```

## 이미지 관리

  이미지 파일은 **Cloudflare R2**에서 서빙됩니다 (`https://img.건전한레저.com`).
  Vercel bandwidth 절약을 위해 `public/images/` 는 `.gitignore` 처리되어 있고,
  로컬 파일은 개발 폴백용으로만 유지됩니다.

  ### 폴더 구조

  ```
  public/images/
    ├─ 놀이기구/     1.webp ~ 15.webp
    ├─ 스키보드/     1.webp ~ 16.webp
    ├─ 서핑/         1.webp ~ 19.webp
    ├─ 워터파크/     1.webp ~ 18.webp
    ├─ 배카페/       1.webp ~ 10.webp
    ├─ 바베큐/       1.webp ~ 8.webp
    ├─ 루프탑/       1.webp ~ 23.webp
    ├─ 숙소/         1.webp ~ 10.webp
    ├─ 반려견/       1.webp ~ 4.webp
    ├─ 일상/         1.webp ~ 12.webp + video.mp4
    ├─ 메인/         0.webp ~ 7.webp    (홈 슬라이더)
    ├─ info/         1.webp ~ 28.webp   (안내 갤러리)
    ├─ rides/        활동 아이콘 (flyfish.webp 등)
    ├─ ski.webp / board.webp            (Hero 배경)
    ├─ main.png                         (OG 이미지, Vercel 서빙)
    └─ 미성년자 숙박 동의서*.jpg        (다운로드용 원본)
  ```

  ### 초기 세팅 (한 번만)

  **1. `.env.local` 에 CDN 주소 추가**
  ```
  NEXT_PUBLIC_ASSET_URL=https://img.건전한레저.com
  ```

  **2. rclone 설치·설정** (R2 업로드용)
  ```bash
  brew install rclone imagemagick
  rclone config
  # name: r2 / type: s3 / provider: Cloudflare
  # access key, secret, endpoint 는 Cloudflare R2 API Token 발급 후 입력
  ```

  ### 이미지 추가

  1. **원본 준비** (아무 폴더에 임시로) — 스마트폰 사진이면 EXIF orientation 처리를 위해 `-auto-orient` 필수
     ```bash
     magick 원본.jpg -auto-orient -resize "1600x1600>" -quality 80 -strip \
       public/images/<폴더>/<다음번호>.webp
     ```

  2. **R2 업로드**
     ```bash
     rclone copy public/images/<폴더> r2:jangchoji-images/<폴더> --progress
     ```

  3. **개수 늘리면** `src/data/imageGalleries.ts` 의 `seq("<폴더>", N)` 카운트 조정

  4. **커밋·푸시**
     ```bash
     git add src/data/imageGalleries.ts
     git commit -m "feat: <폴더> 이미지 추가"
     git push
     ```
     (`public/images/` 는 gitignore로 자동 제외)

  ### 이미지 교체

  같은 파일명으로 덮어쓰고 업로드하면 됩니다.
  ```bash
  magick 새원본.jpg -auto-orient -resize "1600x1600>" -quality 80 -strip \
    public/images/<폴더>/<번호>.webp
  rclone copy public/images/<폴더>/<번호>.webp r2:jangchoji-images/<폴더>/ --progress
  ```

  Cloudflare CDN 캐시는 자동 갱신되지만 급하면 R2 대시보드 → 버킷 → Settings → Purge Cache.

  ### 이미지 삭제

  ```bash
  rclone delete r2:jangchoji-images/<폴더>/<번호>.webp
  rm public/images/<폴더>/<번호>.webp
  ```

  삭제 후 뒤 번호를 앞으로 당기고 `seq("<폴더>", N)` 카운트도 감소시켜 주세요.

  ### 트러블슈팅

  **이미지가 90도 회전되어 나옴** — 스마트폰 사진의 EXIF orientation을 apply하지 않고 변환한 경우. `magick <원본> -auto-orient ...` 옵션으로 재변환 후 다시 업로드.

  **로컬에서 이미지가 안 뜸** — `.env.local` 의 `NEXT_PUBLIC_ASSET_URL` 이 잘못됐거나, DNS 캐시 문제. `.env.local` 에서 이 값을 비우면 `public/images/` 로컬 폴더로 폴백 가능.

  **Vercel 프로덕션에서 이미지 안 뜸** — Vercel Settings → Environment Variables 에 `NEXT_PUBLIC_ASSET_URL` 설정 확인. env 추가·수정 후에는 **재배포 필요**.

  **R2 접근 403** — API Token 이 특정 버킷에만 스코프되어 있어서 `rclone lsd r2:` 같은 전역 조회는 실패함. 버킷명을 명시(`rclone lsd r2:jangchoji-images`)해야 정상.
