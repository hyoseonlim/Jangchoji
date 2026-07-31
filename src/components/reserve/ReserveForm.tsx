"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/i18n";
import {
  CONFIG_LABELS,
  DAY_USE_CONFIG_KEYS,
  DAY_USE_PRICES,
  STAY_CONFIG_KEYS,
  type GroupSize,
  type ConfigKey,
  type PackageLine,
  type PackagePriceRow,
  type PackageSelections,
  computeDayUseLines,
  computeSelectionLines,
  holidaysInRange,
  hasSaturdayNight,
  perPersonStayTotalByConfig,
  priceRangeByConfig,
  summarizeSeasonFromRange,
  PET_FEE_PER_DOG,
} from "@/lib/pricing";
import { CopyableAccount } from "../CopyableAccount";

const MIN_GUESTS = 2;
const MIN_DAY_USE_GUESTS = 1;
const DEFAULT_GUESTS = 4;
const MIN_SATURDAY_GUESTS = 4;
const MIN_INBOAT_GUESTS = 4;
const MAX_GUESTS = 10;
const MAX_DAY_USE_BBQ_GUESTS = 20;
const STAY_REFUND_POLICY_ITEMS = [
  "패키지 예약금 환불은 일체 불가하며, 예약일 변경은 이용일 7일 전까지 가능합니다.",
  "예약 신청 내용 및 예약일 변경 시 위약금 20%가 추가되며, 패키지와 객실은 별도로 적용됩니다.",
  "우천으로 인한 패키지 취소는 불가능합니다.",
  "개인 사정으로 객실 예약일 변경을 원하실 경우 객실 취소 수수료 규정이 적용됩니다.",
];
const STAY_ROOM_CANCEL_FEES = [
  ["객실 기본", "30% 취소 수수료 부과"],
  ["객실 이용일 D-14", "40% 취소 수수료 부과"],
  ["객실 이용일 D-10", "50% 취소 수수료 부과"],
  ["객실 이용일 D-9", "60% 취소 수수료 부과"],
  ["객실 이용일 D-8", "70% 취소 수수료 부과"],
  ["객실 이용일 D-7", "환불 불가"],
] as const;
const DAY_USE_REFUND_POLICY_ITEMS = [
  "예약과 동시에 이용 인원이 확정되어 다른 고객의 예약이 제한됩니다. 신중한 예약을 부탁드립니다.",
  "반복적인 예약 취소가 빈번하여 취소하실 경우 기본 취소 수수료 10%가 추가로 부과됩니다.",
  "태풍, 강풍, 낙뢰, 댐 방류 등으로 수상레저 운영이 불가능한 경우 관련 규정에 따라 환불 또는 예약 변경을 도와드립니다.",
  "비가 내리거나 흐린 날씨 등 단순 기상 변화만으로는 정상 운영이 가능한 경우가 많아 100% 환불은 어렵습니다.",
  "모든 고객에게 공정한 예약 서비스를 제공하기 위해 환불 규정을 동일하게 적용합니다.",
];
const DAY_USE_CANCEL_FEES = [
  ["이용 10일 전", "90% 환불"],
  ["이용 9일 전", "80% 환불"],
  ["이용 8일 전", "70% 환불"],
  ["이용 7일 전", "60% 환불"],
  ["이용 6일 전", "50% 환불"],
  ["이용 5일 전", "40% 환불"],
  ["이용 4일 전", "30% 환불"],
  ["이용 3일 전", "20% 환불"],
  ["이용 2일 전", "10% 환불"],
  ["이용 1일 전", "환불 불가"],
  ["이용 당일", "환불 불가"],
] as const;

type Guest = { name: string; phone: string; isRepresentative: boolean };
type ReservationMode = "stay" | "day_use";

type DoneSnapshot = {
  totalPrice: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
  petCount: number;
  petFee: number;
  lines: PackageLine[];
  season: "peak" | "off" | "mixed" | null;
};

type Availability =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok" }
  | { state: "unavailable"; reason: string }
  | { state: "error"; message: string };

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

const EMPTY_SELECTIONS: PackageSelections = {};

function groupSizeForGuests(guestsCount: number): GroupSize {
  if (guestsCount <= 2) return "2";
  if (guestsCount === 3) return "3";
  return "4";
}

export function ReserveForm({
  dict,
  locale,
  packagePrices,
  initialMode = "stay",
}: {
  dict: Dictionary;
  locale: Locale;
  packagePrices: PackagePriceRow[];
  initialMode?: ReservationMode;
}) {
  void dict;

  const dayUseInitial = initialMode === "day_use";
  const [checkIn, setCheckIn] = useState(() => todayISO(dayUseInitial ? 0 : 7));
  const [checkOut, setCheckOut] = useState(() => todayISO(dayUseInitial ? 0 : 8));
  const [reservationMode, setReservationMode] = useState<ReservationMode>(initialMode);
  const [guestsCount, setGuestsCount] = useState(DEFAULT_GUESTS);
  const [petCount, setPetCount] = useState(0);
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const [selections, setSelections] = useState<PackageSelections>(EMPTY_SELECTIONS);
  const [guests, setGuests] = useState<Guest[]>([
    { name: "", phone: "", isRepresentative: true },
  ]);
  const [memo, setMemo] = useState("");
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [refundPolicyAgreed, setRefundPolicyAgreed] = useState(false);
  const [dayUsePolicyAgreed, setDayUsePolicyAgreed] = useState(false);
  const [depositorName, setDepositorName] = useState("");
  const [depositorEdited, setDepositorEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<DoneSnapshot | null>(null);

  const representative = guests.find((g) => g.isRepresentative);
  const representativeName = representative?.name.trim() ?? "";
  const representativePhone = representative?.phone.trim() ?? "";

  const groupSize = groupSizeForGuests(guestsCount);
  const currentPackagePrices = useMemo(
    () => packagePrices.filter((row) => row.group_size === groupSize),
    [packagePrices, groupSize],
  );
  const priceRanges = useMemo(
    () => priceRangeByConfig(currentPackagePrices),
    [currentPackagePrices],
  );
  const perPersonByConfig = useMemo(
    () => perPersonStayTotalByConfig(currentPackagePrices, checkIn, checkOut),
    [currentPackagePrices, checkIn, checkOut],
  );
  const selectionResult = useMemo(
    () =>
      reservationMode === "stay"
        ? computeSelectionLines(perPersonByConfig, selections)
        : computeDayUseLines(selections),
    [perPersonByConfig, selections, reservationMode],
  );
  const totalQuantity = selectionResult?.totalQuantity ?? 0;
  const remainingQuantity = Math.max(0, guestsCount - totalQuantity);
  const petFee = reservationMode === "stay" ? petCount * PET_FEE_PER_DOG : 0;
  const grandTotal = (selectionResult?.total ?? 0) + petFee;
  const season = useMemo(() => summarizeSeasonFromRange(checkIn, checkOut), [checkIn, checkOut]);
  const holidayNotes = useMemo(() => holidaysInRange(checkIn, checkOut), [checkIn, checkOut]);
  const saturdaySmallGroup =
    reservationMode === "stay" &&
    guestsCount < MIN_SATURDAY_GUESTS &&
    hasSaturdayNight(checkIn, checkOut);
  const dayUseBbqSelected = reservationMode === "day_use" && (selections.day_bbq ?? 0) > 0;
  const dayUseBbqBlocked = dayUseBbqSelected && checkIn <= todayISO();
  const inboatQuantity = reservationMode === "day_use" ? selections.day_inboat ?? 0 : 0;
  const inboatMinBlocked = inboatQuantity > 0 && inboatQuantity < MIN_INBOAT_GUESTS;
  const minGuestsForMode = reservationMode === "day_use" ? MIN_DAY_USE_GUESTS : MIN_GUESTS;

  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
    return Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
    );
  }, [checkIn, checkOut]);

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (reservationMode === "day_use") {
      setAvailability({ state: "ok" });
      return;
    }
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setAvailability({ state: "idle" });
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAvailability({ state: "loading" });
    fetch(
      `/api/rooms/availability?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guestsCount=${guestsCount}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "일정 조회 실패");
        return json as { available: boolean; reason?: string };
      })
      .then((next) => {
        setAvailability(
          next.available
            ? { state: "ok" }
            : { state: "unavailable", reason: next.reason ?? "선택하신 일정은 예약이 마감되었습니다." },
        );
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAvailability({
          state: "error",
          message: err instanceof Error ? err.message : "일정 조회 실패",
        });
      });
    return () => controller.abort();
  }, [checkIn, checkOut, guestsCount, reservationMode]);

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
      const sum = Object.entries(prev).reduce(
        (s, [key, n]) => (key === "day_bbq" ? s : s + (n ?? 0)),
        0,
      );
      if (sum <= guestsCount) return prev;
      const next: PackageSelections = { ...prev };
      let overflow = sum - guestsCount;
      const keys = reservationMode === "stay" ? STAY_CONFIG_KEYS : DAY_USE_CONFIG_KEYS.filter((key) => key !== "day_bbq");
      for (const key of [...keys].reverse()) {
        if (overflow <= 0) break;
        const cur = next[key] ?? 0;
        if (cur <= 0) continue;
        const take = Math.min(cur, overflow);
        next[key] = cur - take;
        overflow -= take;
      }
      if (reservationMode === "day_use" && (next.day_inboat ?? 0) > 0 && (next.day_inboat ?? 0) < MIN_INBOAT_GUESTS) {
        delete next.day_inboat;
      }
      return next;
    });
  }, [guestsCount, reservationMode]);

  // 대표자 전화번호가 바뀌면 확인 체크를 초기화 (재확인 강제)
  useEffect(() => {
    setPhoneConfirmed(false);
  }, [representativePhone]);

  // 입금자명 : 사용자가 직접 편집하기 전까지 대표자 이름 자동 채움
  useEffect(() => {
    if (!depositorEdited) setDepositorName(representativeName);
  }, [representativeName, depositorEdited]);

  const canAddGuest = guests.length < guestsCount;

  function switchMode(mode: ReservationMode) {
    setReservationMode(mode);
    setSelections(EMPTY_SELECTIONS);
    setPetCount(0);
    setGuestsCount((prev) => Math.max(mode === "day_use" ? MIN_DAY_USE_GUESTS : MIN_GUESTS, prev));
    if (mode !== "stay") setRefundPolicyAgreed(false);
    if (mode !== "day_use") setDayUsePolicyAgreed(false);
    setSubmitError(null);
  }

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
    const min = reservationMode === "day_use" ? MIN_DAY_USE_GUESTS : MIN_GUESTS;
    setGuestsCount(Math.min(MAX_GUESTS, Math.max(min, n)));
  }

  function changeQuantity(key: ConfigKey, delta: number) {
    setSelections((prev) => {
      const cur = prev[key] ?? 0;
      if (reservationMode === "day_use" && key === "day_bbq") {
        const next = Math.min(MAX_DAY_USE_BBQ_GUESTS, Math.max(0, cur + delta));
        if (next === cur) return prev;
        const merged = { ...prev };
        if (next === 0) delete merged[key];
        else merged[key] = next;
        return merged;
      }
      const otherSum =
        Object.entries(prev).reduce(
          (s, [k, v]) => (k === key || k === "day_bbq" ? s : s + (v ?? 0)),
          0,
        );
      const maxForThis = Math.max(0, guestsCount - otherSum);
      let next = Math.min(maxForThis, Math.max(0, cur + delta));
      if (reservationMode === "day_use" && key === "day_inboat") {
        if (cur === 0 && delta > 0) {
          if (maxForThis < MIN_INBOAT_GUESTS) return prev;
          next = MIN_INBOAT_GUESTS;
        } else if (cur <= MIN_INBOAT_GUESTS && delta < 0) {
          next = 0;
        } else if (next > 0 && next < MIN_INBOAT_GUESTS) {
          next = MIN_INBOAT_GUESTS;
        }
      }
      if (next === cur) return prev;
      const merged = { ...prev, [key]: next };
      if (next === 0) delete merged[key];
      return merged;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (availability.state !== "ok") {
      setSubmitError(
        availability.state === "unavailable"
          ? availability.reason
          : "일정 확인이 필요합니다.",
      );
      return;
    }
    if (dayUseBbqBlocked) {
      setSubmitError("당일 BBQ는 이용일 하루 전까지 예약이 필요합니다.");
      return;
    }
    if (inboatMinBlocked) {
      setSubmitError("럭셔리 인보트 보팅은 4인 이상부터 선택 가능합니다.");
      return;
    }
    if (reservationMode === "stay" && !refundPolicyAgreed) {
      setSubmitError("숙박 패키지 취소·환불 규정을 확인 후 동의해주세요.");
      return;
    }
    if (reservationMode === "day_use" && !dayUsePolicyAgreed) {
      setSubmitError("당일 패키지 예약 및 환불 규정을 확인 후 동의해주세요.");
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
          reservationType: reservationMode,
          guestsCount,
          petCount: reservationMode === "stay" ? petCount : 0,
          checkIn,
          checkOut: reservationMode === "stay" ? checkOut : undefined,
          guests,
          memo: memo.trim() || undefined,
          depositorName: depositorName.trim() || undefined,
          paymentConfirmed,
          refundPolicyAgreed: reservationMode === "stay" ? refundPolicyAgreed : undefined,
          dayUsePolicyAgreed: reservationMode === "day_use" ? dayUsePolicyAgreed : undefined,
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
        checkOut: reservationMode === "stay" ? checkOut : checkIn,
        nights: reservationMode === "stay" ? nights : 0,
        guestsCount,
        petCount: reservationMode === "stay" ? petCount : 0,
        petFee: reservationMode === "stay" ? petFee : 0,
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
            현재 <strong className="text-black">확정 대기</strong> 상태입니다. 관리자가 입금 확인 후 <strong className="text-black">객실 배정</strong>과 함께 대표자 연락처로 안내드릴 예정이니 잠시만 기다려주세요.
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
              <Row
                k="일정"
                v={
                  done.nights > 0
                    ? `${formatDateKo(done.checkIn)} → ${formatDateKo(done.checkOut)} · ${done.nights}박`
                    : `${formatDateKo(done.checkIn)} 당일 이용`
                }
              />
              <Row k="인원" v={`${done.guestsCount}명`} />
              {done.petCount > 0 && (
                <Row k="반려견 동반" v={`${done.petCount}마리 (+${won(done.petFee)})`} />
              )}
              {done.nights > 0 && <Row k="객실" v={<span className="text-black/60">관리자 확인 후 배정</span>} />}
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
            <a href="tel:010-9159-6448" className="text-black" style={{ fontWeight: 700 }}>
              010-9159-6448
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
  const visiblePackageKeys =
    reservationMode === "stay"
      ? STAY_CONFIG_KEYS
      : DAY_USE_CONFIG_KEYS.filter((key) => key !== "day_bbq");
  const availabilityBlocked =
    availability.state === "unavailable" || availability.state === "error";

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-16">
      <div className="mb-6">
        <p className="text-black/50 tracking-[0.15em] uppercase" style={{ fontSize: "10px", fontWeight: 700 }}>
          RESERVATION
        </p>
        <h1 className="text-black mt-2" style={{ fontSize: "clamp(24px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em" }}>
          {reservationMode === "stay" ? "숙박 패키지 예약" : "당일 패키지 예약"}
        </h1>
        <div className="mt-3 w-12 h-0.5" style={{ backgroundColor: "#00C2D1" }} />
      </div>

      <div className="mb-6 inline-flex bg-white" style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "3px", padding: "3px" }}>
        {[
          ["stay", "숙박 패키지"],
          ["day_use", "당일 패키지"],
        ].map(([mode, label]) => {
          const active = reservationMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => switchMode(mode as ReservationMode)}
              className="px-4 py-2"
              style={{
                backgroundColor: active ? "#00C2D1" : "transparent",
                color: active ? "#001518" : "rgba(0,0,0,0.68)",
                borderRadius: "2px",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              {label}
            </button>
          );
        })}
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
          {reservationMode === "stay" ? (
            <>
              <li>• 토요일을 제외한 일정은 <strong className="text-black">2인부터 온라인 예약</strong>이 가능합니다.</li>
              <li>• <strong className="text-black">토요일 4인 미만 예약</strong>은 전화로 문의 부탁드립니다.</li>
              <li>• 인원별로 각자 다른 패키지를 선택할 수 있습니다.</li>
              <li>• 놀이기구 옵션, 수상스키·웨이크보드 등은 방문 후 현장에서 추가 이용 가능합니다.</li>
              <li>• <strong className="text-black">객실 배정은 관리자 확정 시</strong> 이루어지며, 대표자 연락처로 안내드립니다.</li>
            </>
          ) : (
            <>
              <li>• 숙박 없이 당일 이용만 하실 경우 <strong className="text-black">예약 없이 방문 가능</strong>합니다.</li>
              <li>• 당일 패키지를 예약해주시면 <strong className="text-black">뷰 좋은 테이블을 미리 배정</strong>해드릴 수 있습니다.</li>
              <li>• 놀이기구 옵션, 수상스키·웨이크보드 등은 방문 후 현장에서 추가 이용 가능합니다.</li>
              <li>• BBQ는 <strong className="text-black">1인 30,000원</strong>이며 <strong className="text-black">하루 전 예약 필수</strong>입니다.</li>
            </>
          )}
        </ul>
      </div>

      <Section title="1. 일정">
        <div className={`grid grid-cols-1 ${reservationMode === "stay" ? "sm:grid-cols-2" : ""} gap-4`}>
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
          {reservationMode === "stay" && (
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
          )}
        </div>
        <p className="text-black/55 mt-2" style={{ fontSize: "12px" }}>
          {reservationMode === "stay"
            ? nights > 0
              ? `총 ${nights}박 · ${seasonLabel}`
              : "체크아웃은 체크인 다음날 이후여야 합니다."
            : `${formatDateKo(checkIn)} 당일 이용`}
        </p>
        {reservationMode === "stay" && holidayNotes.length > 0 && (
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

      <Section title={reservationMode === "stay" ? "2. 인원 및 반려견 동반" : "2. 인원"}>
        <div className={`grid grid-cols-1 ${reservationMode === "stay" ? "sm:grid-cols-2" : ""} gap-4`}>
          <div className="p-3 bg-white" style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "2px" }}>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustGuestsCount(guestsCount - 1)}
                disabled={guestsCount <= minGuestsForMode}
                style={{ ...stepBtnStyle, opacity: guestsCount <= minGuestsForMode ? 0.4 : 1 }}
              >
                −
              </button>
              <span style={{ minWidth: "40px", textAlign: "center", fontWeight: 800, fontSize: "18px" }}>
                {guestsCount}명
              </span>
              <button
                type="button"
                onClick={() => adjustGuestsCount(guestsCount + 1)}
                disabled={guestsCount >= MAX_GUESTS}
                style={{ ...stepBtnStyle, opacity: guestsCount >= MAX_GUESTS ? 0.4 : 1 }}
              >
                +
              </button>
            </div>
            <p className="text-black/55 mt-1.5" style={{ fontSize: "11px" }}>
              최소 {minGuestsForMode}명 · 최대 {MAX_GUESTS}명
              {saturdaySmallGroup ? " · 토요일 4인 미만 전화 문의" : ""}
            </p>
          </div>

          {reservationMode === "stay" && (
            <div className="p-3 bg-white" style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "2px" }}>
              <span className="block text-black/70 mb-2" style={{ fontSize: "12px", fontWeight: 600 }}>
                반려견 동반 (마리당 +₩30,000)
              </span>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPetCount((prev) => Math.max(0, prev - 1))}
                  disabled={petCount <= 0}
                  style={{ ...stepBtnStyle, opacity: petCount <= 0 ? 0.4 : 1 }}
                >
                  −
                </button>
                <span style={{ minWidth: "40px", textAlign: "center", fontWeight: 800, fontSize: "18px" }}>
                  {petCount}마리
                </span>
                <button
                  type="button"
                  onClick={() => setPetCount((prev) => Math.min(10, prev + 1))}
                  disabled={petCount >= 10}
                  style={{ ...stepBtnStyle, opacity: petCount >= 10 ? 0.4 : 1 }}
                >
                  +
                </button>
              </div>
              <p className="text-black/55 mt-1.5" style={{ fontSize: "11px" }}>
                {petCount > 0 ? `반려견 추가 요금 +${won(petFee)}` : "반려견 미동반"}
              </p>
            </div>
          )}
        </div>
        {reservationMode === "stay" && <div className="mt-3">
          <AvailabilityBadge availability={availability} />
        </div>}
      </Section>

      <Section title={reservationMode === "stay" ? "3. 패키지 (인원별 선택)" : "3. 당일 패키지 (인원별 선택)"}>
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
          {visiblePackageKeys.map((key) => {
            const quantity = selections[key] ?? 0;
            const perPerson =
              reservationMode === "stay"
                ? perPersonByConfig[key]
                : DAY_USE_PRICES[key as keyof typeof DAY_USE_PRICES];
            const range = priceRanges[key];
            const isInboat = reservationMode === "day_use" && key === "day_inboat";
            const inboatStartDisabled = isInboat && quantity === 0 && remainingQuantity < MIN_INBOAT_GUESTS;
            const disabled = (remainingQuantity === 0 && quantity === 0) || inboatStartDisabled;
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
                        {reservationMode === "stay" && <span className="text-black/45"> ({nights}박)</span>}
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
                    {isInboat && (
                      <span className="block text-black/45 mt-0.5">
                        4인 이상부터 선택 가능
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
        {reservationMode === "day_use" && (
          <div className="mt-3 p-3 bg-white" style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "2px" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-black" style={{ fontSize: "13px", lineHeight: 1.6, fontWeight: 700 }}>
                  BBQ 추가
                </div>
                <div className="text-black/55" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  1인 {won(DAY_USE_PRICES.day_bbq)} · 당일 추가 불가 · 하루 전 예약 필수
                </div>
                {(selections.day_bbq ?? 0) > 0 && (
                  <div className="text-black mt-1" style={{ fontSize: "12px", fontWeight: 800 }}>
                    BBQ {selections.day_bbq}명 · 소계 {won((selections.day_bbq ?? 0) * DAY_USE_PRICES.day_bbq)}
                  </div>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => changeQuantity("day_bbq", -1)}
                  disabled={(selections.day_bbq ?? 0) === 0}
                  style={{ ...smallStepBtn, opacity: (selections.day_bbq ?? 0) === 0 ? 0.35 : 1 }}
                  aria-label="BBQ 인원 감소"
                >
                  −
                </button>
                <span style={{ minWidth: "28px", textAlign: "center", fontWeight: 800, fontSize: "15px" }}>
                  {selections.day_bbq ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => changeQuantity("day_bbq", +1)}
                  disabled={(selections.day_bbq ?? 0) >= MAX_DAY_USE_BBQ_GUESTS}
                  style={{
                    ...smallStepBtn,
                    opacity: (selections.day_bbq ?? 0) >= MAX_DAY_USE_BBQ_GUESTS ? 0.35 : 1,
                  }}
                  aria-label="BBQ 인원 증가"
                >
                  +
                </button>
              </div>
            </div>
            {dayUseBbqBlocked && (
              <p className="mt-2" style={{ color: "#e11d48", fontSize: "12px", fontWeight: 700 }}>
                BBQ는 무조건 하루 전에 예약해야 합니다. 이용일을 내일 이후로 선택해주세요.
              </p>
            )}
          </div>
        )}
      </Section>

      <Section title="4. 예약자">
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

      <Section title="5. 요청사항 (선택)">
        <p className="text-black/60 mb-2" style={{ fontSize: "12px", lineHeight: 1.6 }}>
          수상레저 이용 인원과 실제 방문 인원이 다를 경우 테이블 세팅 준비를 위해 요청사항에 남겨주세요.
          예: 수상레저 5명 이용, 총 방문 8명
        </p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="예: 수상레저는 5명 이용하고, 총 8명 방문 예정입니다."
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
          <Row
            k="일정"
            v={
              reservationMode === "stay"
                ? `${formatDateKo(checkIn)} → ${formatDateKo(checkOut)} · ${nights}박`
                : `${formatDateKo(checkIn)} 당일 이용`
            }
          />
          <Row k="인원" v={`${guestsCount}명`} />
          {petCount > 0 && (
            <Row k="반려견 동반" v={`${petCount}마리 (+${won(petFee)})`} />
          )}
          {reservationMode === "stay" && <Row k="객실" v={<span className="text-black/60">관리자 확인 후 배정</span>} />}
          {reservationMode === "stay" && <Row k="계절" v={seasonLabel} />}
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

      {reservationMode === "stay" && (
        <div
          className="mt-6 p-5 md:p-6"
          style={{
            backgroundColor: "#fff",
            border: "1px solid rgba(0,0,0,0.14)",
            borderRadius: "3px",
          }}
        >
          <p className="text-black" style={{ fontSize: "14px", fontWeight: 850, letterSpacing: "-0.01em" }}>
            숙박 패키지 취소·환불 규정
          </p>
          <ul className="mt-3 space-y-1.5 text-black/72" style={{ fontSize: "13px", lineHeight: 1.65 }}>
            {STAY_REFUND_POLICY_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span style={{ color: "#00C2D1", flexShrink: 0 }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "2px" }}>
            {STAY_ROOM_CANCEL_FEES.map(([when, fee], idx) => (
              <div
                key={when}
                className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                style={{
                  borderTop: idx === 0 ? "none" : "1px solid rgba(0,0,0,0.07)",
                  fontSize: "12px",
                }}
              >
                <div className="px-3 py-2 text-black/58" style={{ backgroundColor: "rgba(0,0,0,0.035)", fontWeight: 800 }}>
                  {when}
                </div>
                <div className="px-3 py-2 text-black" style={{ fontWeight: 850 }}>
                  {fee}
                </div>
              </div>
            ))}
          </div>
          <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={refundPolicyAgreed}
              onChange={(e) => setRefundPolicyAgreed(e.target.checked)}
              className="mt-0.5"
              required
            />
            <span className="text-black" style={{ fontSize: "13px", lineHeight: 1.6, fontWeight: 700 }}>
              위 취소·환불 규정을 확인했으며 이에 동의합니다.
            </span>
          </label>
        </div>
      )}

      {reservationMode === "day_use" && (
        <div
          className="mt-6 p-5 md:p-6"
          style={{
            backgroundColor: "#fff",
            border: "1px solid rgba(0,0,0,0.14)",
            borderRadius: "3px",
          }}
        >
          <p className="text-black" style={{ fontSize: "14px", fontWeight: 850, letterSpacing: "-0.01em" }}>
            당일 패키지 예약 및 환불 규정
          </p>
          <ul className="mt-3 space-y-1.5 text-black/72" style={{ fontSize: "13px", lineHeight: 1.65 }}>
            {DAY_USE_REFUND_POLICY_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span style={{ color: "#00C2D1", flexShrink: 0 }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "2px" }}>
            {DAY_USE_CANCEL_FEES.map(([when, refund], idx) => (
              <div
                key={when}
                className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                style={{
                  borderTop: idx === 0 ? "none" : "1px solid rgba(0,0,0,0.07)",
                  fontSize: "12px",
                }}
              >
                <div className="px-3 py-2 text-black/58" style={{ backgroundColor: "rgba(0,0,0,0.035)", fontWeight: 800 }}>
                  {when}
                </div>
                <div
                  className="px-3 py-2"
                  style={{
                    color: refund === "환불 불가" ? "#dc2626" : "#111",
                    fontWeight: 850,
                  }}
                >
                  {refund}
                </div>
              </div>
            ))}
          </div>
          <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={dayUsePolicyAgreed}
              onChange={(e) => setDayUsePolicyAgreed(e.target.checked)}
              className="mt-0.5"
              required
            />
            <span className="text-black" style={{ fontSize: "13px", lineHeight: 1.6, fontWeight: 700 }}>
              위 예약 및 환불 규정을 확인했으며 이에 동의합니다.
            </span>
          </label>
        </div>
      )}

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
            (reservationMode === "stay" && !refundPolicyAgreed) ||
            (reservationMode === "day_use" && !dayUsePolicyAgreed) ||
            !quantityMatch ||
            dayUseBbqBlocked ||
            inboatMinBlocked ||
            grandTotal <= 0 ||
            availability.state !== "ok"
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
                (reservationMode === "stay" && !refundPolicyAgreed) ||
                (reservationMode === "day_use" && !dayUsePolicyAgreed) ||
                !quantityMatch ||
                dayUseBbqBlocked ||
                inboatMinBlocked ||
                grandTotal <= 0 ||
                availability.state !== "ok"
                ? 0.5
                : 1,
            cursor:
              submitting ||
                !phoneConfirmed ||
                !paymentConfirmed ||
                (reservationMode === "stay" && !refundPolicyAgreed) ||
                (reservationMode === "day_use" && !dayUsePolicyAgreed) ||
                !quantityMatch ||
                dayUseBbqBlocked ||
                inboatMinBlocked ||
                grandTotal <= 0 ||
                availability.state !== "ok"
                ? "not-allowed"
                : "pointer",
          }}
        >
          {submitting
            ? "처리 중..."
            : availabilityBlocked
              ? availability.state === "unavailable" && availability.reason.includes("전화")
                ? "전화 문의 필요"
                : "선택한 일정 예약 마감"
              : availability.state === "loading"
                ? "일정 확인 중..."
                : !quantityMatch
                  ? `패키지 ${remainingQuantity > 0 ? `${remainingQuantity}명 더 선택` : `${-remainingQuantity}명 초과`}`
                  : dayUseBbqBlocked
                    ? "BBQ 하루 전 예약 필요"
                    : inboatMinBlocked
                      ? "인보트 4인 이상 선택 필요"
                      : reservationMode === "stay" && !refundPolicyAgreed
                        ? "취소·환불 규정 동의 필요"
                        : reservationMode === "day_use" && !dayUsePolicyAgreed
                          ? "예약·환불 규정 동의 필요"
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

function AvailabilityBadge({ availability }: { availability: Availability }) {
  const badge = (() => {
    if (availability.state === "loading")
      return { text: "일정 확인 중...", bg: "rgba(0,0,0,0.06)", fg: "rgba(0,0,0,0.55)" };
    if (availability.state === "ok")
      return { text: "선택하신 일정 예약 가능", bg: "rgba(0,194,209,0.12)", fg: "#009aa8" };
    if (availability.state === "unavailable")
      return { text: availability.reason, bg: "rgba(225,29,72,0.10)", fg: "#c1123d" };
    if (availability.state === "error")
      return { text: availability.message, bg: "rgba(255,193,7,0.12)", fg: "#a06500" };
    return null;
  })();
  if (!badge) return null;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "6px 10px",
        backgroundColor: badge.bg,
        color: badge.fg,
        fontSize: "12px",
        fontWeight: 700,
        borderRadius: "2px",
      }}
    >
      {badge.text}
    </span>
  );
}
