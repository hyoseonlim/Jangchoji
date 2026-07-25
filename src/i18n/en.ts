import type { Dictionary } from "./ko";

export const en: Dictionary = {
  locale: "en",
  htmlLang: "en",

  brand: {
    displayName: "Water leisure",
    tag: "SINCE 2025",
    phone: "0503-7152-2755",
    ownerName: "장우진",
    ownerLabel: "장우진 (Owner)",
    bank: { label: "카카오뱅크", account: "3333-02-0271394", holder: "장우진" },
    address: {
      road: "226-28 Bukhangangbyeon-ro, Gapyeong-eup, Gapyeong-gun, Gyeonggi-do",
      parcel: "535-3 Geumdae-ri, Gapyeong-eup, Gapyeong-gun, Gyeonggi-do",
      postalCode: "12428",
      // Map search query stays in Korean for accurate results on Google/Naver/Kakao Maps
      query: "경기 가평군 가평읍 북한강변로 226-28",
    },
  },

  meta: {
    title: "Water leisure · Gapyeong Water Sports & Stay",
    description:
      "Water leisure in Gapyeong. 8 water play rides, water-ski, wakeboard, wakesurf, water park, floating cafe, rooftop lounge, unlimited BBQ, and accommodation — all in one place. SINCE 2025.",
    ogTitle: "Water leisure · Gapyeong",
    ogDescription:
      "Water Play Rides · Water-ski · Wakeboard · Water Park · Floating Cafe · Rooftop · BBQ · Stay. Water leisure in Gapyeong.",
    siteName: "Water leisure",
  },

  nav: {
    ariaLabel: "Main navigation",
    logoAria: "Water leisure — back to home",
    links: [
      { href: "#activities", label: "Activities" },
      { href: "#pricing", label: "Pricing" },
      { href: "#packages", label: "Stay Packages" },
      { href: "#faq", label: "FAQ" },
      { href: "#directions", label: "Directions" },
    ],
    reserve: "Reserve",
    reserveMobile: "Reserve",
    menuOpen: "Open menu",
    menuClose: "Close menu",
  },

  hero: {
    title: "Water leisure",
    tag: "SINCE 2025",
    hook: "Everything you need for a perfect summer escape",
    activitiesLabel: "Activities",
    activitiesItems: [
      { text: "Water Play Rides", href: "#activities" },
      { text: "Water-ski · Wakeboard", href: "#activities" },
      { text: "Wakesurf (Inboat)", href: "#activities" },
      { text: "Water Park", href: "#activities" },
    ],
    relaxDineLabel: "Relax & Dine",
    relaxDineItems: [
      { text: "Unlimited BBQ", href: "#relax-dine" },
      { text: "Floating Cafe", href: "#relax-dine" },
      { text: "Rooftop", href: "#relax-dine" },
      { text: "Stay", href: "#relax-dine" },
    ],
    ctaPrimary: "Reserve",
    ctaSecondary: "See activities ↓",
    scroll: "SCROLL",
  },

  activities: {
    tag: "Activities",
    title: "Activities",
    relaxTag: "Relax & Dine",
    relaxTitle: "Relax & Dine",
    detailChip: "More →",
    detailLink: "Learn more",
    items: [
      {
        id: "rides",
        group: "activities",
        title: "Water Play Rides",
        subtitle: "Water Play Rides",
        alt: "Guests enjoying water play rides",
      },
      {
        id: "ski",
        group: "activities",
        title: "Water-ski · Wakeboard",
        subtitle: "Water-ski / Wakeboard",
        alt: "Water-skiing on the lake",
      },
      {
        id: "wakesurf",
        group: "activities",
        title: "Wakesurf (Inboat)",
        subtitle: "Wakesurfing · Inboat",
        alt: "Wakesurfing on a wave",
      },
      {
        id: "waterpark",
        group: "activities",
        title: "Water Park",
        subtitle: "Water Park",
        alt: "Water park facilities",
      },
      {
        id: "bbq",
        group: "relaxDine",
        title: "Unlimited BBQ",
        subtitle: "Unlimited BBQ",
        alt: "Outdoor BBQ grill",
        href: "#relax-dine",
        description:
          "Unlimited BBQ with fresh ingredients. Food tastes even better after a day on the water.",
      },
      {
        id: "cafe",
        group: "relaxDine",
        title: "Floating Cafe",
        subtitle: "Cafe on the Water",
        alt: "Floating cafe on the water",
        href: "#relax-dine",
        description:
          "A one-of-a-kind break on a boat floating on the lake. Wide-open views, comfy sofas, snacks, and even karaoke — the kind of downtime you can only find here.",
      },
      {
        id: "rooftop",
        group: "relaxDine",
        title: "Rooftop",
        subtitle: "Rooftop Lounge",
        alt: "Rooftop lounge with a lake view",
        href: "#relax-dine",
        description:
          "Dry off, unwind, and catch some sun on the rooftop. Watch your friends ride the water below from the perfect vantage point.",
      },
      {
        id: "stay",
        group: "relaxDine",
        title: "Stay",
        subtitle: "Accommodation",
        alt: "Accommodation by the lake",
        href: "#relax-dine",
        description:
          "Spend a full day in the Gapyeong outdoors. Cozy private-house-style accommodation is ready for you.",
      },
    ],
  },

  rides: {
    tag: "Water Play Rides",
    title: "Water Play Rides",
    promo: "Ride tickets include free access to the slides and water park!",
    itemNoAria: "Ride #{n}",
    items: [
      { no: 1, name: "Flyfish", capacity: "2 riders", description: "Southeast-Asian-style extreme ride that launches you into the air" },
      { no: 2, name: "UFO", capacity: "8 riders", description: "A UFO with a bouncing center that pops you up" },
      { no: 3, name: "Waffle", capacity: "6 riders", description: "Lie back on the waffle with five friends" },
      { no: 4, name: "Wild Pang Pang", capacity: "4 riders", description: "Stable seated-style ride, wild but safe" },
      { no: 5, name: "Bandwagon", capacity: "6 riders", description: "Three riders seated in front, three standing in back" },
      { no: 6, name: "Lotus", capacity: "6 riders", description: "Ride the lotus with five friends" },
      { no: 7, name: "Peanut Boat", capacity: "4 riders", description: "Four riders tucked in — stable and fun" },
      { no: 8, name: "Banana Boat", capacity: "7 riders", description: "Speed and thrills on the banana boat" },
    ],
    safety: "Follow all safety rules · Life jacket required",
  },

  pricing: {
    tag: "Rates & Packages",
    title: "Rates & Packages",
    intro:
      "Prices below are all in Korean Won (₩) and may change by season and product.",
    priceLocale: "en-US",
    groups: [
      {
        id: "rides",
        title: "Water Play Rides",
        items: [
          { label: "3 rides", price: 28000 },
          { label: "5 rides", price: 45000 },
          { label: "Morning unlimited", price: 55000 },
          { label: "Afternoon unlimited", price: 65000 },
          { label: "All-day unlimited", price: 75000 },
          { label: "Flyfish", price: 15000, note: "per person" },
          { label: "Water park only", price: 10000 },
        ],
      },
      {
        id: "speedboat",
        title: "Speedboat",
        subtitle: "Up to 4 riders",
        note: "Cruise the Bukhan River without getting wet — adults, babies, and dogs welcome",
        items: [
          { label: "Boat tour (basic course)", price: 55000, note: "15 min" },
          { label: "Namiseom tour", price: 110000, note: "25 min" },
        ],
      },
      {
        id: "ski",
        title: "Water-ski & Wakeboard",
        items: [
          { label: "Beginner lesson", price: 65000, note: "1 land session + 2 water sessions" },
          { label: "Experienced ride", price: 28000 },
        ],
      },
      {
        id: "inboat",
        title: "Luxury Inboat",
        subtitle: "Only 3 in the country!",
        note: "15 min · Minimum 4, up to 15 riders",
        items: [{ label: "Inboat ride", price: 25000, note: "per person" }],
      },
    ],
    common: {
      label: "General information",
      badges: ["Life jacket required", "Showers available", "Free parking"],
      transferPrefix: "Bank transfer",
      holderPrefix: "Holder",
    },
    hours: {
      title: "Water leisure operating hours",
      lines: [
        "Weekends · Peak season: 09:00 – 18:00",
        "Off-peak weekdays: 10:00 – 18:00",
      ],
      note: "BBQ operates after water leisure closes (from 19:00).",
    },
    packages: {
      tag: "Stay Packages",
      title: "Stay Packages",
      peakLabel: "Peak season:",
      peakPeriod: "2026.7.17 – 8.17",
      seasonAria: "Season",
      groupSizeAria: "Group size",
      seasonLabels: { peak: "Peak", off: "Off-peak" },
      groupSizeLabels: { "4": "4 guests", "3": "3 guests", "2": "2 guests" },
      packageSuffix: "Stay package rates",
      tableHead: { config: "Package", weekday: "Weekday", saturday: "Saturday" },
      notes: {
        waterpark: "Unlimited water park access included",
        bbqPrefix: "Unlimited BBQ includes",
        under4: "Rates vary by party size — see the corresponding tab.",
      },
      bbqComposition: "Meat · rice · ssamjang · ssammu · kimchi · sausage · dried radish · disposables",
      rows: {
        peak: {
          "4": [
            { config: "Stay + 3 rides", weekday: 65000, saturday: 75000 },
            { config: "Stay + 5 rides", weekday: 79000, saturday: 89000 },
            { config: "Stay + morning unlimited", weekday: 89000, saturday: 99000 },
            { config: "Stay + afternoon unlimited", weekday: 99000, saturday: 109000 },
            { config: "Stay + all-day unlimited", weekday: 109000, saturday: 119000 },
            { config: "Stay + BBQ", weekday: 69000, saturday: 79000 },
            { config: "Stay + 3 rides + BBQ", weekday: 94000, saturday: 104000 },
            { config: "Stay + 5 rides + BBQ", weekday: 108000, saturday: 118000 },
            { config: "Stay + morning unlimited + BBQ", weekday: 118000, saturday: 128000 },
            { config: "Stay + afternoon unlimited + BBQ", weekday: 128000, saturday: 138000 },
            { config: "Stay + all-day unlimited + BBQ", weekday: 138000, saturday: 148000 },
          ],
          "3": [
            { config: "Stay + 3 rides", weekday: 75000, saturday: 85000 },
            { config: "Stay + 5 rides", weekday: 90000, saturday: 100000 },
            { config: "Stay + morning unlimited", weekday: 100000, saturday: 110000 },
            { config: "Stay + afternoon unlimited", weekday: 110000, saturday: 120000 },
            { config: "Stay + all-day unlimited", weekday: 120000, saturday: 130000 },
            { config: "Stay + BBQ", weekday: 79000, saturday: 89000 },
            { config: "Stay + 3 rides + BBQ", weekday: 104000, saturday: 114000 },
            { config: "Stay + 5 rides + BBQ", weekday: 119000, saturday: 129000 },
            { config: "Stay + morning unlimited + BBQ", weekday: 129000, saturday: 139000 },
            { config: "Stay + afternoon unlimited + BBQ", weekday: 139000, saturday: 149000 },
            { config: "Stay + all-day unlimited + BBQ", weekday: 149000, saturday: 159000 },
          ],
          "2": [
            { config: "Stay + 3 rides", weekday: 85000, saturday: 95000 },
            { config: "Stay + 5 rides", weekday: 100000, saturday: 110000 },
            { config: "Stay + morning unlimited", weekday: 110000, saturday: 120000 },
            { config: "Stay + afternoon unlimited", weekday: 120000, saturday: 130000 },
            { config: "Stay + all-day unlimited", weekday: 130000, saturday: 140000 },
            { config: "Stay + BBQ", weekday: 89000, saturday: 99000 },
            { config: "Stay + 3 rides + BBQ", weekday: 114000, saturday: 124000 },
            { config: "Stay + 5 rides + BBQ", weekday: 129000, saturday: 139000 },
            { config: "Stay + morning unlimited + BBQ", weekday: 139000, saturday: 149000 },
            { config: "Stay + afternoon unlimited + BBQ", weekday: 149000, saturday: 159000 },
            { config: "Stay + all-day unlimited + BBQ", weekday: 159000, saturday: 169000 },
          ],
        },
        off: {
          "4": [
            { config: "Stay + 3 rides", weekday: 55000, saturday: 65000 },
            { config: "Stay + 5 rides", weekday: 69000, saturday: 79000 },
            { config: "Stay + morning unlimited", weekday: 79000, saturday: 89000 },
            { config: "Stay + afternoon unlimited", weekday: 89000, saturday: 99000 },
            { config: "Stay + all-day unlimited", weekday: 99000, saturday: 109000 },
            { config: "Stay + BBQ", weekday: 59000, saturday: 69000 },
            { config: "Stay + 3 rides + BBQ", weekday: 84000, saturday: 94000 },
            { config: "Stay + 5 rides + BBQ", weekday: 98000, saturday: 108000 },
            { config: "Stay + morning unlimited + BBQ", weekday: 108000, saturday: 118000 },
            { config: "Stay + afternoon unlimited + BBQ", weekday: 118000, saturday: 128000 },
            { config: "Stay + all-day unlimited + BBQ", weekday: 128000, saturday: 138000 },
          ],
          "3": [
            { config: "Stay + 3 rides", weekday: 65000, saturday: 75000 },
            { config: "Stay + 5 rides", weekday: 80000, saturday: 90000 },
            { config: "Stay + morning unlimited", weekday: 90000, saturday: 100000 },
            { config: "Stay + afternoon unlimited", weekday: 100000, saturday: 110000 },
            { config: "Stay + all-day unlimited", weekday: 110000, saturday: 120000 },
            { config: "Stay + BBQ", weekday: 69000, saturday: 79000 },
            { config: "Stay + 3 rides + BBQ", weekday: 94000, saturday: 104000 },
            { config: "Stay + 5 rides + BBQ", weekday: 109000, saturday: 119000 },
            { config: "Stay + morning unlimited + BBQ", weekday: 119000, saturday: 129000 },
            { config: "Stay + afternoon unlimited + BBQ", weekday: 129000, saturday: 139000 },
            { config: "Stay + all-day unlimited + BBQ", weekday: 139000, saturday: 149000 },
          ],
          "2": [
            { config: "Stay + 3 rides", weekday: 75000, saturday: 85000 },
            { config: "Stay + 5 rides", weekday: 90000, saturday: 100000 },
            { config: "Stay + morning unlimited", weekday: 100000, saturday: 110000 },
            { config: "Stay + afternoon unlimited", weekday: 110000, saturday: 120000 },
            { config: "Stay + all-day unlimited", weekday: 120000, saturday: 130000 },
            { config: "Stay + BBQ", weekday: 79000, saturday: 89000 },
            { config: "Stay + 3 rides + BBQ", weekday: 104000, saturday: 114000 },
            { config: "Stay + 5 rides + BBQ", weekday: 119000, saturday: 129000 },
            { config: "Stay + morning unlimited + BBQ", weekday: 129000, saturday: 139000 },
            { config: "Stay + afternoon unlimited + BBQ", weekday: 139000, saturday: 149000 },
            { config: "Stay + all-day unlimited + BBQ", weekday: 149000, saturday: 159000 },
          ],
        },
      },
    },
  },

  infoGallery: {
    tag: "Info",
    title: "Water leisure info in pictures",
    description:
      "Rates, facility guides, and everything you need to know — all in images.",
    cta: "Browse gallery",
    modalTitle: "Water leisure info gallery",
    close: "Close",
    prev: "Previous",
    next: "Next",
    imageAlt: "Water leisure info {n}",
    counter: "{current} / {total}",
  },

  detailPages: {
    backLabel: "← Back",
    reserveCta: "Reserve",
    priceHeading: "Pricing",
    infoHeading: "Details",
    galleryHeading: "Photos",
    items: {
      rides: {
        title: "Water Play Rides",
        subtitle: "8 water play rides",
        intro:
          "From heart-pounding thrills to relaxed rides — 8 options to choose from. A ride pass also gives you free access to the slides and water park.",
        prices: [],
        info: [
          "Free slide and water park access with any ride pass",
          "Life jacket required (provided free of charge)",
          "Please follow all safety rules",
        ],
      },
      ski: {
        title: "Water-ski · Wakeboard",
        subtitle: "Beginner lessons and experienced rides",
        intro:
          "Beginners start safely with 1 land session and 2 water sessions. Once you've completed the beginner lesson, you can book the ride only.",
        prices: [
          {
            label: "Beginner lesson",
            price: 65000,
            note: "Two-ski or wakeboard · 1 land + 2 water sessions",
          },
          {
            label: "Experienced ride",
            price: 28000,
            note: "Available after completing the beginner lesson",
          },
        ],
        info: [
          "Life jacket required (provided free of charge)",
          "Certified instructors stay with you throughout",
          "Non-swimmers are welcome",
        ],
      },
      wakesurf: {
        title: "Wakesurf (Inboat)",
        subtitle: "Only 3 in Korea · Luxury inboat",
        intro:
          "Wakesurf behind our luxury inboat. Ride the powerful wake generated by the inboat and feel true surfing energy.",
        prices: [
          {
            label: "Inboat ride",
            price: 25000,
            note: "Per person · Minimum 5 guests",
          },
        ],
        info: [
          "15 minutes · Book with a minimum of 5 guests",
          "Life jacket provided free",
          "Wakesurf runs while you stay aboard the inboat",
        ],
      },
      waterpark: {
        title: "Water Park",
        subtitle: "Slides · Water play · Facilities",
        intro:
          "You can visit the water park on its own without any ride pass. Great for families and kids.",
        prices: [{ label: "Water park only", price: 10000 }],
        info: [
          "Free water park access included with any ride pass",
          "Life jackets provided · showers available",
        ],
      },
      bbq: {
        title: "Unlimited BBQ",
        subtitle: "Premium BBQ after your water day",
        intro:
          "Unlimited BBQ with meat, rice, sausage, kimchi, ssamjang, ssammu, king oyster mushroom, and disposables. The perfect way to end a day on the water.",
        prices: [
          { label: "Included in package", price: 29000, note: "per person" },
          { label: "Same-day walk-in", price: 30000, note: "per person" },
          {
            label: "Charcoal only (up to 4)",
            price: 30000,
            note: "+₩5,000 per additional guest",
          },
        ],
        info: [
          "Unlimited BBQ service hours: 19:00 – 21:00 (weekends)",
          "After 21:00 guests are welcome to keep enjoying any remaining food at their seats",
          "Includes: Meat · rice · sausage · kimchi · ssamjang · ssammu · king oyster mushroom · disposables",
        ],
      },
      cafe: {
        title: "Floating Cafe",
        subtitle: "A private cafe floating on the water",
        intro:
          "A one-of-a-kind time on a boat floating on the lake. Rent the space privately for your own party or gathering.",
        prices: [],
        info: [
          "Private space rental available",
          "Karaoke available",
          "PlayStation games · movie streaming",
          "Wide-open lake views and comfy sofas",
        ],
      },
      rooftop: {
        title: "Rooftop",
        subtitle: "Relax and recharge on the rooftop",
        intro:
          "Enjoy food freely and unwind on the rooftop. Sunbathing and photo spots included.",
        prices: [],
        info: [
          "Bring and enjoy your own food",
          "Coffee and drinks available",
          "Sunbathing (tanning) allowed",
          "Photo spots ready",
        ],
      },
      stay: {
        title: "Stay",
        subtitle: "4 / 5 / 6 / 8-guest rooms",
        intro:
          "A cozy night in the Gapyeong outdoors. Choose from 4- to 8-guest rooms. The 5- and 6-guest rooms include a loft, so extra guests can join.",
        prices: [],
        info: [
          "4-guest room: min 4 / max 4 guests (no loft)",
          "5-guest room: min 5 / max 6 guests (loft included)",
          "6-guest room: min 6 / max 8 guests (loft included)",
          "8-guest room: min 8 / max 10 guests (no loft)",
        ],
        rooms: [
          { key: "stay4", title: "4-guest room", desc: "Min 4 / max 4 · no loft" },
          { key: "stay5", title: "5-guest room", desc: "Min 5 / max 6 · loft included" },
          { key: "stay6", title: "6-guest room", desc: "Min 6 / max 8 · loft included" },
          { key: "stay8", title: "8-guest room", desc: "Min 8 / max 10 · no loft" },
        ],
        amenities: {
          title: "In-room amenities",
          items: [
            "Cutlery set",
            "Pot & frying pan",
            "Rice bowl · plate · large bowl",
            "Ladle · scissors · tongs",
            "Refrigerator · microwave",
            "TV · air conditioner",
            "Dining table",
            "Towels",
          ],
          note: "Shower amenities are not provided — please bring your own.",
        },
      },
    },
  },

  safety: {
    tag: "Safety First",
    title: "For beginners &\nsafety info",
    intro:
      "Water leisure is a place where fun and safety go hand in hand. First-timers and non-swimmers alike can enjoy every activity with peace of mind.",
    features: [
      {
        icon: "🦺",
        title: "Free life jackets",
        description:
          "Every activity comes with a life jacket that meets international safety standards — free of charge. Children's sizes are also available.",
      },
      {
        icon: "👨‍🏫",
        title: "Certified instructors on site",
        description:
          "Experienced instructors are always on hand. First-time water-skiers and wakeboarders get 1-on-1 coaching so you can enjoy the ride safely.",
      },
      {
        icon: "🏊",
        title: "Non-swimmers welcome",
        description:
          "Can't swim? No problem. Life jackets are mandatory and an instructor stays by your side. Beginners can jump in with confidence.",
      },
      {
        icon: "🏥",
        title: "Emergency response ready",
        description:
          "EMT-qualified staff are on site. AED and first-aid equipment are on hand, and we're connected to Gapyeong hospitals for emergencies.",
      },
      {
        icon: "🌊",
        title: "Separated water zones",
        description:
          "Activity zones and general swim zones are clearly separated. Water safety officers are stationed in each zone to prevent accidents.",
      },
      {
        icon: "📋",
        title: "Pre-activity safety briefing",
        description:
          "A 10–15 minute safety briefing is mandatory before every activity. Once you know the rules, you can enjoy every ride worry-free.",
      },
    ],
    ctaTitle: "Any questions?",
    ctaSubtitle: "Reach us by phone or through the Naver reservation chat — ask anything.",
    ctaStore: "Reserve now",
  },

  faq: {
    tag: "Frequently Asked Questions",
    title: "Frequently Asked Questions",
    items: [
      {
        id: "beginner",
        question: "Can beginners try water-skiing or wakeboarding?",
        answer:
          "Yes. Water leisure runs a beginner program with 1 land session and 2 water sessions for ₩65,000. If you already have experience, you can book just the ride for ₩28,000.",
      },
      {
        id: "swim",
        question: "Can I join even if I can't swim?",
        answer:
          "Yes. Life jackets are required for every water activity, and first-time visitors are always guided by an instructor — you can enjoy everything safely.",
      },
      {
        id: "rain",
        question: "Can I cancel or reschedule if it rains?",
        answer:
          "Package cancellations due to rain are not accepted. Package deposits are non-refundable, but you can reschedule up to 7 days before your visit. A 20% fee applies to any change of package contents or date (room policies apply separately).",
      },
      {
        id: "parking",
        question: "Is parking available?",
        answer: "Yes, free parking is available on site — no additional charge.",
      },
      {
        id: "transit",
        question: "How do I get there by public transit?",
        answer:
          "From Gapyeong Station take bus 71-3 or 71-2 and get off at 'Gapyeong-sudowon' (approx. 16–18 min ride, then a 3-minute walk). The bus stop sign or nearby buildings may say 'Gapyeong-sudeokwon' — don't worry, that's the correct stop.",
      },
      {
        id: "pickup",
        question: "Is there a grocery pickup service?",
        answer:
          "Yes, we run a pickup service in partnership with Joeun Mart. Get off at Gulbongsan Station, the Joeun Mart shuttle picks you up, shop at the mart, and the shuttle drops you off at Water leisure — and picks you up again on your way home. The condition is a minimum of ₩15,000 in groceries per person (e.g., ₩50,000 for a party of 4). Small parties and groups are both welcome.",
      },
      {
        id: "bbq",
        question: "What's included in the unlimited BBQ?",
        answer:
          "Unlimited BBQ includes meat, rice, sausage, kimchi, ssamjang, ssammu, king oyster mushroom, and disposables. Add the BBQ option to any stay package to enjoy it.",
      },
      {
        id: "peak-season",
        question: "When is peak season?",
        answer:
          "Peak season runs from July 17 to August 17, 2026. Stay-package rates differ between peak and off-peak, so please check before booking.",
      },
    ],
    refund: {
      tag: "Cancellation & Refund",
      title: "Cancellation & Refund Policy",
      packageRulesTitle: "Package · General rules",
      packageRules: [
        "Package deposits are non-refundable",
        "Date changes accepted up to 7 days before use",
        "20% penalty applies to changes in package contents or date (package and room policies apply separately)",
        "Package cancellations due to rain are not accepted",
      ],
      roomTitle: "Cancellation fees for room changes (personal reasons)",
      roomHead: { when: "Timing", fee: "Fee" },
      roomSchedule: [
        { when: "Room base", fee: "30%" },
        { when: "D-14 before use", fee: "40%" },
        { when: "D-10 before use", fee: "50%" },
        { when: "D-9 before use", fee: "60%" },
        { when: "D-8 before use", fee: "70%" },
        { when: "D-7 or later", fee: "No refund" },
      ],
      noRefundLabel: "No refund",
    },
    contactTitle: "Didn't find your answer?",
    contactSubtitle: "Give us a call — we're happy to help.",
  },

  minorPolicy: {
    tag: "Policy Notice",
    title: "Minor Guests — Stay Policy",
    introStrong1: "Same-gender friend groups can stay",
    introMid: " · ",
    introStrong2: "Mixed-gender stays not allowed",
    introEnd: ". Parental consent and the documents below are required.",
    docsLabel: "Required documents",
    docs: [
      { strong: "Parental consent form", rest: " (download template below)" },
      { strong: "Copy of parent's ID", rest: " (last digits of ID number may be masked)" },
      { strong: "Family relations certificate", rest: " (recently issued)" },
    ],
    formTitle: "Consent form template",
    formSubtitle: "Download, fill in, and bring on check-in day — pre-submission is also fine",
    formDownload: "Download form",
    formDownloadFilename: "WaterLeisure_MinorStay_ConsentForm.jpg",
    formShowExample: "Show sample",
    formHideExample: "Hide sample",
    formExampleAlt: "Filled-in example of the minor stay consent form",
    contactPromptPre: "Before booking, please ",
    contactPromptStrong: "contact us first",
    contactPromptPost: " about accommodation.",
  },

  channels: {
    tag: "Our Channels",
    title: "Find us online",
    intro: "Catch live footage and the latest updates from Water leisure on our video and blog channels.",
    youtube: {
      tag: "YouTube",
      name: "JangchojiTV",
      description: "Watch on-site water leisure footage and activity highlights.",
      cta: "Visit channel",
      videoAria: "Watch featured video from JangchojiTV",
      thumbnailAlt: "JangchojiTV featured video thumbnail",
    },
    blog: {
      tag: "Naver Blog",
      name: "Naver Blog",
      description: "Detailed guides, guest reviews, and seasonal news.",
      cta: "Visit blog",
      mark: "Blog",
      overlay: "Blog",
      previewAlt: "Naver blog content preview",
    },
    instagram: {
      tag: "Instagram",
      name: "@mad.water.ski",
      description: "On-site photos and riding moments — follow us on Instagram.",
      cta: "Visit Instagram",
      overlay: "IG",
      previewAlt: "Instagram content preview",
    },
  },

  directions: {
    tag: "Getting Here",
    title: "Getting Here",
    address: {
      title: "Address",
      postalCodeLabel: "Postal code",
      roadTag: "Road name",
      parcelTag: "Land lot",
      roadAria: "Road-name address",
      parcelAria: "Land-lot address",
      naver: "Open in Naver Map",
      kakao: "Open in Kakao Map",
      copyDone: "Copied",
      copyLabel: "Copy",
      copyAriaSuffix: "copy",
      mapTitleSuffix: "map",
    },
    bus: {
      title: "Public transit (bus)",
      subtitlePre: "From Gapyeong Station · get off at ",
      subtitleStation: "Gapyeong-sudowon",
      subtitlePost: " · 16–18 min by bus, then a 3-minute walk",
      warning: {
        pre: "The bus stop sign or nearby buildings may say ",
        strong1: '"Gapyeong-sudeokwon"',
        mid: ", but ",
        strong2: "that's still the correct stop",
        post: " — please get off there.",
      },
      routes: [
        {
          no: "71-3",
          stops: "10 stops",
          duration: "approx. 18 min",
          times: ["06:55 (first)", "09:14", "13:55", "14:55", "18:04 (last)"],
          walkingGuide: [
            "Get off at Gapyeong-sudowon",
            "Cross the road and walk back in the direction the bus came — you'll reach Gapyeong-sudeokwon",
            "Past Sudeokwon, look for the black 'Water leisure' sign",
            "Follow the farm road and you're here",
          ],
        },
        {
          no: "71-2",
          stops: "14 stops",
          duration: "approx. 16 min",
          times: ["11:15 (first)", "16:43", "19:13 (last)"],
          walkingGuide: [
            "Get off at Gapyeong-sudowon",
            "Don't cross — walk straight ahead",
            "A short walk and you'll see the black 'Water leisure' sign",
            "Follow the farm road and you're here",
          ],
        },
      ],
      routeNoSuffix: "",
      timesLabel: "Departure times",
      walkLabel: "Walking directions",
      contactPre: "Bus inquiries · ",
      contactName: "가평교통",
      contactPhone: "033-241-7342",
      contactNote: "(please confirm the latest schedule before boarding)",
    },
    pickup: {
      title: "Joeun Mart pickup service",
      subtitle: "Get off at Gulbongsan Station, then hop on the Joeun Mart pickup shuttle for a hassle-free arrival.",
      steps: [
        "Get off at Gulbongsan Station",
        "Board the Joeun Mart pickup shuttle",
        "Shop at Joeun Mart",
        "Shuttle to Water leisure",
        "Return pickup on your way home",
      ],
      conditionTitle: "Conditions",
      conditionPre: "Minimum ",
      conditionStrong1: "₩15,000 in groceries per person",
      conditionMid: " · e.g., for a party of 4, ",
      conditionStrong2: "at least ₩50,000",
      conditionPost: " qualifies you for round-trip pickup (small parties and groups all welcome).",
      conditionExtra:
        "Joeun Mart is a large supermarket in Gapyeong stocking meat, drinks, snacks, refrigerated/frozen goods, disposables, and more. Just leave a pickup request after booking and we'll connect you.",
    },
    phoneLabel: "Phone inquiries / reservations",
    phoneOwnerLine: "장우진 · Water leisure",
  },

  footer: {
    tag: "SINCE 2025",
    description:
      "Water leisure in Gapyeong.\nWater play rides, water-ski, wakeboard, wakesurf,\nwater park, floating cafe, rooftop, BBQ, and stay — all in one place.",
    social: {
      youtube: "YouTube",
      blog: "Blog",
      instagram: "Instagram",
      store: "Store",
    },
    socialAria: {
      youtube: "JangchojiTV YouTube channel",
      blog: "Naver blog",
      instagram: "Instagram @mad.water.ski",
      store: "Naver Smart Store",
    },
    quickLinksTitle: "Quick links",
    quickLinks: [
      { href: "#activities", label: "Activities" },
      { href: "#pricing", label: "Pricing" },
      { href: "#packages", label: "Stay packages" },
      { href: "#safety", label: "Safety" },
      { href: "#faq", label: "FAQ" },
      { href: "#refund", label: "Cancellation" },
      { href: "#minor-policy", label: "Minor guests" },
      { href: "#channels", label: "Online channels" },
      { href: "#directions", label: "Directions" },
    ],
    contactTitle: "Contact & directions",
    postalPrefix: "Postal code",
    hoursTitle: "Hours",
    hoursWeekday: "Weekdays 09:00 – 18:00",
    hoursWeekend: "Weekends & holidays 08:00 – 20:00",
    hoursPeak: "Peak season (Jul–Aug) 08:00 – 21:00",
    reserve: "Reserve →",
    businessLabel: "Business:",
    ownerLabel: "Owner:",
    rightsReserved: "All rights reserved.",
  },

  languageSwitcher: {
    ariaLabel: "Language",
    ko: "한국어",
    en: "English",
    ariaCurrent: "Current language",
  },
};
