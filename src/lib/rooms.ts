// 객실 메타데이터 · 두 층위로 나뉨.
//
// 1) RoomType (고객에게 노출) - 4가지 : 4인실 · 5인실 · 6인실 · 8인실
//    고객은 유형만 선택. 서버가 자동으로 물리 객실 A/B 중 하나로 배정.
// 2) RoomKey (내부 · 관리자용) - 물리 객실 7개 :
//    - 4인실, 5인실, 6인실 : A/B 각 2개씩 (총 6)
//    - 8인실 : 1개
//    DB reservations.room_key 는 물리 객실 값을 저장.

export const ROOM_TYPES = ["room_4", "room_5", "room_6", "room_8"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_KEYS = [
  "room_4_a",
  "room_4_b",
  "room_5_a",
  "room_5_b",
  "room_6_a",
  "room_6_b",
  "room_8",
] as const;
export type RoomKey = (typeof ROOM_KEYS)[number];

export type RoomTypeInfo = {
  type: RoomType;
  title: string; // "4인실"
  minGuests: number;
  maxGuests: number;
  hasLoft: boolean;
  physicals: readonly RoomKey[]; // ["room_4_a", "room_4_b"]
};

export const ROOM_TYPE_META: Record<RoomType, RoomTypeInfo> = {
  room_4: {
    type: "room_4",
    title: "4인실",
    minGuests: 4,
    maxGuests: 4,
    hasLoft: false,
    physicals: ["room_4_a", "room_4_b"],
  },
  room_5: {
    type: "room_5",
    title: "5인실",
    minGuests: 5,
    maxGuests: 6,
    hasLoft: true,
    physicals: ["room_5_a", "room_5_b"],
  },
  room_6: {
    type: "room_6",
    title: "6인실",
    minGuests: 6,
    maxGuests: 8,
    hasLoft: true,
    physicals: ["room_6_a", "room_6_b"],
  },
  room_8: {
    type: "room_8",
    title: "8인실",
    minGuests: 8,
    maxGuests: 10,
    hasLoft: false,
    physicals: ["room_8"],
  },
};

export type RoomInfo = {
  key: RoomKey;
  type: RoomType;
  title: string; // "4인실 A" · "8인실"
  minGuests: number;
  maxGuests: number;
  hasLoft: boolean;
  sublabel: string | null; // "A" · "B" · null
};

export const ROOMS: Record<RoomKey, RoomInfo> = {
  room_4_a: { key: "room_4_a", type: "room_4", title: "4인실 A", minGuests: 4, maxGuests: 4, hasLoft: false, sublabel: "A" },
  room_4_b: { key: "room_4_b", type: "room_4", title: "4인실 B", minGuests: 4, maxGuests: 4, hasLoft: false, sublabel: "B" },
  room_5_a: { key: "room_5_a", type: "room_5", title: "5인실 A", minGuests: 5, maxGuests: 6, hasLoft: true, sublabel: "A" },
  room_5_b: { key: "room_5_b", type: "room_5", title: "5인실 B", minGuests: 5, maxGuests: 6, hasLoft: true, sublabel: "B" },
  room_6_a: { key: "room_6_a", type: "room_6", title: "6인실 A", minGuests: 6, maxGuests: 8, hasLoft: true, sublabel: "A" },
  room_6_b: { key: "room_6_b", type: "room_6", title: "6인실 B", minGuests: 6, maxGuests: 8, hasLoft: true, sublabel: "B" },
  room_8: { key: "room_8", type: "room_8", title: "8인실", minGuests: 8, maxGuests: 10, hasLoft: false, sublabel: null },
};

export function isRoomKey(v: unknown): v is RoomKey {
  return typeof v === "string" && (ROOM_KEYS as readonly string[]).includes(v);
}
export function isRoomType(v: unknown): v is RoomType {
  return typeof v === "string" && (ROOM_TYPES as readonly string[]).includes(v);
}

export function typeOfRoom(key: RoomKey): RoomType {
  return ROOMS[key].type;
}

export function physicalsOfType(type: RoomType): readonly RoomKey[] {
  return ROOM_TYPE_META[type].physicals;
}

export function roomDescription(info: RoomTypeInfo): string {
  const cap =
    info.minGuests === info.maxGuests
      ? `${info.minGuests}인`
      : `최소 ${info.minGuests}인 / 최대 ${info.maxGuests}인`;
  const loft = info.hasLoft ? "다락방 포함" : "다락방 없음";
  return `${cap} · ${loft}`;
}

// 물리 객실별 가용성(true=예약 가능) → 유형별 요약
export function summarizeAvailability(
  physicalAvail: Record<RoomKey, boolean>,
): Record<RoomType, { available: number; total: number; freePhysicals: RoomKey[] }> {
  const out = {} as Record<RoomType, { available: number; total: number; freePhysicals: RoomKey[] }>;
  for (const t of ROOM_TYPES) {
    const physicals = ROOM_TYPE_META[t].physicals;
    const free = physicals.filter((k) => physicalAvail[k]);
    out[t] = { available: free.length, total: physicals.length, freePhysicals: [...free] };
  }
  return out;
}
