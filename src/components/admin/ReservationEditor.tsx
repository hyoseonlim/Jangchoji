"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CONFIG_KEYS,
  CONFIG_LABELS,
  type ConfigKey,
  type PackagePriceRow,
  type PackageSelections,
  computeSelectionLines,
  holidaysInRange,
  perPersonStayTotalByConfig,
  priceRangeByConfig,
  summarizeSeasonFromRange,
} from "@/lib/pricing";
import { ROOM_KEYS, ROOMS, type RoomKey } from "@/lib/rooms";
import type { AdminReservationRow } from "@/lib/reservations";

const numberFmt = new Intl.NumberFormat("ko-KR");
const won = (n: number) => `₩${numberFmt.format(n)}`;

const MIN_GUESTS = 4;
const MAX_GUESTS = Math.max(...Object.values(ROOMS).map((r) => r.maxGuests));

type RoomAvailability = Record<RoomKey, boolean>;
const ALL_AVAILABLE: RoomAvailability = Object.fromEntries(
  ROOM_KEYS.map((k) => [k, true]),
) as RoomAvailability;

type Guest = { name: string; phone: string; isRepresentative: boolean };
type EditorStatus = "pending" | "confirmed";

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Mode = "create" | "edit";

export function ReservationEditor({
  open,
  mode,
  packagePrices,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: Mode;
  packagePrices: PackagePriceRow[];
  initial: AdminReservationRow | null;
  onClose: () => void;
  onSaved: (result: {
    id: number;
    status: "pending" | "confirmed";
    checkIn: string;
    checkOut: string;
  }) => void | Promise<void>;
}) {
  const isEdit = mode === "edit" && initial != null;

  // 초기값 준비
  const initialGuests: Guest[] = useMemo(() => {
    if (!initial) return [{ name: "", phone: "", isRepresentative: true }];
    const list: Guest[] = initial.guests.map((g) => ({
      name: g.name,
      phone: g.phone ?? "",
      isRepresentative: g.isRepresentative,
    }));
    if (!list.some((g) => g.isRepresentative) && list.length > 0) {
      list[0].isRepresentative = true;
    }
    return list.length > 0 ? list : [{ name: "", phone: "", isRepresentative: true }];
  }, [initial]);

  const initialSelections: PackageSelections = useMemo(() => {
    if (!initial) return {};
    const out: PackageSelections = {};
    for (const p of initial.packages) out[p.configKey] = p.quantity;
    return out;
  }, [initial]);

  const [checkIn, setCheckIn] = useState(() => initial?.check_in ?? todayISO(3));
  const [checkOut, setCheckOut] = useState(() => initial?.check_out ?? todayISO(4));
  const [guestsCount, setGuestsCount] = useState(() => initial?.guests_count ?? MIN_GUESTS);
  const [roomKey, setRoomKey] = useState<RoomKey>(() => initial?.room_key ?? "room_4_a");
  const [availability, setAvailability] = useState<RoomAvailability>(ALL_AVAILABLE);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [selections, setSelections] = useState<PackageSelections>(initialSelections);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [memo, setMemo] = useState(() => initial?.memo ?? "");
  const [status, setStatus] = useState<EditorStatus>(() =>
    initial?.status === "confirmed" ? "confirmed" : "pending",
  );
  const [depositorName, setDepositorName] = useState(() => initial?.depositor_name ?? "");
  const [depositorEdited, setDepositorEdited] = useState(() => Boolean(initial?.depositor_name));
  const [priceOverrideOn, setPriceOverrideOn] = useState(() => initial?.price_override != null);
  const [priceOverride, setPriceOverride] = useState(() =>
    initial?.price_override != null ? String(initial.price_override) : "",
  );
  const [priceNote, setPriceNote] = useState(() => initial?.price_note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 모달이 열릴 때마다 값 리셋 (initial 변경 반영)
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setCheckIn(initial.check_in);
      setCheckOut(initial.check_out);
      setGuestsCount(initial.guests_count);
      setRoomKey(initial.room_key ?? "room_4_a");
      const sel: PackageSelections = {};
      for (const p of initial.packages) sel[p.configKey] = p.quantity;
      setSelections(sel);
      setGuests(
        initial.guests.length > 0
          ? initial.guests.map((g) => ({
              name: g.name,
              phone: g.phone ?? "",
              isRepresentative: g.isRepresentative,
            }))
          : [{ name: "", phone: "", isRepresentative: true }],
      );
      setMemo(initial.memo ?? "");
      setStatus(initial.status === "confirmed" ? "confirmed" : "pending");
      setDepositorName(initial.depositor_name ?? "");
      setDepositorEdited(Boolean(initial.depositor_name));
      setPriceOverrideOn(initial.price_override != null);
      setPriceOverride(initial.price_override != null ? String(initial.price_override) : "");
      setPriceNote(initial.price_note ?? "");
    } else {
      setCheckIn(todayISO(3));
      setCheckOut(todayISO(4));
      setGuestsCount(MIN_GUESTS);
      setRoomKey("room_4_a");
      setSelections({});
      setGuests([{ name: "", phone: "", isRepresentative: true }]);
      setMemo("");
      setStatus("pending");
      setDepositorName("");
      setDepositorEdited(false);
      setPriceOverrideOn(false);
      setPriceOverride("");
      setPriceNote("");
    }
    setSubmitError(null);
  }, [open, initial]);

  const representative = guests.find((g) => g.isRepresentative);
  const representativeName = representative?.name.trim() ?? "";

  // 입금자명 자동 채움
  useEffect(() => {
    if (!depositorEdited) setDepositorName(representativeName);
  }, [representativeName, depositorEdited]);

  const perPersonByConfig = useMemo(
    () => perPersonStayTotalByConfig(packagePrices, checkIn, checkOut),
    [packagePrices, checkIn, checkOut],
  );
  const priceRanges = useMemo(() => priceRangeByConfig(packagePrices), [packagePrices]);
  const selectionResult = useMemo(
    () => computeSelectionLines(perPersonByConfig, selections),
    [perPersonByConfig, selections],
  );
  const totalQuantity = selectionResult?.totalQuantity ?? 0;
  const computedTotal = selectionResult?.total ?? 0;
  const season = useMemo(
    () => summarizeSeasonFromRange(checkIn, checkOut),
    [checkIn, checkOut],
  );
  const holidayNotes = useMemo(() => holidaysInRange(checkIn, checkOut), [checkIn, checkOut]);
  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
    return Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
    );
  }, [checkIn, checkOut]);

  // 실시간 객실 가용성 (편집 시 자기 자신 제외)
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!open) return;
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
    const params = new URLSearchParams({ checkIn, checkOut });
    if (isEdit && initial) params.set("excludeId", String(initial.id));
    fetch(`/api/admin/rooms/availability?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "객실 조회 실패");
        return json.availability as RoomAvailability;
      })
      .then(setAvailability)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAvailabilityError(err instanceof Error ? err.message : "객실 조회 실패");
        setAvailability(ALL_AVAILABLE);
      })
      .finally(() => {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      });
    return () => controller.abort();
  }, [open, checkIn, checkOut, isEdit, initial]);

  const selectedRoom = ROOMS[roomKey];
  const roomFits =
    guestsCount >= selectedRoom.minGuests && guestsCount <= selectedRoom.maxGuests;
  const roomAvailable = availability[roomKey];
  const canSubmit = !submitting && checkOut > checkIn && totalQuantity > 0 && representativeName.length > 0;

  // 음수 허용 (환불·조정용). "-" 만 남아있으면 아직 미완성 → NaN
  const priceOverrideNum = (() => {
    const cleaned = priceOverride.replace(/[^0-9-]/g, "");
    if (cleaned === "" || cleaned === "-") return NaN;
    const n = Number(cleaned);
    return Number.isInteger(n) ? n : NaN;
  })();
  const finalTotal = priceOverrideOn && Number.isFinite(priceOverrideNum) ? priceOverrideNum : computedTotal;

  function updateGuest(idx: number, patch: Partial<Guest>) {
    setGuests((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }
  function setRepresentative(idx: number) {
    setGuests((prev) => prev.map((g, i) => ({ ...g, isRepresentative: i === idx })));
  }
  function addGuest() {
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
  function changeQuantity(key: ConfigKey, delta: number) {
    setSelections((prev) => {
      const cur = prev[key] ?? 0;
      const next = Math.max(0, Math.min(50, cur + delta));
      if (next === cur) return prev;
      const merged = { ...prev, [key]: next };
      if (next === 0) delete merged[key];
      return merged;
    });
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (!representativeName) {
      setSubmitError("대표자 이름을 입력해주세요.");
      return;
    }
    if (!representative?.phone || representative.phone.replace(/\D+/g, "").length < 9) {
      setSubmitError("대표자 전화번호를 입력해주세요.");
      return;
    }
    if (totalQuantity === 0) {
      setSubmitError("패키지를 1개 이상 선택해주세요.");
      return;
    }
    if (priceOverrideOn) {
      if (!Number.isFinite(priceOverrideNum)) {
        setSubmitError("오버라이드 금액을 입력해주세요.");
        return;
      }
      if (priceNote.trim().length === 0) {
        setSubmitError("오버라이드 사유를 입력해주세요.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const body = {
        packageSelections: selections,
        roomKey,
        guestsCount,
        checkIn,
        checkOut,
        guests,
        memo: memo.trim() || undefined,
        depositorName: depositorName.trim() || undefined,
        status,
        priceOverride: priceOverrideOn ? priceOverrideNum : undefined,
        priceNote: priceOverrideOn ? priceNote.trim() : undefined,
      };
      const url = isEdit
        ? `/api/admin/reservations/${initial!.id}/edit`
        : "/api/admin/reservations";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "저장 실패");
        return;
      }
      const savedId: number = isEdit ? initial!.id : Number(json.id);
      await onSaved({
        id: savedId,
        status,
        checkIn,
        checkOut,
      });
      onClose();
    } catch {
      setSubmitError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(2px)",
            zIndex: 50,
          }}
        />
        <Dialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(96vw, 720px)",
            maxHeight: "92vh",
            backgroundColor: "#14171c",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            zIndex: 51,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <Dialog.Title
              style={{ fontSize: "16px", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}
            >
              {isEdit ? `예약 편집 · #${initial!.id}` : "수기 예약 등록"}
            </Dialog.Title>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.55)",
                fontSize: "20px",
                cursor: "pointer",
                padding: "4px 8px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Body (scroll) */}
          <div style={{ overflowY: "auto", padding: "16px 20px" }}>
            {/* 일정 */}
            <Field label="일정">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut <= e.target.value) {
                      const d = new Date(e.target.value);
                      d.setDate(d.getDate() + 1);
                      setCheckOut(
                        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
                      );
                    }
                  }}
                  style={inputStyle}
                />
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <SubHint>
                {nights > 0 ? `총 ${nights}박` : "체크아웃은 체크인 다음날 이후여야 합니다."}
                {season && ` · ${
                  season === "peak" ? "성수기" : season === "off" ? "비수기" : "혼합"
                }`}
              </SubHint>
              {holidayNotes.length > 0 && (
                <div
                  className="mt-2 p-2"
                  style={{
                    backgroundColor: "rgba(225,29,72,0.1)",
                    border: "1px solid rgba(225,29,72,0.35)",
                    borderRadius: "2px",
                    fontSize: "11px",
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ color: "#ff6b7a", fontWeight: 800 }}>공휴일 포함 · 휴일 요금 적용</p>
                  <ul className="mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {holidayNotes.map((h) => (
                      <li key={h.date}>· {h.date} · {h.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Field>

            {/* 인원 */}
            <Field label="인원">
              <div className="inline-flex items-center gap-2">
                <button type="button" style={stepBtnStyle} onClick={() => setGuestsCount((n) => Math.max(1, n - 1))}>−</button>
                <span style={{ minWidth: "48px", textAlign: "center", fontWeight: 800, fontSize: "16px", color: "#fff" }}>
                  {guestsCount}
                </span>
                <button type="button" style={stepBtnStyle} onClick={() => setGuestsCount((n) => Math.min(MAX_GUESTS, n + 1))}>+</button>
                <SubHint className="ml-2">최소 1명 · 최대 {MAX_GUESTS}명</SubHint>
              </div>
            </Field>

            {/* 객실 */}
            <Field label="객실">
              {availabilityLoading && <SubHint>확인 중...</SubHint>}
              {availabilityError && (
                <p style={{ color: "#ff6b7a", fontSize: "12px", marginTop: "4px" }}>{availabilityError}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1">
                {ROOM_KEYS.map((rk) => {
                  const r = ROOMS[rk];
                  const available = availability[rk];
                  const fits = guestsCount >= r.minGuests && guestsCount <= r.maxGuests;
                  const active = roomKey === rk;
                  const warn = !available || !fits;
                  return (
                    <button
                      key={rk}
                      type="button"
                      onClick={() => setRoomKey(rk)}
                      style={{
                        padding: "8px",
                        textAlign: "left",
                        border: active
                          ? "1px solid #00C2D1"
                          : warn
                            ? "1px dashed rgba(255,255,255,0.15)"
                            : "1px solid rgba(255,255,255,0.12)",
                        backgroundColor: active ? "rgba(0,194,209,0.12)" : "rgba(255,255,255,0.02)",
                        color: active ? "#fff" : "rgba(255,255,255,0.85)",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#fff" }}>{r.title}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>
                        {r.minGuests === r.maxGuests ? `${r.minGuests}인` : `${r.minGuests}~${r.maxGuests}인`}
                      </div>
                      <div style={{ fontSize: "10px", marginTop: "2px", color: warn ? "#ffc107" : "#00d5e6", fontWeight: 700 }}>
                        {!available ? "예약 마감" : !fits ? "인원 조건 불충족" : "가능"}
                      </div>
                    </button>
                  );
                })}
              </div>
              {(!roomAvailable || !roomFits) && (
                <p style={{ color: "#ffc107", fontSize: "11px", marginTop: "6px" }}>
                  선택한 객실이 조건에 맞지 않지만 관리자 권한으로 저장은 가능합니다.
                </p>
              )}
            </Field>

            {/* 패키지 */}
            <Field label={`패키지 · 선택 ${totalQuantity}명 (인원 ${guestsCount})`}>
              {totalQuantity !== guestsCount && (
                <p style={{ color: "#ffc107", fontSize: "11px", marginBottom: "6px" }}>
                  ⓘ 관리자는 수량과 인원 수가 달라도 저장할 수 있습니다.
                </p>
              )}
              <ul className="space-y-1">
                {CONFIG_KEYS.map((key) => {
                  const quantity = selections[key] ?? 0;
                  const perPerson = perPersonByConfig[key];
                  const range = priceRanges[key];
                  const active = quantity > 0;
                  return (
                    <li
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        padding: "8px 10px",
                        backgroundColor: active ? "rgba(0,194,209,0.06)" : "rgba(255,255,255,0.02)",
                        border: active ? "1px solid rgba(0,194,209,0.35)" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "3px",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "12px", color: "#fff", fontWeight: 700 }}>
                          {CONFIG_LABELS[key]}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "1px" }}>
                          {perPerson != null ? (
                            <>1인 총 <strong style={{ color: "#fff" }}>{won(perPerson)}</strong></>
                          ) : range ? (
                            <>1인 1박 {range.min === range.max ? won(range.min) : `${won(range.min)} ~ ${won(range.max)}`}</>
                          ) : (
                            "-"
                          )}
                          {quantity > 0 && perPerson != null && (
                            <span style={{ color: "#fff", fontWeight: 700, marginLeft: "6px" }}>
                              · 소계 {won(perPerson * quantity)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <button type="button" style={smallStepBtn} disabled={quantity === 0} onClick={() => changeQuantity(key, -1)}>−</button>
                        <span style={{ minWidth: "24px", textAlign: "center", color: "#fff", fontWeight: 800 }}>{quantity}</span>
                        <button type="button" style={smallStepBtn} onClick={() => changeQuantity(key, +1)}>+</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Field>

            {/* 예약자 */}
            <Field label="예약자">
              <ul className="space-y-2">
                {guests.map((g, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "8px 10px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "3px",
                      backgroundColor: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "11px", color: "#fff", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                        <input
                          type="radio"
                          name="rep-editor"
                          checked={g.isRepresentative}
                          onChange={() => setRepresentative(i)}
                        />
                        대표자
                      </label>
                      {guests.length > 1 && !g.isRepresentative && (
                        <button type="button" onClick={() => removeGuest(i)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer" }}>
                          삭제
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="이름"
                        value={g.name}
                        onChange={(e) => updateGuest(i, { name: e.target.value })}
                        maxLength={40}
                        style={inputStyle}
                      />
                      <input
                        type="tel"
                        placeholder={g.isRepresentative ? "전화번호 (필수)" : "전화번호 (선택)"}
                        value={g.phone}
                        onChange={(e) => updateGuest(i, { phone: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={addGuest}
                style={{ marginTop: "6px", padding: "6px 10px", border: "1px dashed rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.7)", borderRadius: "2px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
              >
                + 동행자 추가
              </button>
            </Field>

            {/* 입금자명 */}
            <Field label="입금자명">
              <input
                type="text"
                value={depositorName}
                onChange={(e) => { setDepositorName(e.target.value); setDepositorEdited(true); }}
                placeholder="대표자 이름 자동 입력 · 편집 가능"
                maxLength={40}
                style={inputStyle}
              />
            </Field>

            {/* 요청사항 */}
            <Field label="요청사항 (선택)">
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                maxLength={1000}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="특별한 요청사항"
              />
            </Field>

            {/* 상태 */}
            <Field label="상태">
              <div className="inline-flex gap-1" style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3px", padding: "2px", backgroundColor: "rgba(0,0,0,0.2)" }}>
                {(["pending", "confirmed"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    style={{
                      padding: "5px 12px",
                      backgroundColor: status === s ? "#fff" : "transparent",
                      color: status === s ? "#0b0d10" : "rgba(255,255,255,0.65)",
                      border: "none",
                      borderRadius: "2px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {s === "pending" ? "확정 대기" : "확정"}
                  </button>
                ))}
              </div>
              <SubHint>취소는 저장 후 상세 화면의 취소 버튼으로 처리합니다.</SubHint>
            </Field>

            {/* 금액 */}
            <Field label="금액">
              <div
                style={{
                  padding: "10px 12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "3px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "12px" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>계산가</span>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{won(computedTotal)}</span>
                </div>
                <label style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={priceOverrideOn}
                    onChange={(e) => setPriceOverrideOn(e.target.checked)}
                  />
                  <span style={{ fontSize: "12px", color: "#fff", fontWeight: 600 }}>
                    다른 금액으로 저장 (오버라이드)
                  </span>
                </label>
                {priceOverrideOn && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="최종 금액 (원, 음수 가능)"
                      value={priceOverride}
                      onChange={(e) => {
                        // 숫자 · 선두 '-' 만 허용 (환불·조정용 음수 허용)
                        let v = e.target.value.replace(/[^0-9-]/g, "");
                        // '-' 는 맨 앞 한 번만 허용
                        const hasLeadingMinus = v.startsWith("-");
                        v = v.replace(/-/g, "");
                        if (hasLeadingMinus) v = "-" + v;
                        setPriceOverride(v);
                      }}
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      placeholder="사유 (예: 단골 할인)"
                      value={priceNote}
                      onChange={(e) => setPriceNote(e.target.value)}
                      maxLength={200}
                      style={inputStyle}
                    />
                  </div>
                )}
                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700 }}>저장될 총액</span>
                  <span style={{ color: "#fff", fontSize: "18px", fontWeight: 900, letterSpacing: "-0.01em" }}>
                    {won(finalTotal)}
                  </span>
                </div>
                {priceOverrideOn && computedTotal !== finalTotal && (
                  <div style={{ marginTop: "4px", fontSize: "11px", color: "#ffc107" }}>
                    계산가와 {finalTotal > computedTotal ? "+" : ""}
                    {won(finalTotal - computedTotal)} 차이
                  </div>
                )}
              </div>
            </Field>

            {submitError && (
              <p style={{ color: "#ff6b7a", fontSize: "12px", marginTop: "8px", fontWeight: 700 }}>{submitError}</p>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              gap: "8px",
              justifyContent: "flex-end",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 14px",
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.75)",
                fontSize: "13px",
                fontWeight: 700,
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                padding: "8px 18px",
                backgroundColor: "#00C2D1",
                color: "#001518",
                fontSize: "13px",
                fontWeight: 800,
                border: "none",
                borderRadius: "2px",
                cursor: canSubmit ? "pointer" : "not-allowed",
                opacity: canSubmit ? 1 : 0.5,
              }}
            >
              {submitting ? "저장 중..." : isEdit ? "변경 저장" : "예약 등록"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------- Style helpers ----------

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  backgroundColor: "#0b0d10",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "2px",
  color: "#fff",
  fontSize: "13px",
  outline: "none",
  width: "100%",
};
const stepBtnStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "2px",
  backgroundColor: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};
const smallStepBtn: React.CSSProperties = {
  width: "26px",
  height: "26px",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "2px",
  backgroundColor: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "6px" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function SubHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={className} style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
      {children}
    </p>
  );
}
