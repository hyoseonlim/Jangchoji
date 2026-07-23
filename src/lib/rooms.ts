// 객실 메타데이터. DB 의 room_key 컬럼과 값이 일치해야 합니다.

export const ROOM_KEYS = ["room_4", "room_5", "room_6", "room_8"] as const;
export type RoomKey = (typeof ROOM_KEYS)[number];

export type RoomInfo = {
  key: RoomKey;
  title: string;
  minGuests: number;
  maxGuests: number;
  hasLoft: boolean;
};

export const ROOMS: Record<RoomKey, RoomInfo> = {
  room_4: { key: "room_4", title: "4인실", minGuests: 4, maxGuests: 4, hasLoft: false },
  room_5: { key: "room_5", title: "5인실", minGuests: 5, maxGuests: 6, hasLoft: true },
  room_6: { key: "room_6", title: "6인실", minGuests: 6, maxGuests: 8, hasLoft: true },
  room_8: { key: "room_8", title: "8인실", minGuests: 8, maxGuests: 10, hasLoft: false },
};

export function isRoomKey(v: unknown): v is RoomKey {
  return typeof v === "string" && (ROOM_KEYS as readonly string[]).includes(v);
}

export function roomDescription(info: RoomInfo): string {
  const cap =
    info.minGuests === info.maxGuests
      ? `${info.minGuests}인`
      : `최소 ${info.minGuests}인 / 최대 ${info.maxGuests}인`;
  const loft = info.hasLoft ? "다락방 포함" : "다락방 없음";
  return `${cap} · ${loft}`;
}
