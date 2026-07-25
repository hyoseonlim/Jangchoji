"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/i18n";
import {
  CONFIG_KEYS,
  CONFIG_LABELS,
  type ConfigKey,
  type PackageLine,
  type PackagePriceRow,
  type PackageSelections,
  computeSelectionLines,
  holidaysInRange,
  perPersonStayTotalByConfig,
  priceRangeByConfig,
  summarizeSeasonFromRange,
} from "@/lib/pricing";
import {
  ROOM_KEYS,
  ROOM_TYPES,
  ROOM_TYPE_META,
  ROOMS,
  summarizeAvailability,
  type RoomKey,
  type RoomType,
} from "@/lib/rooms";
import { CopyableAccount } from "../CopyableAccount";

const MIN_GUESTS = 4;
const MAX_GUESTS = Math.max(...Object.values(ROOMS).map((r) => r.maxGuests));

type RoomAvailability = Record<RoomKey, boolean>;
const ALL_AVAILABLE: RoomAvailability = Object.fromEntries(
  ROOM_KEYS.map((k) => [k, true]),
) as RoomAvailability;

type Guest = { name: string; phone: string; isRepresentative: boolean };

type DoneSnapshot = {
  totalPrice: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: RoomType;
  guestsCount: number;
  lines: PackageLine[];
  season: "peak" | "off" | "mixed" | null;
};

const numberFmt = new Intl.NumberFormat("ko-KR");
const won = (n: number) => `₩${numberFmt.format(n)}`;

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
function formatDateKo(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${m}월 ${d}일 (${DAY_KO[dt.getDay()]})`;
}

type RoomStatus =
  | { kind: "available"; freeCount: number; total: number }
  | { kind: "booked" }
  | { kind: "mismatch"; reason: string };

function roomStatusForType(
  type: RoomType,
  guestsCount: number,
  physicalAvail: RoomAvailability,
): RoomStatus {
  const meta = ROOM_TYPE_META[type];
  if (guestsCount < meta.minGuests) {
    return { kind: "mismatch", reason: `${meta.minGuests}인부터 예약` };
  }
  if (guestsCount > meta.maxGuests) {
    return { kind: "mismatch", reason: `최대 ${meta.maxGuests}인` };
  }
  const freeCount = meta.physicals.filter((k) => physicalAvail[k]).length;
  if (freeCount === 0) return { kind: "booked" };
  return { kind: "available", freeCount, total: meta.physicals.length };
}

const EMPTY_SELECTIONS: PackageSelections = {};

export function ReserveForm({
  dict,
  locale,
  packagePrices,
}: {
  dict: Dictionary;
  locale: Locale;
  packagePrices: PackagePriceRow[];
}) {
  void dict;

  const [checkIn, setCheckIn] = useState(() => todayISO(7));
  const [checkOut, setCheckOut] = useState(() => todayISO(8));
  const [guestsCount, setGuestsCount] = useState(MIN_GUESTS);
  const [roomType, setRoomType] = useState<RoomType>("room_4");
  const [availability, setAvailability] = useState<RoomAvailability>(ALL_AVAILABLE);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [selections, setSelections] = useState<PackageSelections>(EMPTY_SELECTIONS);
  const [guests, setGuests] = useState<Guest[]>([
    { name: "", phone: "", isRepresentative: true },
  ]);
  const [memo, setMemo] = useState("");
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [depositorName, setDepositorName] = useState("");
  const [depositorEdited, setDepositorEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<DoneSnapshot | null>(null);

  const representative = guests.find((g) => g.isRepresentative);
  const representativeName = representative?.name.trim() ?? "";
  const representativePhone = representative?.phone.trim() ?? "";

  const priceRanges = useMemo(() => priceRangeByConfig(packagePrices), [packagePrices]);
  const perPersonByConfig = useMemo(
    () => perPersonStayTotalByConfig(packagePrices, checkIn, checkOut),
    [packagePrices, checkIn, checkOut],
  );
  const selectionResult = useMemo(
    () => computeSelectionLines(perPersonByConfig, selections),
    [perPersonByConfig, selections],
  );
  const totalQuantity = selectionResult?.totalQuantity ?? 0;
  const remainingQuantity = Math.max(0, guestsCount - totalQuantity);
  const grandTotal = selectionResult?.total ?? 0;
  const season = useMemo(() => summarizeSeasonFromRange(checkIn, checkOut), [checkIn, checkOut]);
  const holidayNotes = useMemo(() => holidaysInRange(checkIn, checkOut), [checkIn, checkOut]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
    return Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
    );
  }, [checkIn, checkOut]);

  const selectedRoomMeta = ROOM_TYPE_META[roomType];
  const selectedStatus = roomStatusForType(roomType, guestsCount, availability);
  const typeSummary = useMemo(() => summarizeAvailability(availability), [availability]);

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setAvailability(ALL_AVAILABLE);
      setAvailabilityError(null);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    fetch(
      `/api/rooms/availability?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "객실 조회 실패");
        return json.availability as RoomAvailability;
      })
      .then((next) => setAvailability(next))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAvailabilityError(err instanceof Error ? err.message : "객실 조회 실패");
        setAvailability(ALL_AVAILABLE);
      })
      .finally(() => {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      });
    return () => controller.abort();
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (roomStatusForType(roomType, guestsCount, availability).kind === "available") return;
    const next = ROOM_TYPES.find(
      (t) => roomStatusForType(t, guestsCount, availability).kind === "available",
    );
    if (next) setRoomType(next);
  }, [guestsCount, availability, roomType]);

  // 인원 수가 줄어들면 guests 배열 끝에서 잘라내고, 대표자 유지
  useEffect(() => {
    setGuests((prev) => {
      if (prev.length <= guestsCount) return prev;
      const trimmed = prev.slice(0, guestsCount);
      if (!trimmed.some((g) => g.isRepresentative) && trimmed.length > 0) {
        trimmed[0] = { ...trimmed[0], isRepresentative: true };
      }
      return trimmed;
    });
  }, [guestsCount]);

  // 인원 수가 줄어들면 초과된 패키지 수량도 축소
  useEffect(() => {
    setSelections((prev) => {
      const sum = Object.values(prev).reduce((s, n) => s + (n ?? 0), 0);
      if (sum <= guestsCount) return prev;
      const next: PackageSelections = { ...prev };
      let overflow = sum - guestsCount;
      for (const key of [...CONFIG_KEYS].reverse()) {
        if (overflow <= 0) break;
        const cur = next[key] ?? 0;
        if (cur <= 0) continue;
        const take = Math.min(cur, overflow);
        next[key] = cur - take;
        overflow -= take;
      }
      return next;
    });
  }, [guestsCount]);

  // 대표자 전화번호가 바뀌면 확인 체크를 초기화 (재확인 강제)
  useEffect(() => {
    setPhoneConfirmed(false);
  }, [representativePhone]);

  // 입금자명 : 사용자가 직접 편집하기 전까지 대표자 이름 자동 채움
  useEffect(() => {
    if (!depositorEdited) setDepositorName(representativeName);
  }, [representativeName, depositorEdited]);

  const canAddGuest = guests.length < guestsCount;

  function updateGuest(idx: number, patch: Partial<Guest>) {
    setGuests((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }
  function setRepresentative(idx: number) {
    setGuests((prev) => prev.map((g, i) => ({ ...g, isRepresentative: i === idx })));
  }
  function addGuest() {
    if (!canAddGuest) return;
    setGuests((prev) => [...prev, { name: "", phone: "", isRepresentative: false }]);
  }
  function removeGuest(idx: number) {
    setGuests((prev) => {
      if (prev.length <= 1) return prev;
      const removingRep = prev[idx].isRepresentative;
      const next = prev.filter((_, i) => i !== idx);
      if (removingRep && next.length > 0) next[0].isRepresentative = true;
      return next;
    });
  }
  function adjustGuestsCount(n: number) {
    setGuestsCount(Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, n)));
  }

  function changeQuantity(key: ConfigKey, delta: number) {
    setSelections((prev) => {
      const cur = prev[key] ?? 0;
      const otherSum =
        Object.entries(prev).reduce(
          (s, [k, v]) => (k === key ? s : s + (v ?? 0)),
          0,
        );
      const maxForThis = Math.max(0, guestsCount - otherSum);
      const next = Math.min(maxForThis, Math.max(0, cur + delta));
      if (next === cur) return prev;
      const merged = { ...prev, [key]: next };
      if (next === 0) delete merged[key];
      return merged;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (selectedStatus.kind !== "available") {
      setSubmitError("선택한 객실이 예약 조건에 맞지 않습니다.");
      return;
    }
    if (totalQuantity !== guestsCount) {
      setSubmitError(`패키지 수량 합계(${totalQuantity}명)가 인원(${guestsCount}명)과 일치해야 합니다.`);
      return;
    }
    if (!phoneConfirmed) {
      setSubmitError("대표자 전화번호 확인에 체크해주세요.");
      return;
    }
    if (depositorName.trim().length === 0) {
      setSubmitError("입금자명을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          packageSelections: selections,
          roomType,
          guestsCount,
          checkIn,
          checkOut,
          guests,
          memo: memo.trim() || undefined,
          depositorName: depositorName.trim() || undefined,
          paymentConfirmed,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "예약 처리 실패");
        return;
      }
      setDone({
        totalPrice: json.totalPrice,
        checkIn,
        checkOut,
        nights,
        roomType,
        guestsCount,
        lines: selectionResult?.lines ?? [],
        season,
      });
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section className="max-w-3xl mx-auto px-5 md:px-8 py-16">
        <div
          className="p-6 md:p-10 bg-white"
          style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "3px" }}
        >
          <p className="text-black/50 tracking-[0.15em] uppercase" style={{ fontSize: "10px", fontWeight: 700 }}>
            RESERVATION RECEIVED
          </p>
          <h1 className="text-black mt-2" style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.02em" }}>
            예약이 접수되었습니다
          </h1>
          <p className="text-black/70 mt-3" style={{ fontSize: "14px", lineHeight: 1.7 }}>
            현재 <strong className="text-black">확정 대기</strong> 상태입니다. 관리자가 입금 확인 후 대표자 연락처로 안내드릴 예정이니 잠시만 기다려주세요.
          </p>

          <div
            className="mt-5 p-4 md:p-5"
            style={{
              backgroundColor: "#f7f7f7",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "3px",
            }}
          >
            <p
              className="text-black/50 tracking-[0.15em] uppercase mb-3"
              style={{ fontSize: "10px", fontWeight: 700 }}
            >
              예약 내역
            </p>
            <dl className="space-y-2" style={{ fontSize: "13px" }}>
              <Row k="일정" v={`${formatDateKo(done.checkIn)} → ${formatDateKo(done.checkOut)} · ${done.nights}박`} />
              <Row k="객실" v={ROOM_TYPE_META[done.roomType].title} />
              <Row k="인원" v={`${done.guestsCount}명`} />
              <Row
                k="계절"
                v={
                  done.season === "peak"
                    ? "성수기"
                    : done.season === "off"
                      ? "비수기"
                      : done.season === "mixed"
                        ? "성수기·비수기 혼합"
                        : "-"
                }
              />
            </dl>
            {done.lines.length > 0 && (
              <ul
                className="mt-3 pt-3 space-y-1"
                style={{ borderTop: "1px solid rgba(0,0,0,0.08)", fontSize: "13px" }}
              >
                {done.lines.map((line) => (
                  <li key={line.configKey} className="flex justify-between gap-3">
                    <span className="text-black/70">
                      {line.label} <span className="text-black/45">× {line.quantity}명</span>
                    </span>
                    <span className="text-black" style={{ fontWeight: 700 }}>
                      {won(line.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div
              className="mt-3 pt-3 flex items-baseline justify-between"
              style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
            >
              <span className="text-black" style={{ fontSize: "13px", fontWeight: 700 }}>
                총 금액
              </span>
              <span className="text-black" style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.02em" }}>
                {won(done.totalPrice)}
              </span>
            </div>
          </div>

          <div
            className="mt-4 p-4"
            style={{
              backgroundColor: "rgba(0,194,209,0.08)",
              border: "1px solid rgba(0,194,209,0.35)",
              borderRadius: "2px",
              fontSize: "13px",
              lineHeight: 1.7,
            }}
          >
            <span className="text-black" style={{ fontWeight: 700 }}>문의</span>
            <span className="text-black/75"> · </span>
            <a href="tel:0503-7152-2755" className="text-black" style={{ fontWeight: 700 }}>
              0503-7152-2755
            </a>
          </div>
          <Link
            href={`/${locale}`}
            className="mt-6 inline-flex items-center px-5 py-2.5 text-black"
            style={{
              border: "1px solid rgba(0,0,0,0.2)",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "2px",
            }}
          >
            ← 홈으로
          </Link>
        </div>
      </section>
    );
  }

  const seasonLabel =
    season === "peak"
      ? "성수기"
      : season === "off"
        ? "비수기"
        : season === "mixed"
          ? "성수기·비수기 혼합"
          : "-";

  const quantityMatch = totalQuantity === guestsCount;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-16">
      <div className="mb-6">
        <p className="text-black/50 tracking-[0.15em] uppercase" style={{ fontSize: "10px", fontWeight: 700 }}>
          RESERVATION
        </p>
        <h1 className="text-black mt-2" style={{ fontSize: "clamp(24px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em" }}>
          숙박 패키지 예약
        </h1>
        <div className="mt-3 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
      </div>

      <div
        className="p-4 mb-8"
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "3px",
          fontSize: "13px",
          lineHeight: 1.7,
        }}
      >
        <ul className="text-black/75 space-y-1">
          <li>• <strong className="text-black">4인 이상 숙박 패키지</strong>만 온라인 예약이 가능합니다.</li>
          <li>• 인원별로 각자 다른 패키지를 선택할 수 있습니다.</li>
          <li>• 숙박 없이 액티비티만 이용하실 예정이라면 별도 예약 없이 방문해주세요.</li>
        </ul>
      </div>

      <Section title="1. 일정">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="체크인">
            <input
              type="date"
              value={checkIn}
              min={todayISO()}
              onChange={(e) => {
                const v = e.target.value;
                setCheckIn(v);
                if (checkOut <= v) {
                  const d = new Date(v);
                  d.setDate(d.getDate() + 1);
                  setCheckOut(
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
                  );
                }
              }}
              className="w-full px-3 py-2.5 bg-white"
              style={inputStyle}
              required
            />
          </Field>
          <Field label="체크아웃">
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-3 py-2.5 bg-white"
              style={inputStyle}
              required
            />
          </Field>
        </div>
        <p className="text-black/55 mt-2" style={{ fontSize: "12px" }}>
          {nights > 0 ? `총 ${nights}박 · ${seasonLabel}` : "체크아웃은 체크인 다음날 이후여야 합니다."}
        </p>
        {holidayNotes.length > 0 && (
          <div
            className="mt-2 p-2.5"
            style={{
              backgroundColor: "rgba(225,29,72,0.06)",
              border: "1px solid rgba(225,29,72,0.35)",
              borderRadius: "2px",
              fontSize: "12px",
              lineHeight: 1.6,
            }}
          >
            <p style={{ color: "#c1123d", fontWeight: 800, letterSpacing: "-0.01em" }}>
              공휴일 포함 · 휴일 요금 적용
            </p>
            <ul className="mt-1 space-y-0.5" style={{ color: "rgba(0,0,0,0.75)" }}>
              {holidayNotes.map((h) => (
                <li key={h.date}>· {formatDateKo(h.date)} — {h.name} (토요일 요금)</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="2. 인원">
        <div className="inline-flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => adjustGuestsCount(guestsCount - 1)}
            disabled={guestsCount <= MIN_GUESTS}
            style={{ ...stepBtnStyle, opacity: guestsCount <= MIN_GUESTS ? 0.4 : 1 }}
          >
            −
          </button>
          <span style={{ minWidth: "48px", textAlign: "center", fontWeight: 800, fontSize: "18px" }}>
            {guestsCount}
          </span>
          <button
            type="button"
            onClick={() => adjustGuestsCount(guestsCount + 1)}
            disabled={guestsCount >= MAX_GUESTS}
            style={{ ...stepBtnStyle, opacity: guestsCount >= MAX_GUESTS ? 0.4 : 1 }}
          >
            +
          </button>
          <span className="text-black/55 ml-2" style={{ fontSize: "12px" }}>
            최소 {MIN_GUESTS}명 · 최대 {MAX_GUESTS}명
          </span>
        </div>
      </Section>

      <Section title="3. 객실">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <p className="text-black/60" style={{ fontSize: "12px" }}>
            인원 수와 일정에 맞는 객실만 선택할 수 있습니다.
          </p>
          {availabilityLoading && (
            <span className="text-black/50" style={{ fontSize: "11px", fontWeight: 600 }}>
              확인 중...
            </span>
          )}
        </div>
        {availabilityError && (
          <p className="mb-2" style={{ color: "#e11d48", fontSize: "12px", fontWeight: 600 }}>
            {availabilityError}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ROOM_TYPES.map((type) => {
            const meta = ROOM_TYPE_META[type];
            const active = roomType === type;
            const status = roomStatusForType(type, guestsCount, availability);
            const enabled = status.kind === "available";
            const summary = typeSummary[type];
            return (
              <button
                type="button"
                key={type}
                onClick={() => enabled && setRoomType(type)}
                disabled={!enabled}
                className="text-left px-4 py-3 transition-colors"
                style={{
                  backgroundColor: !enabled
                    ? "rgba(0,0,0,0.03)"
                    : active
                      ? "#00C2D1"
                      : "#fff",
                  color: !enabled ? "rgba(0,0,0,0.35)" : active ? "#001518" : "#111",
                  border: active
                    ? "1px solid #00C2D1"
                    : enabled
                      ? "1px solid rgba(0,0,0,0.12)"
                      : "1px dashed rgba(0,0,0,0.15)",
                  borderRadius: "2px",
                  cursor: enabled ? "pointer" : "not-allowed",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontSize: "14px", fontWeight: 800 }}>{meta.title}</span>
                  <RoomBadge status={status} active={active} />
                </div>
                <div
                  className="mt-1"
                  style={{
                    fontSize: "12px",
                    color: !enabled
                      ? "rgba(0,0,0,0.35)"
                      : active
                        ? "rgba(0,21,24,0.75)"
                        : "rgba(0,0,0,0.6)",
                  }}
                >
                  {meta.minGuests === meta.maxGuests
                    ? `${meta.minGuests}인 전용`
                    : `${meta.minGuests}~${meta.maxGuests}인`}
                  {" · "}
                  {meta.hasLoft ? "다락방 포함" : "다락방 없음"}
                  {meta.physicals.length > 1 && (
                    <span style={{ marginLeft: "6px", fontWeight: 700 }}>
                      · 잔여 {summary.available}/{summary.total}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="4. 패키지 (인원별 선택)">
        <div
          className="mb-3 flex items-center justify-between p-3"
          style={{
            backgroundColor: quantityMatch ? "rgba(0,194,209,0.08)" : "rgba(255,193,7,0.08)",
            border: `1px solid ${quantityMatch ? "rgba(0,194,209,0.3)" : "rgba(255,193,7,0.4)"}`,
            borderRadius: "2px",
            fontSize: "13px",
          }}
        >
          <span className="text-black" style={{ fontWeight: 700 }}>
            선택 인원 {totalQuantity} / {guestsCount}명
          </span>
          {!quantityMatch && (
            <span style={{ color: "#a06500", fontSize: "12px", fontWeight: 600 }}>
              {remainingQuantity > 0 ? `${remainingQuantity}명 더 선택` : `${-remainingQuantity}명 초과`}
            </span>
          )}
        </div>

        <ul className="space-y-2">
          {CONFIG_KEYS.map((key) => {
            const quantity = selections[key] ?? 0;
            const perPerson = perPersonByConfig[key];
            const range = priceRanges[key];
            const disabled = remainingQuantity === 0 && quantity === 0;
            const active = quantity > 0;
            return (
              <li
                key={key}
                className="p-3 md:p-4 flex items-center justify-between gap-3"
                style={{
                  backgroundColor: active ? "rgba(0,194,209,0.06)" : "#fff",
                  border: active ? "1px solid #00C2D1" : "1px solid rgba(0,0,0,0.1)",
                  borderRadius: "2px",
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-black" style={{ fontSize: "13px", fontWeight: 700 }}>
                    {CONFIG_LABELS[key]}
                  </div>
                  <div
                    className="mt-0.5 text-black/60"
                    style={{ fontSize: "12px", lineHeight: 1.5 }}
                  >
                    {perPerson != null ? (
                      <>
                        1인 총 <strong className="text-black">{won(perPerson)}</strong>
                        <span className="text-black/45"> ({nights}박)</span>
                      </>
                    ) : range ? (
                      <>
                        1인 1박{" "}
                        <strong className="text-black">
                          {range.min === range.max
                            ? won(range.min)
                            : `${won(range.min)} ~ ${won(range.max)}`}
                        </strong>
                      </>
                    ) : (
                      <span>-</span>
                    )}
                    {quantity > 0 && perPerson != null && (
                      <span className="ml-2 text-black" style={{ fontWeight: 700 }}>
                        · 소계 {won(perPerson * quantity)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => changeQuantity(key, -1)}
                    disabled={quantity === 0}
                    style={{ ...smallStepBtn, opacity: quantity === 0 ? 0.35 : 1 }}
                    aria-label="수량 감소"
                  >
                    −
                  </button>
                  <span
                    style={{
                      minWidth: "28px",
                      textAlign: "center",
                      fontWeight: 800,
                      fontSize: "15px",
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(key, +1)}
                    disabled={disabled || perPerson == null}
                    style={{
                      ...smallStepBtn,
                      opacity: disabled || perPerson == null ? 0.35 : 1,
                    }}
                    aria-label="수량 증가"
                  >
                    +
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="5. 예약자">
        <p className="text-black/60 mb-3" style={{ fontSize: "12px" }}>
          대표 예약자만 필수입니다. 동행자 정보는 선택이며 필요할 때만 추가하세요.
        </p>
        <ul className="space-y-3">
          {guests.map((g, i) => (
            <li
              key={i}
              className="p-3 md:p-4 bg-white"
              style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "2px" }}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                {guests.length === 1 ? (
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#009aa8" }}>
                    대표자
                  </span>
                ) : (
                  <label className="inline-flex items-center gap-2" style={{ fontSize: "12px", fontWeight: 700 }}>
                    <input
                      type="radio"
                      name="representative"
                      checked={g.isRepresentative}
                      onChange={() => setRepresentative(i)}
                    />
                    대표자
                  </label>
                )}
                {guests.length > 1 && !g.isRepresentative && (
                  <button
                    type="button"
                    onClick={() => removeGuest(i)}
                    className="text-black/55 hover:text-black"
                    style={{ fontSize: "12px", cursor: "pointer" }}
                  >
                    삭제
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="이름">
                  <input
                    type="text"
                    value={g.name}
                    onChange={(e) => updateGuest(i, { name: e.target.value })}
                    maxLength={40}
                    className="w-full px-3 py-2.5"
                    style={inputStyle}
                    required
                  />
                </Field>
                <Field label={`전화번호${g.isRepresentative ? " (필수)" : " (선택)"}`}>
                  <input
                    type="tel"
                    value={g.phone}
                    onChange={(e) => updateGuest(i, { phone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2.5"
                    style={inputStyle}
                    required={g.isRepresentative}
                  />
                </Field>
              </div>
            </li>
          ))}
        </ul>
        {canAddGuest ? (
          <button
            type="button"
            onClick={addGuest}
            className="mt-3 px-3 py-2 text-black/70 hover:text-black"
            style={{
              border: "1px dashed rgba(0,0,0,0.2)",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            + 동행자 추가 ({guests.length} / {guestsCount})
          </button>
        ) : (
          <p className="mt-3 text-black/50" style={{ fontSize: "11px" }}>
            인원 수({guestsCount}명)만큼 모두 등록되었습니다.
          </p>
        )}
      </Section>

      <Section title="6. 요청사항 (선택)">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="특별한 요청이 있으시면 남겨주세요."
          className="w-full px-3 py-2.5"
          style={inputStyle}
        />
      </Section>

      <div
        className="mt-8 p-5 md:p-6"
        style={{ backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "3px" }}
      >
        <p className="text-black/50 tracking-[0.15em] uppercase mb-3" style={{ fontSize: "10px", fontWeight: 700 }}>
          예약 요약
        </p>
        <dl className="space-y-2" style={{ fontSize: "13px" }}>
          <Row k="일정" v={`${formatDateKo(checkIn)} → ${formatDateKo(checkOut)} · ${nights}박`} />
          <Row k="인원" v={`${guestsCount}명`} />
          <Row k="객실" v={selectedRoomMeta.title} />
          <Row k="계절" v={seasonLabel} />
        </dl>

        {selectionResult && selectionResult.lines.length > 0 ? (
          <ul
            className="mt-4 pt-4 space-y-1"
            style={{ borderTop: "1px solid rgba(0,0,0,0.08)", fontSize: "13px" }}
          >
            {selectionResult.lines.map((line) => (
              <li key={line.configKey} className="flex justify-between gap-3">
                <span className="text-black/70">
                  {line.label} <span className="text-black/45">× {line.quantity}명</span>
                </span>
                <span className="text-black" style={{ fontWeight: 700 }}>
                  {won(line.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 pt-4 text-black/50" style={{ borderTop: "1px solid rgba(0,0,0,0.08)", fontSize: "12px" }}>
            패키지를 선택해주세요.
          </p>
        )}

        <div
          className="mt-4 pt-4 flex items-baseline justify-between"
          style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
        >
          <span className="text-black" style={{ fontSize: "14px", fontWeight: 700 }}>
            총 금액
          </span>
          <span className="text-black" style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.02em" }}>
            {selectionResult && selectionResult.lines.length > 0 ? won(grandTotal) : "-"}
          </span>
        </div>
      </div>

      <div
        className="mt-6 p-5 md:p-6"
        style={{
          backgroundColor: "rgba(0,194,209,0.06)",
          border: "1px solid rgba(0,194,209,0.3)",
          borderRadius: "3px",
        }}
      >
        <p className="text-black" style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "-0.01em" }}>
          입금 안내
        </p>
        <div className="mt-2">
          <CopyableAccount
            bankLabel="카카오뱅크"
            account="3333-02-0271394"
            holderPrefix="예금주"
            holder="장우진"
          />
        </div>
        <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={phoneConfirmed}
            onChange={(e) => setPhoneConfirmed(e.target.checked)}
            disabled={!representativePhone}
            className="mt-0.5"
            required
          />
          <span className="text-black" style={{ fontSize: "13px", lineHeight: 1.6, fontWeight: 600 }}>
            대표자 전화번호{" "}
            <strong className="text-black" style={{ letterSpacing: "-0.01em" }}>
              {representativePhone || "(먼저 입력해주세요)"}
            </strong>
            {representativePhone && " 가(이) 정확하며, 이 번호로 예약 확정 안내를 받겠습니다."}
          </span>
        </label>

        <label className="mt-3 flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={paymentConfirmed}
            onChange={(e) => setPaymentConfirmed(e.target.checked)}
            className="mt-0.5"
            required
          />
          <span className="text-black" style={{ fontSize: "13px", lineHeight: 1.6, fontWeight: 600 }}>
            총 금액을 입금하였으며, 관리자 확인 후 예약이 확정됨을 이해합니다.
          </span>
        </label>

        <div className="mt-4">
          <label className="block text-black/70 mb-1.5" style={{ fontSize: "12px", fontWeight: 600 }}>
            입금자명
          </label>
          <input
            type="text"
            value={depositorName}
            onChange={(e) => {
              setDepositorName(e.target.value);
              setDepositorEdited(true);
            }}
            placeholder="대표자 이름 자동 입력 · 다르면 직접 수정하세요"
            maxLength={40}
            className="w-full px-3 py-2.5 bg-white"
            style={inputStyle}
          />
        </div>
      </div>

      {submitError && (
        <p className="mt-4" style={{ color: "#e11d48", fontSize: "13px", fontWeight: 600 }}>
          {submitError}
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center justify-center px-5 py-3 text-black"
          style={{
            border: "1px solid rgba(0,0,0,0.2)",
            fontSize: "14px",
            fontWeight: 600,
            borderRadius: "2px",
          }}
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={
            submitting ||
            !phoneConfirmed ||
            !paymentConfirmed ||
            !quantityMatch ||
            grandTotal <= 0 ||
            selectedStatus.kind !== "available"
          }
          className="flex-1 inline-flex items-center justify-center px-6 py-3 font-bold transition-opacity"
          style={{
            backgroundColor: "#00C2D1",
            color: "#001518",
            fontSize: "15px",
            borderRadius: "2px",
            opacity:
              submitting ||
              !phoneConfirmed ||
              !paymentConfirmed ||
              !quantityMatch ||
              grandTotal <= 0 ||
              selectedStatus.kind !== "available"
                ? 0.5
                : 1,
            cursor:
              submitting ||
              !phoneConfirmed ||
              !paymentConfirmed ||
              !quantityMatch ||
              grandTotal <= 0 ||
              selectedStatus.kind !== "available"
                ? "not-allowed"
                : "pointer",
          }}
        >
          {submitting
            ? "처리 중..."
            : selectedStatus.kind === "booked"
              ? "선택한 객실 예약 마감"
              : selectedStatus.kind === "mismatch"
                ? "인원 수와 맞는 객실 선택 필요"
                : !quantityMatch
                  ? `패키지 ${remainingQuantity > 0 ? `${remainingQuantity}명 더 선택` : `${-remainingQuantity}명 초과`}`
                  : !phoneConfirmed
                    ? "전화번호 확인 체크 필요"
                    : !paymentConfirmed
                      ? "입금 확인 체크 필요"
                      : "예약 신청"}
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: "2px",
  fontSize: "14px",
  outline: "none",
};

const stepBtnStyle: React.CSSProperties = {
  width: "34px",
  height: "34px",
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: "2px",
  backgroundColor: "#fff",
  fontSize: "16px",
  fontWeight: 700,
  cursor: "pointer",
};

const smallStepBtn: React.CSSProperties = {
  width: "30px",
  height: "30px",
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: "2px",
  backgroundColor: "#fff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-black mb-3" style={{ fontSize: "17px", fontWeight: 800, letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-black/70 mb-1.5" style={{ fontSize: "12px", fontWeight: 600 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-black/60">{k}</dt>
      <dd className="text-black" style={{ fontWeight: 600, textAlign: "right" }}>
        {v}
      </dd>
    </div>
  );
}

function RoomBadge({ status, active }: { status: RoomStatus; active: boolean }) {
  const badge = (() => {
    if (status.kind === "available") {
      return {
        text: "예약 가능",
        bg: active ? "rgba(0,21,24,0.15)" : "rgba(0,194,209,0.15)",
        fg: active ? "#001518" : "#009aa8",
      };
    }
    if (status.kind === "booked") {
      return { text: "예약 마감", bg: "rgba(225,29,72,0.12)", fg: "#e11d48" };
    }
    return { text: status.reason, bg: "rgba(0,0,0,0.06)", fg: "rgba(0,0,0,0.5)" };
  })();
  return (
    <span
      style={{
        padding: "2px 6px",
        backgroundColor: badge.bg,
        color: badge.fg,
        fontSize: "10px",
        fontWeight: 700,
        borderRadius: "2px",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {badge.text}
    </span>
  );
}
