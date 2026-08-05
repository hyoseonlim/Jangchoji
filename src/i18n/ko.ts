import type { Locale } from "./config";

export const ko = {
  locale: "ko" as Locale,
  htmlLang: "ko",

  brand: {
    displayName: "건전한 레저",
    tag: "SINCE 2025",
    phone: "010-9159-6448",
    ownerName: "장우진",
    ownerLabel: "장우진 (대표)",
    bank: { label: "카카오뱅크", account: "3333-02-0271394", holder: "장우진" },
    address: {
      road: "경기 가평군 가평읍 북한강변로 226-28 건전한레저",
      parcel: "경기 가평군 가평읍 금대리 535-3",
      postalCode: "12428",
      query: "경기 가평군 가평읍 북한강변로 226-28",
    },
  },

  meta: {
    title: "건전한 레저 · 가평 빠지 · 수상레저 & 숙박",
    description:
      "가평에서 즐기는 건전한 레저. 놀이기구 8종, 수상스키·웨이크보드·웨이크서핑, 워터파크, 배카페, 루프탑, 무제한 BBQ, 숙박까지 한 곳에서. SINCE 2025.",
    ogTitle: "건전한 레저 · 가평 빠지",
    ogDescription:
      "놀이기구 · 수상스키 · 웨이크보드 · 워터파크 · 배카페 · 루프탑 · BBQ · 숙박. 가평에서 즐기는 건전한 레저.",
    siteName: "건전한 레저",
  },

  nav: {
    ariaLabel: "주요 네비게이션",
    logoAria: "건전한 레저 홈으로 이동",
    links: [
      { href: "#activities", label: "액티비티" },
      { href: "#pricing", label: "이용요금" },
      { href: "#packages", label: "숙박 패키지" },
      { href: "#faq", label: "FAQ" },
      { href: "#directions", label: "오시는 길" },
    ],
    reserve: "예약하기",
    reserveMobile: "예약하기",
    menuOpen: "메뉴 열기",
    menuClose: "메뉴 닫기",
  },

  hero: {
    title: "건전한 레저",
    tag: "SINCE 2025",
    hook: "여름 힐링을 위한 모든 것이 있는 곳",
    activitiesLabel: "액티비티",
    activitiesItems: [
      { text: "놀이기구", href: "#activities" },
      { text: "수상스키·웨이크보드", href: "#activities" },
      { text: "웨이크서핑 (인보트)", href: "#activities" },
      { text: "워터파크", href: "#activities" },
    ],
    relaxDineLabel: "편의 · 휴식",
    relaxDineItems: [
      { text: "무제한 바베큐", href: "#relax-dine" },
      { text: "배카페", href: "#relax-dine" },
      { text: "루프탑", href: "#relax-dine" },
      { text: "숙박", href: "#relax-dine" },
    ],
    ctaPrimary: "예약하기",
    ctaSecondary: "액티비티 보기 ↓",
    scroll: "스크롤",
  },

  activities: {
    tag: "액티비티",
    title: "액티비티",
    relaxTag: "편의 · 휴식",
    relaxTitle: "편의 · 휴식",
    detailChip: "자세히 →",
    detailLink: "자세히 보기",
    items: [
      {
        id: "rides",
        group: "activities" as const,
        title: "놀이기구",
        subtitle: "물놀이 놀이기구",
        alt: "수상 놀이기구를 즐기는 사람들",
      },
      {
        id: "ski",
        group: "activities" as const,
        title: "수상스키 · 웨이크보드",
        subtitle: "수상스키·웨이크보드",
        alt: "호수에서 수상스키를 타는 모습",
      },
      {
        id: "wakesurf",
        group: "activities" as const,
        title: "웨이크서핑 (인보트)",
        subtitle: "웨이크서핑 · 인보트",
        alt: "파도 위에서 웨이크서핑을 즐기는 모습",
      },
      {
        id: "waterpark",
        group: "activities" as const,
        title: "워터파크",
        subtitle: "워터파크",
        alt: "워터파크 물놀이 시설",
      },
      {
        id: "bbq",
        group: "relaxDine" as const,
        title: "무제한 바베큐",
        subtitle: "무제한 바베큐",
        alt: "야외 바베큐 그릴",
        href: "#relax-dine",
        description:
          "신선한 재료로 즐기는 무제한 바베큐. 물놀이 후 즐기는 먹거리는 더욱 특별합니다.",
      },
      {
        id: "cafe",
        group: "relaxDine" as const,
        title: "배카페",
        subtitle: "물 위 카페",
        alt: "물 위에 떠 있는 배카페",
        href: "#relax-dine",
        description:
          "물 위에 떠 있는 배 위에서 즐기는 특별한 휴식. 탁 트인 호수 뷰와 편안한 소파, 다양한 먹거리, 노래방까지. 물놀이 사이 이곳에서만 가능한 여유를 즐기세요.",
      },
      {
        id: "rooftop",
        group: "relaxDine" as const,
        title: "루프탑",
        subtitle: "루프탑 라운지",
        alt: "호수 뷰의 루프탑 라운지",
        href: "#relax-dine",
        description:
          "젖은 몸을 말리며 여유롭게 휴식하고 태닝도 즐기는 루프탑 공간. 친구가 물 위에서 타는 라이딩을 한눈에 지켜보며 쉬어가세요.",
      },
      {
        id: "stay",
        group: "relaxDine" as const,
        title: "숙박",
        subtitle: "숙박 시설",
        alt: "호수 옆 숙박 시설",
        href: "#relax-dine",
        description:
          "가평의 자연 속에서 하루를 온전히 즐기세요. 독채 형식의 아늑한 숙박 시설을 제공합니다.",
      },
    ],
  },

  rides: {
    tag: "놀이기구",
    title: "놀이기구 상세",
    promo: "놀이기구 이용 시 슬라이드 및 워터파크 무료 이용 가능!",
    itemNoAria: "{n}번",
    items: [
      { no: 1, name: "플라이피쉬", capacity: "2인승", description: "동남아 스타일, 하늘을 나는 익스트림 놀이기구" },
      { no: 2, name: "UFO", capacity: "8인승", description: "가운데가 톡톡 튀어오르는 UFO" },
      { no: 3, name: "와플", capacity: "6인승", description: "6명이 누워서 즐기는 와플" },
      { no: 4, name: "와일드팡팡", capacity: "4인승", description: "안정적인 좌석형 와일드팡팡" },
      { no: 5, name: "밴드웨건", capacity: "6인승", description: "앞 3명 앉고 뒤 3명 서서 탑승" },
      { no: 6, name: "로투스", capacity: "6인승", description: "6명이 함께하는 로투스" },
      { no: 7, name: "땅콩보트", capacity: "4인승", description: "4명이 쏙! 안정적인 땅콩보트" },
      { no: 8, name: "바나나보트", capacity: "7인승", description: "스피드와 스릴의 바나나보트" },
    ],
    safety: "안전수칙을 준수하여 즐겨주세요 · 구명조끼 착용 필수",
  },

  pricing: {
    tag: "요금 & 패키지",
    title: "이용요금 안내",
    intro:
      "건전한 레저의 이용요금 안내입니다. 표기 가격은 모두 원화(₩) 기준이며, 요금은 시즌·상품에 따라 변동될 수 있습니다.",
    priceLocale: "ko-KR",
    groups: [
      {
        id: "rides",
        title: "놀이기구",
        items: [
          { label: "놀이기구 3가지", price: 28000 },
          { label: "놀이기구 5가지", price: 45000 },
          { label: "놀이기구 오전무제한", price: 55000 },
          { label: "놀이기구 오후무제한", price: 65000 },
          { label: "놀이기구 종일무제한", price: 75000 },
          { label: "플라이피쉬", price: 15000, note: "1인당" },
          { label: "워터파크만 이용", price: 10000 },
        ],
      },
      {
        id: "speedboat",
        title: "스피드보팅",
        subtitle: "최대 4인까지",
        note: "어른·아기·강아지까지 물에 젖지 않고 북한강을 누벼요",
        items: [
          { label: "보트 투어 (기본 코스)", price: 55000, note: "15분 소요" },
          { label: "남이섬 투어", price: 110000, note: "25분 소요" },
        ],
      },
      {
        id: "ski",
        title: "수상스키 & 웨이크보드",
        items: [
          { label: "초보 강습", price: 65000, note: "지상강습 1회 + 수상강습 2회" },
          { label: "경험자 라이딩", price: 28000 },
        ],
      },
      {
        id: "inboat",
        title: "럭셔리 인보트 보팅",
        subtitle: "국내 단 3대뿐!",
        note: "15분 소요 · 최소 4인 ~ 최대 15인",
        items: [{ label: "인보트 보팅", price: 25000, note: "1인당" }],
      },
    ],
    common: {
      label: "이용 공통 안내",
      badges: ["구명조끼 착용 필수", "샤워실 완비", "무료주차 가능"],
      transferPrefix: "계좌이체",
      holderPrefix: "예금주",
    },
    hours: {
      title: "빠지 수상레저 운영시간",
      lines: [
        "영업시간: 09:00 – 18:00",
        "점심시간: 13:00 – 14:00",
      ],
      note: "바베큐는 빠지 수상레저 영업 종료 후 운영됩니다 (19:00~).",
    },
    packages: {
      tag: "숙박 패키지",
      title: "숙박 패키지",
      peakLabel: "성수기 기간:",
      peakPeriod: "2026.7.17 ~ 8.17",
      seasonAria: "시즌 선택",
      groupSizeAria: "인원 기준 선택",
      seasonLabels: { peak: "성수기", off: "비수기" },
      groupSizeLabels: { "4": "4인 기준", "3": "3인 기준", "2": "2인 기준" },
      packageSuffix: "숙박 패키지 요금표",
      tableHead: { config: "구성", weekday: "평일", saturday: "토요일" },
      tableNotice: "*표시된 모든 패키지 요금은 1인 기준입니다. 선택하신 구성에 따라 요금이 달라집니다.",
      notes: {
        waterpark: "워터파크 무제한 포함",
        bbqPrefix: "무제한 BBQ 구성",
        bbqNotice: "(바베큐 구성은 변동될 수 있음)",
        pet: "반려견 동반 추가: 마리당 30,000원",
        under4: "인원별로 요금 기준이 다르니 해당 탭을 참고해주세요.",
      },
      bbqComposition: "고기 · 밥 · 쌈장 · 쌈무 · 김치 · 소세지 · 버섯 · 일회용품",
      rows: {
        peak: {
          "4": [
            { config: "숙박 + 놀이기구 3종", weekday: 65000, saturday: 75000 },
            { config: "숙박 + 놀이기구 5종", weekday: 79000, saturday: 89000 },
            { config: "숙박 + 놀이기구 오전무제한", weekday: 89000, saturday: 99000 },
            { config: "숙박 + 놀이기구 오후무제한", weekday: 99000, saturday: 109000 },
            { config: "숙박 + 놀이기구 종일무제한", weekday: 109000, saturday: 119000 },
            { config: "숙박 + 놀이기구 3종 + BBQ", weekday: 94000, saturday: 104000 },
            { config: "숙박 + 놀이기구 5종 + BBQ", weekday: 108000, saturday: 118000 },
            { config: "숙박 + 놀이기구 오전무제한 + BBQ", weekday: 118000, saturday: 128000 },
            { config: "숙박 + 놀이기구 오후무제한 + BBQ", weekday: 128000, saturday: 138000 },
            { config: "숙박 + 놀이기구 종일무제한 + BBQ", weekday: 138000, saturday: 148000 },
          ],
          "3": [
            { config: "숙박 + 놀이기구 3종", weekday: 75000, saturday: 85000 },
            { config: "숙박 + 놀이기구 5종", weekday: 90000, saturday: 100000 },
            { config: "숙박 + 놀이기구 오전무제한", weekday: 100000, saturday: 110000 },
            { config: "숙박 + 놀이기구 오후무제한", weekday: 110000, saturday: 120000 },
            { config: "숙박 + 놀이기구 종일무제한", weekday: 120000, saturday: 130000 },
            { config: "숙박 + 놀이기구 3종 + BBQ", weekday: 104000, saturday: 114000 },
            { config: "숙박 + 놀이기구 5종 + BBQ", weekday: 119000, saturday: 129000 },
            { config: "숙박 + 놀이기구 오전무제한 + BBQ", weekday: 129000, saturday: 139000 },
            { config: "숙박 + 놀이기구 오후무제한 + BBQ", weekday: 139000, saturday: 149000 },
            { config: "숙박 + 놀이기구 종일무제한 + BBQ", weekday: 149000, saturday: 159000 },
          ],
          "2": [
            { config: "숙박 + 놀이기구 3종", weekday: 85000, saturday: 95000 },
            { config: "숙박 + 놀이기구 5종", weekday: 100000, saturday: 110000 },
            { config: "숙박 + 놀이기구 오전무제한", weekday: 110000, saturday: 120000 },
            { config: "숙박 + 놀이기구 오후무제한", weekday: 120000, saturday: 130000 },
            { config: "숙박 + 놀이기구 종일무제한", weekday: 130000, saturday: 140000 },
            { config: "숙박 + 놀이기구 3종 + BBQ", weekday: 114000, saturday: 124000 },
            { config: "숙박 + 놀이기구 5종 + BBQ", weekday: 129000, saturday: 139000 },
            { config: "숙박 + 놀이기구 오전무제한 + BBQ", weekday: 139000, saturday: 149000 },
            { config: "숙박 + 놀이기구 오후무제한 + BBQ", weekday: 149000, saturday: 159000 },
            { config: "숙박 + 놀이기구 종일무제한 + BBQ", weekday: 159000, saturday: 169000 },
          ],
        },
        off: {
          "4": [
            { config: "숙박 + 놀이기구 3종", weekday: 55000, saturday: 65000 },
            { config: "숙박 + 놀이기구 5종", weekday: 69000, saturday: 79000 },
            { config: "숙박 + 놀이기구 오전무제한", weekday: 79000, saturday: 89000 },
            { config: "숙박 + 놀이기구 오후무제한", weekday: 89000, saturday: 99000 },
            { config: "숙박 + 놀이기구 종일무제한", weekday: 99000, saturday: 109000 },
            { config: "숙박 + 놀이기구 3종 + BBQ", weekday: 84000, saturday: 94000 },
            { config: "숙박 + 놀이기구 5종 + BBQ", weekday: 98000, saturday: 108000 },
            { config: "숙박 + 놀이기구 오전무제한 + BBQ", weekday: 108000, saturday: 118000 },
            { config: "숙박 + 놀이기구 오후무제한 + BBQ", weekday: 118000, saturday: 128000 },
            { config: "숙박 + 놀이기구 종일무제한 + BBQ", weekday: 128000, saturday: 138000 },
          ],
          "3": [
            { config: "숙박 + 놀이기구 3종", weekday: 65000, saturday: 75000 },
            { config: "숙박 + 놀이기구 5종", weekday: 80000, saturday: 90000 },
            { config: "숙박 + 놀이기구 오전무제한", weekday: 90000, saturday: 100000 },
            { config: "숙박 + 놀이기구 오후무제한", weekday: 100000, saturday: 110000 },
            { config: "숙박 + 놀이기구 종일무제한", weekday: 110000, saturday: 120000 },
            { config: "숙박 + 놀이기구 3종 + BBQ", weekday: 94000, saturday: 104000 },
            { config: "숙박 + 놀이기구 5종 + BBQ", weekday: 109000, saturday: 119000 },
            { config: "숙박 + 놀이기구 오전무제한 + BBQ", weekday: 119000, saturday: 129000 },
            { config: "숙박 + 놀이기구 오후무제한 + BBQ", weekday: 129000, saturday: 139000 },
            { config: "숙박 + 놀이기구 종일무제한 + BBQ", weekday: 139000, saturday: 149000 },
          ],
          "2": [
            { config: "숙박 + 놀이기구 3종", weekday: 75000, saturday: 85000 },
            { config: "숙박 + 놀이기구 5종", weekday: 90000, saturday: 100000 },
            { config: "숙박 + 놀이기구 오전무제한", weekday: 100000, saturday: 110000 },
            { config: "숙박 + 놀이기구 오후무제한", weekday: 110000, saturday: 120000 },
            { config: "숙박 + 놀이기구 종일무제한", weekday: 120000, saturday: 130000 },
            { config: "숙박 + 놀이기구 3종 + BBQ", weekday: 104000, saturday: 114000 },
            { config: "숙박 + 놀이기구 5종 + BBQ", weekday: 119000, saturday: 129000 },
            { config: "숙박 + 놀이기구 오전무제한 + BBQ", weekday: 129000, saturday: 139000 },
            { config: "숙박 + 놀이기구 오후무제한 + BBQ", weekday: 139000, saturday: 149000 },
            { config: "숙박 + 놀이기구 종일무제한 + BBQ", weekday: 149000, saturday: 159000 },
          ],
        },
      },
    },
  },

  infoGallery: {
    tag: "이용 안내",
    title: "이미지로 보는 건전한레저 정보",
    description:
      "건전한 레저의 이용 안내, 요금, 시설 정보를 이미지로 한 번에 확인하세요.",
    cta: "이미지로 보기",
    modalTitle: "건전한레저 정보 갤러리",
    close: "닫기",
    prev: "이전",
    next: "다음",
    imageAlt: "건전한레저 정보 {n}",
    counter: "{current} / {total}",
  },

  detailPages: {
    backLabel: "← 돌아가기",
    reserveCta: "예약하기",
    priceHeading: "이용 요금",
    infoHeading: "안내 사항",
    galleryHeading: "사진",
    items: {
      rides: {
        title: "놀이기구",
        subtitle: "물놀이 놀이기구 8종",
        intro:
          "짜릿한 스릴부터 안정적인 라이딩까지, 8종의 놀이기구를 준비했습니다. 놀이기구 이용 시 슬라이드 및 워터파크는 무료로 이용하실 수 있습니다.",
        prices: [],
        info: [
          "놀이기구 이용 시 슬라이드 · 워터파크 무료 이용",
          "구명조끼 착용 필수 (무료 제공)",
          "안전수칙을 준수하여 즐겨주세요",
        ],
      },
      ski: {
        title: "수상스키 · 웨이크보드",
        subtitle: "초보 강습부터 경험자 라이딩까지",
        intro:
          "지상강습 1회와 수상강습 2회로 구성된 초보 강습으로 안전하게 시작하실 수 있습니다. 초보 강습을 이수하신 경험자분들은 라이딩만 별도로 예약하실 수도 있습니다.",
        prices: [
          {
            label: "초보 강습",
            price: 65000,
            note: "투스키 · 웨이크보드 가능 · 지상강습 1회 + 라이딩 2회",
          },
          {
            label: "경험자 라이딩",
            price: 28000,
            note: "초보 강습 이수 후 이용 가능",
          },
        ],
        info: [
          "구명조끼 착용 필수 (무료 제공)",
          "전문 강사가 처음부터 끝까지 함께합니다",
          "수영을 못하셔도 참여 가능합니다",
        ],
      },
      wakesurf: {
        title: "웨이크서핑 (인보트)",
        subtitle: "국내 단 3대 · 럭셔리 인보트 보팅",
        intro:
          "인보트에 탑승하여 즐기는 웨이크서핑. 인보트가 만들어내는 큰 파도 위에서 서핑 감성을 그대로 느껴보세요.",
        prices: [
          {
            label: "인보트 보팅",
            price: 25000,
            note: "1인당 · 최소 5인부터 이용 가능",
          },
        ],
        info: [
          "15분 소요 · 최소 5인 이상 예약",
          "구명조끼 무료 제공",
          "웨이크서핑은 인보트 승선 상태로 진행됩니다",
        ],
      },
      waterpark: {
        title: "워터파크",
        subtitle: "물놀이 · 슬라이드 · 워터파크 시설",
        intro:
          "놀이기구를 이용하지 않으셔도 워터파크만 단독으로 이용하실 수 있습니다. 아이들과 가족 단위 방문객도 부담 없이 즐기세요.",
        prices: [{ label: "워터파크만 이용", price: 10000 }],
        info: [
          "놀이기구 이용 시 워터파크 무료 이용 가능",
          "구명조끼 무료 제공 · 샤워실 완비",
        ],
      },
      bbq: {
        title: "무제한 바베큐",
        subtitle: "물놀이 후 즐기는 프리미엄 바베큐",
        intro:
          "고기, 밥, 소세지, 김치, 쌈장, 쌈무, 버섯, 일회용품이 포함된 무제한 바베큐. 물놀이 후 든든하고 여유롭게 즐겨보세요. (바베큐 구성은 변동될 수 있음)",
        prices: [
          { label: "패키지 포함 시", price: 29000, note: "1인당" },
          { label: "당일 이용 시", price: 30000, note: "1인당" },
          {
            label: "숯만 이용 (4인 기준)",
            price: 30000,
            note: "1인 추가 시 +₩5,000",
          },
        ],
        info: [
          "무제한 바베큐 제공 시간: 주말 기준 19:00 – 21:00",
          "21:00 이후부터는 자유롭게 자리에서 남은 음식을 더 드셔도 됩니다",
          "구성: 고기 · 밥 · 소세지 · 김치 · 쌈장 · 쌈무 · 버섯 · 일회용품 (바베큐 구성은 변동될 수 있음)",
        ],
      },
      cafe: {
        title: "배카페",
        subtitle: "물 위에 떠 있는 프라이빗 카페",
        intro:
          "물 위에 떠 있는 배 위에서 즐기는 특별한 시간. 프라이빗 공간 대여로 나만의 파티나 모임도 가능합니다.",
        prices: [],
        info: [
          "프라이빗 공간 대여 가능",
          "노래방 이용 가능",
          "플레이스테이션 게임 · 영화 시청 가능",
          "탁 트인 호수 뷰와 편안한 소파",
        ],
      },
      rooftop: {
        title: "루프탑",
        subtitle: "여유롭게 힐링하는 루프탑 공간",
        intro:
          "자유롭게 음식을 즐기며 여유와 힐링을 만끽할 수 있는 루프탑 공간. 태닝과 포토존까지 준비되어 있습니다.",
        prices: [],
        info: [
          "자유롭게 음식 섭취 가능",
          "커피 및 음료 섭취 가능",
          "선탠(태닝) 가능",
          "포토존 완비",
        ],
      },
      stay: {
        title: "숙박",
        subtitle: "4인실 · 5인실 · 6인실 · 8인실",
        intro:
          "가평의 자연 속에서 편안한 하룻밤. 4인실부터 8인실까지 다양한 객실을 제공합니다. 5인실 · 6인실은 다락방이 포함되어 있어 추가 인원 이용이 가능합니다.",
        prices: [],
        info: [
          "4인실: 최소 4인 / 최대 4인 (다락방 없음)",
          "5인실: 최소 5인 / 최대 6인 (다락방 포함)",
          "6인실: 최소 6인 / 최대 8인 (다락방 포함)",
          "8인실: 최소 8인 / 최대 10인 (다락방 없음)",
        ],
        rooms: [
          { key: "stay4", title: "4인실", desc: "최소 4인 / 최대 4인 · 다락방 없음" },
          { key: "stay5", title: "5인실", desc: "최소 5인 / 최대 6인 · 다락방 포함" },
          { key: "stay6", title: "6인실", desc: "최소 6인 / 최대 8인 · 다락방 포함" },
          { key: "stay8", title: "8인실", desc: "최소 8인 / 최대 10인 · 다락방 없음" },
        ],
        amenities: {
          title: "객실 구비 품목",
          items: [
            "수저세트",
            "냄비 · 후라이팬",
            "밥그릇 · 접시 · 대접",
            "국자 · 가위 · 집게",
            "냉장고 · 전자레인지",
            "TV · 에어컨",
            "식탁",
            "수건",
          ],
          note: "샤워용품은 구비되어 있지 않으니 개인이 지참하여 방문해 주세요.",
        },
      },
    },
  },

  safety: {
    tag: "안전 우선",
    title: "초보자 &\n안전 안내",
    intro:
      "건전한 레저는 즐거움과 안전이 공존하는 공간입니다. 처음 방문하시는 분도, 수영을 못 하시는 분도 모두 안심하고 즐기실 수 있습니다.",
    features: [
      {
        icon: "🦺",
        title: "구명조끼 무료 제공",
        description:
          "모든 액티비티에는 국제 안전 기준에 맞는 구명조끼가 무료로 제공됩니다. 어린이 사이즈도 완비되어 있어 안심하고 이용하실 수 있습니다.",
      },
      {
        icon: "👨‍🏫",
        title: "전문 강사 상시 대기",
        description:
          "숙련된 전문 강사진이 항상 대기 중입니다. 처음 수상스키나 웨이크보드를 접하는 분들을 위한 1:1 강습을 제공하며, 안전하게 즐길 수 있도록 도와드립니다.",
      },
      {
        icon: "🏊",
        title: "수영 못해도 OK",
        description:
          "수영을 전혀 못하셔도 괜찮습니다! 구명조끼 착용 필수이며, 강사가 항상 옆에서 안전을 책임집니다. 초보자도 자신있게 체험하실 수 있습니다.",
      },
      {
        icon: "🌊",
        title: "안전한 수역 확보",
        description:
          "액티비티 구역과 일반 수영 구역을 명확히 분리하여 운영합니다. 수상 안전 요원이 구역별로 배치되어 사고를 미연에 방지합니다.",
      },
      {
        icon: "📋",
        title: "사전 안전 교육 필수",
        description:
          "모든 액티비티 참가 전 의무적으로 안전 교육을 실시합니다. 안전 수칙을 숙지한 뒤 즐기실 수 있어 걱정이 없습니다.",
      },
    ],
    ctaTitle: "궁금한 점이 있으신가요?",
    ctaSubtitle: "전화 또는 네이버 예약 채팅으로 무엇이든 물어보세요.",
    ctaStore: "스토어 예약",
  },

  faq: {
    tag: "자주 묻는 질문",
    title: "자주 묻는 질문",
    items: [
      {
        id: "beginner",
        question: "초보자도 수상스키나 웨이크보드를 탈 수 있나요?",
        answer:
          "네, 가능합니다. 건전한 레저는 초보자를 위한 강습 프로그램을 운영하고 있습니다. 초보 강습은 지상강습 1회와 수상강습 2회로 구성되며, 요금은 65,000원입니다. 이미 경험이 있는 분은 라이딩(28,000원)만 신청하실 수 있습니다.",
      },
      {
        id: "swim",
        question: "수영을 못해도 이용할 수 있나요?",
        answer:
          "네, 이용하실 수 있습니다. 모든 수상 액티비티는 구명조끼 착용이 필수이며, 처음 방문하시는 분들도 강사가 함께하는 강습 프로그램을 통해 안전하게 즐기실 수 있습니다.",
      },
      {
        id: "rain",
        question: "우천 시 환불이나 변경이 되나요?",
        answer:
          "우천으로 인한 패키지 취소는 불가능합니다. 패키지 예약금 환불은 일체 불가하며, 예약일 변경은 이용일 7일 전까지 가능합니다. 예약 내용이나 예약일 변경 시 위약금 20%가 부과됩니다 (패키지와 객실 규정은 별도 적용).",
      },
      {
        id: "parking",
        question: "주차가 가능한가요?",
        answer: "네, 무료 주차가 가능합니다. 별도의 주차 요금은 발생하지 않습니다.",
      },
      {
        id: "transit",
        question: "대중교통으로 어떻게 가나요?",
        answer:
          "가평역에서 71-3번 또는 71-2번 버스를 타고 '가평수도원' 정류장에서 하차하시면 됩니다. 소요시간은 약 16~18분이며, 하차 후 도보로 약 3분 거리입니다. 실제 정류장 표지판이나 주변 건물에는 '가평수덕원'이라 적혀 있을 수 있는데 잘못 내리신 것이 아니니 안심하고 하차해 주세요.",
      },
      {
        id: "pickup",
        question: "장보기 픽업 서비스가 있나요?",
        answer:
          "네, 조은마트 연계 픽업 서비스를 운영합니다. 가평역에서 조은마트 픽업차량 탑승 → 조은마트 장보기 → 건전한 레저까지 이동, 이용 후에는 다시 가평역까지 픽업해 드립니다. 이용 조건은 마트에서 1인 기준 최소 15,000원 이상 장보기이며, 인원 상관없이 소인원부터 단체까지 모두 이용 가능합니다.",
      },
      {
        id: "bbq",
        question: "무제한 BBQ에는 어떤 음식이 포함되나요?",
        answer:
          "무제한 BBQ 구성은 고기, 밥, 소세지, 김치, 쌈장, 쌈무, 버섯, 일회용품입니다 (바베큐 구성은 변동될 수 있음). 숙박 패키지에 BBQ 옵션을 추가하시면 이용하실 수 있습니다.",
      },
      {
        id: "peak-season",
        question: "성수기는 언제인가요?",
        answer:
          "성수기는 2026년 7월 17일부터 8월 17일까지입니다. 성수기와 비수기의 숙박 패키지 요금이 다르니 예약 전 참고해 주세요.",
      },
    ],
    refund: {
      tag: "취소 · 환불",
      title: "취소 · 환불 규정",
      packageRulesTitle: "패키지 · 공통 규정",
      packageRules: [
        "패키지 예약금 환불은 일체 불가",
        "예약일 변경은 7일 전까지 가능",
        "예약 내용 · 예약일 변경 시 위약금 20% 부과 (패키지와 객실은 별도 적용)",
        "우천으로 인한 패키지 취소는 불가능",
      ],
      roomTitle: "객실 개인 사정 변경 시 취소 수수료",
      roomHead: { when: "기준", fee: "수수료" },
      roomSchedule: [
        { when: "객실 기본", fee: "30%" },
        { when: "이용일 D-14", fee: "40%" },
        { when: "이용일 D-10", fee: "50%" },
        { when: "이용일 D-9", fee: "60%" },
        { when: "이용일 D-8", fee: "70%" },
        { when: "이용일 D-7 이후", fee: "환불 불가" },
      ],
      noRefundLabel: "환불 불가",
    },
    contactTitle: "찾으시는 답변이 없으신가요?",
    contactSubtitle: "전화로 문의해 주시면 친절하게 답변 드리겠습니다.",
  },

  minorPolicy: {
    tag: "정책 안내",
    title: "미성년자 숙박 안내",
    introStrong1: "동성 친구들끼리 숙박 가능",
    introMid: " · ",
    introStrong2: "이성 혼숙 불가",
    introEnd: ". 보호자 동의와 아래 서류 준비가 필요합니다.",
    docsLabel: "필요 서류",
    docs: [
      { strong: "보호자 숙박 동의서", rest: " (아래 양식 다운로드)" },
      { strong: "보호자 신분증 사본", rest: " (주민번호 뒷자리 마스킹 가능)" },
      { strong: "가족관계증명서", rest: " (최근 발급본)" },
    ],
    formTitle: "숙박 동의서 양식",
    formSubtitle: "양식을 다운로드해 작성 후 입실 당일 지참 · 사전 제출도 가능",
    formDownload: "양식 다운로드",
    formDownloadFilename: "건전한레저_미성년자_숙박동의서.jpg",
    formShowExample: "작성 예시 보기",
    formHideExample: "예시 닫기",
    formExampleAlt: "미성년자 숙박 동의서 작성 예시",
    contactPromptPre: "예약 전 반드시 ",
    contactPromptStrong: "숙소로 먼저 문의",
    contactPromptPost: "해 주세요.",
  },

  channels: {
    tag: "온라인 채널",
    title: "온라인에서도 만나보세요",
    intro: "영상과 블로그에서 건전한 레저의 생생한 현장과 최신 소식을 만나보실 수 있습니다.",
    youtube: {
      tag: "YouTube",
      name: "장초지TV",
      description: "수상레저 현장 영상과 액티비티 하이라이트를 확인해 보세요.",
      cta: "채널 방문하기",
      videoAria: "장초지TV 대표 영상 보기",
      thumbnailAlt: "장초지TV 대표 영상 썸네일",
    },
    blog: {
      tag: "네이버 블로그",
      name: "네이버 블로그",
      description: "이용 안내, 후기, 시즌 소식 등 자세한 정보를 확인하세요.",
      cta: "블로그 보기",
      mark: "블로그",
      overlay: "블로그",
      previewAlt: "네이버 블로그 콘텐츠 미리보기",
    },
    instagram: {
      tag: "Instagram",
      name: "@mad.water.ski",
      description: "현장 사진과 라이딩 순간을 인스타그램에서 만나보세요.",
      cta: "인스타그램 보기",
      overlay: "IG",
      previewAlt: "인스타그램 콘텐츠 미리보기",
    },
  },

  directions: {
    tag: "오시는 길",
    title: "오시는 길",
    address: {
      title: "주소",
      postalCodeLabel: "우편번호",
      roadTag: "도로명",
      parcelTag: "지번",
      roadAria: "도로명 주소",
      parcelAria: "지번 주소",
      naver: "네이버 지도에서 열기",
      kakao: "카카오맵에서 열기",
      copyDone: "복사됨",
      copyLabel: "복사",
      copyAriaSuffix: "복사",
      mapTitleSuffix: "지도",
    },
    bus: {
      title: "대중교통 (버스)",
      subtitlePre: "가평역 출발 기준 · 하차역 ",
      subtitleStation: "가평수도원",
      subtitlePost: " · 버스 16~18분, 하차 후 도보 3분",
      warning: {
        pre: "실제 정류장 표지판이나 주변 건물에는 ",
        strong1: '"가평수덕원"',
        mid: "으로 적혀 있을 수 있습니다. ",
        strong2: "잘못 내리신 것이 아니니",
        post: " 안심하고 하차해 주세요.",
      },
      routes: [
        {
          no: "71-3",
          stops: "10정거장",
          duration: "약 18분",
          times: ["06:55 (첫차)", "09:14", "13:55", "14:55", "18:04 (막차)"],
          walkingGuide: [
            "가평수도원 하차",
            "건너편으로 이동, 버스 온 방향으로 직진하면 가평수덕원",
            "수덕원을 지나면 '건전한 레저' 검정 팻말",
            "농로로 들어오면 도착",
          ],
        },
        {
          no: "71-2",
          stops: "14정거장",
          duration: "약 16분",
          times: ["11:15 (첫차)", "16:43", "19:13 (막차)"],
          walkingGuide: [
            "가평수도원 하차",
            "건너지 말고 앞으로 직진",
            "조금 걸으면 '건전한 레저' 검정 팻말",
            "농로로 들어오면 도착",
          ],
        },
      ],
      routeNoSuffix: "번",
      timesLabel: "출발 시각",
      walkLabel: "도보 경로",
      contactPre: "버스 문의 · ",
      contactName: "가평교통",
      contactPhone: "033-241-7342",
      contactNote: "(탑승 전 최신 시간표 확인 권장)",
    },
    pickup: {
      title: "조은마트 픽업 서비스",
      subtitle: "가평역에서 조은마트를 거쳐 건전한 레저까지 편리하고 안전하게 이동하실 수 있습니다.",
      steps: [
        "가평역 도착 후 마트 픽업차량 탑승",
        "조은마트에서 장보기",
        "건전한 레저로 픽업 이동",
        "이용 후 다시 가평역까지 픽업",
      ],
      conditionTitle: "이용 조건",
      conditionPre: "마트에서 1인 기준 ",
      conditionStrong1: "최소 15,000원 이상",
      conditionMid: " 장 보시면 이용 가능합니다. 장 보시는 동안 차량이 대기하며 ",
      conditionStrong2: "돌아갈 때도 픽업",
      conditionPost: "해 드립니다 (인원 상관없이 소인원~단체 모두 OK).",
      conditionExtra:
        "조은마트는 가평에 있는 대규모 대형마트로 고기·주류·스낵·냉동냉장·일회용품 등 대부분의 품목을 저렴하고 합리적인 금액으로 구매하실 수 있습니다. 예약 후 픽업 요청을 남겨주시면 연결해 드립니다.",
    },
    phoneLabel: "전화 문의 / 예약",
    phoneOwnerLine: "장우진 · 건전한 레저",
  },

  footer: {
    tag: "SINCE 2025",
    description:
      "가평에서 즐기는 건전한 레저.\n놀이기구, 수상스키·웨이크보드, 웨이크서핑,\n워터파크, 배카페, 루프탑, 바베큐, 숙박을 한 곳에서.",
    social: {
      youtube: "유튜브",
      blog: "블로그",
      instagram: "인스타그램",
      store: "스토어",
    },
    socialAria: {
      youtube: "장초지TV 유튜브 채널",
      blog: "네이버 블로그",
      instagram: "인스타그램 @mad.water.ski",
      store: "네이버 스마트스토어",
    },
    quickLinksTitle: "바로가기",
    quickLinks: [
      { href: "#activities", label: "액티비티" },
      { href: "#pricing", label: "이용요금" },
      { href: "#packages", label: "숙박 패키지" },
      { href: "#safety", label: "안전 안내" },
      { href: "#faq", label: "FAQ" },
      { href: "#refund", label: "취소 · 환불" },
      { href: "#minor-policy", label: "미성년자 안내" },
      { href: "#channels", label: "온라인 채널" },
      { href: "#directions", label: "오시는 길" },
    ],
    contactTitle: "연락처 & 찾아오시는 길",
    postalPrefix: "우편번호",
    hoursTitle: "운영 시간",
    hoursWeekday: "영업시간 09:00 – 18:00",
    hoursWeekend: "점심시간 13:00 – 14:00",
    hoursPeak: "바베큐는 19:00부터 운영",
    reserve: "예약하기 →",
    businessLabel: "상호:",
    ownerLabel: "대표:",
    rightsReserved: "All rights reserved.",
  },

  languageSwitcher: {
    ariaLabel: "언어 선택",
    ko: "한국어",
    en: "English",
    ariaCurrent: "현재 언어",
  },
};

export type Dictionary = typeof ko;
