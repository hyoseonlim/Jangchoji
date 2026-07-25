// 성수기 기간 (연도별 확장 가능). 양 끝 포함.
// src/i18n/ko.ts pricing.packages.peakPeriod 와 값이 일치해야 합니다.
export const PEAK_RANGES: ReadonlyArray<{ start: string; end: string }> = [
  { start: "2026-07-17", end: "2026-08-17" },
];

// 한국 공휴일 (대체공휴일 포함). 공휴일은 요금 계산 시 '토요일' 요금이 적용됩니다.
// 매년 연말/연초에 다음 해 공휴일을 추가해주세요.
// npm 라이브러리 date-holidays 로 대체 가능하지만, 소규모 운영이라 하드코딩 유지.
export const HOLIDAYS: Record<string, string> = {
  // 2026
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "삼일절 대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "부처님오신날 대체공휴일",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "광복절 대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "개천절 대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
  // 2027 (샘플, 실제 공휴일 확정 후 갱신 필요)
  "2027-01-01": "신정",
};

export type Season = "peak" | "off";
export type GroupSize = "4" | "3" | "2";
export type DayType = "weekday" | "saturday";

export function seasonForDate(date: Date): Season {
  const iso = toISODate(date);
  return PEAK_RANGES.some((r) => iso >= r.start && iso <= r.end) ? "peak" : "off";
}

export function isHoliday(date: Date): boolean {
  return toISODate(date) in HOLIDAYS;
}

export function holidayName(date: Date): string | null {
  return HOLIDAYS[toISODate(date)] ?? null;
}

// 요금 판정용 day_type. 토요일 또는 공휴일이면 saturday 요금 적용.
export function dayTypeForDate(date: Date): DayType {
  if (isHoliday(date)) return "saturday";
  return date.getDay() === 6 ? "saturday" : "weekday";
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  // Local timezone midnight. iso = YYYY-MM-DD
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// [checkIn, checkOut) 사이 모든 밤을 반환 (checkOut 은 포함하지 않음)
export function nightsBetween(checkInISO: string, checkOutISO: string): Date[] {
  const start = parseISODate(checkInISO);
  const end = parseISODate(checkOutISO);
  const nights: Date[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    nights.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return nights;
}

// 예약 전체가 peak / off / 두 계절에 걸쳐있으면 mixed 반환
export function summarizeSeason(nights: Date[]): "peak" | "off" | "mixed" {
  const set = new Set(nights.map(seasonForDate));
  if (set.size === 0) return "off";
  if (set.size > 1) return "mixed";
  return [...set][0];
}

export const CONFIG_KEYS = [
  "rides3",
  "rides5",
  "morning",
  "afternoon",
  "allday",
  "stay_bbq",
  "rides3_bbq",
  "rides5_bbq",
  "morning_bbq",
  "afternoon_bbq",
  "allday_bbq",
] as const;
export type ConfigKey = (typeof CONFIG_KEYS)[number];

export const CONFIG_LABELS: Record<ConfigKey, string> = {
  rides3: "숙박 + 놀이기구 3종",
  rides5: "숙박 + 놀이기구 5종",
  morning: "숙박 + 놀이기구 오전무제한",
  afternoon: "숙박 + 놀이기구 오후무제한",
  allday: "숙박 + 놀이기구 종일무제한",
  stay_bbq: "숙박 + BBQ",
  rides3_bbq: "숙박 + 놀이기구 3종 + BBQ",
  rides5_bbq: "숙박 + 놀이기구 5종 + BBQ",
  morning_bbq: "숙박 + 놀이기구 오전무제한 + BBQ",
  afternoon_bbq: "숙박 + 놀이기구 오후무제한 + BBQ",
  allday_bbq: "숙박 + 놀이기구 종일무제한 + BBQ",
};

export function isConfigKey(v: unknown): v is ConfigKey {
  return typeof v === "string" && (CONFIG_KEYS as readonly string[]).includes(v);
}

// DB products 행의 클라이언트용 뷰. group_size 는 현 스코프상 '4' 고정이라 뺐음.
export type PackagePriceRow = {
  config_key: ConfigKey;
  season: Season;
  day_type: DayType;
  price: number;
};

export type ConfigPriceRange = { min: number; max: number };

// configKey 별로 (season, day_type) 4조합 중 최저·최고가.
export function priceRangeByConfig(rows: PackagePriceRow[]): Record<ConfigKey, ConfigPriceRange | null> {
  const out: Record<string, ConfigPriceRange | null> = {};
  for (const key of CONFIG_KEYS) out[key] = null;
  for (const r of rows) {
    const cur = out[r.config_key];
    out[r.config_key] = cur
      ? { min: Math.min(cur.min, r.price), max: Math.max(cur.max, r.price) }
      : { min: r.price, max: r.price };
  }
  return out as Record<ConfigKey, ConfigPriceRange | null>;
}

// 선택된 일정 [checkIn, checkOut) 에 대해 각 configKey 의 1인 총 숙박비.
// products.price 는 1인 1박 가격. 매 밤의 (season, day_type) 요금 합.
// 매칭되는 요금이 없으면 null.
export function perPersonStayTotalByConfig(
  rows: PackagePriceRow[],
  checkIn: string,
  checkOut: string,
): Record<ConfigKey, number | null> {
  const out: Record<string, number | null> = {};
  for (const key of CONFIG_KEYS) out[key] = null;

  const nights = nightsBetween(checkIn, checkOut);
  if (nights.length === 0) return out as Record<ConfigKey, number | null>;

  const lookup = new Map<string, number>();
  for (const r of rows) lookup.set(`${r.config_key}:${r.season}:${r.day_type}`, r.price);

  for (const key of CONFIG_KEYS) {
    let perPersonTotal = 0;
    let ok = true;
    for (const night of nights) {
      const season = seasonForDate(night);
      const dayType = dayTypeForDate(night);
      const price = lookup.get(`${key}:${season}:${dayType}`);
      if (price == null) {
        ok = false;
        break;
      }
      perPersonTotal += price;
    }
    out[key] = ok ? perPersonTotal : null;
  }
  return out as Record<ConfigKey, number | null>;
}

// packageSelections : { rides3: 3, rides5: 2, allday: 1 } 형태.
// 인원이 서로 다른 패키지를 선택할 수 있음. Σ quantity 는 guestsCount 와 일치해야 함.
export type PackageSelections = Partial<Record<ConfigKey, number>>;

export type PackageLine = {
  configKey: ConfigKey;
  label: string;
  quantity: number;
  perPersonSubtotal: number; // 1인 총 숙박비 (모든 밤 합)
  lineTotal: number; // perPersonSubtotal × quantity
};

// 선택된 수량 목록을 기반으로 개별 라인 + 총합을 계산.
// 잘못된 가격 참조가 있으면 lines[i] 의 perPersonSubtotal 이 -1 이 되지 않고 아예 null 반환.
export function computeSelectionLines(
  perPersonByConfig: Record<ConfigKey, number | null>,
  selections: PackageSelections,
): { lines: PackageLine[]; total: number; totalQuantity: number } | null {
  const lines: PackageLine[] = [];
  let total = 0;
  let totalQuantity = 0;
  for (const key of CONFIG_KEYS) {
    const quantity = Math.max(0, Math.trunc(selections[key] ?? 0));
    if (quantity === 0) continue;
    const perPerson = perPersonByConfig[key];
    if (perPerson == null) return null;
    const lineTotal = perPerson * quantity;
    lines.push({
      configKey: key,
      label: CONFIG_LABELS[key],
      quantity,
      perPersonSubtotal: perPerson,
      lineTotal,
    });
    total += lineTotal;
    totalQuantity += quantity;
  }
  return { lines, total, totalQuantity };
}

// 관리자 표시용 요약 문자열. 예: "3종×3, 5종×2, 종일무제한×1"
export function summarizePackageLines(lines: PackageLine[]): string {
  return lines
    .map((l) => {
      // 라벨에서 "숙박 + " 접두 제거 → 간결화
      const short = l.label.replace(/^숙박\s*\+\s*(놀이기구\s*)?/, "");
      return `${short}×${l.quantity}`;
    })
    .join(", ");
}

export function summarizeSeasonFromRange(checkIn: string, checkOut: string): Season | "mixed" | null {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights.length === 0) return null;
  return summarizeSeason(nights);
}

// 선택 기간 [checkIn, checkOut) 에 포함된 공휴일 목록 (안내용).
export function holidaysInRange(
  checkIn: string,
  checkOut: string,
): Array<{ date: string; name: string }> {
  const nights = nightsBetween(checkIn, checkOut);
  const out: Array<{ date: string; name: string }> = [];
  for (const n of nights) {
    const iso = toISODate(n);
    const name = HOLIDAYS[iso];
    if (name) out.push({ date: iso, name });
  }
  return out;
}
