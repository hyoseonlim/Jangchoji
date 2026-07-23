"use client";

import { Fragment, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminReservationRow,
  ReservationHistoryEntry,
  ReservationStatus,
} from "@/lib/reservations";
import { ROOMS, ROOM_KEYS, type RoomKey } from "@/lib/rooms";
import { AdminModal, type AdminModalRequest } from "./AdminModal";

const numberFmt = new Intl.NumberFormat("ko-KR");
const won = (n: number) => `₩${numberFmt.format(n)}`;
const wonShort = (n: number) =>
  n >= 10_000_000
    ? `${(n / 10_000_000).toFixed(1)}천만`
    : n >= 10_000
      ? `${Math.round(n / 10_000)}만`
      : numberFmt.format(n);

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "확정 대기",
  confirmed: "확정",
  cancelled: "취소",
};

const STATUS_COLOR: Record<
  ReservationStatus,
  { bg: string; fg: string; border: string }
> = {
  pending: { bg: "rgba(255,193,7,0.14)", fg: "#ffc107", border: "#ffc107" },
  confirmed: { bg: "rgba(0,194,209,0.14)", fg: "#00d5e6", border: "#00d5e6" },
  cancelled: { bg: "rgba(255,107,122,0.12)", fg: "#ff6b7a", border: "#7a7a7a" },
};

// 대기 > 확정 > 취소 순으로 정렬 (대기건이 항상 맨 위)
const STATUS_ORDER: Record<ReservationStatus, number> = {
  pending: 0,
  confirmed: 1,
  cancelled: 2,
};

type StatusFilter = "all" | ReservationStatus;
type DateScope = "upcoming" | "all" | "past";
type ViewMode = "list" | "date" | "room";

type HistoryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; entries: ReservationHistoryEntry[] }
  | { status: "error"; message: string };

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function monthStartISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
function formatDateWithDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${m}/${d}(${DAY_KO[dt.getDay()]})`;
}
function formatFullDateKo(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${y}년 ${m}월 ${d}일 (${DAY_KO[dt.getDay()]})`;
}

// 정렬: 대기 → 확정 → 취소, 같은 상태 안에서는 접수일 최신순
function sortReservations(list: AdminReservationRow[]): AdminReservationRow[] {
  return [...list].sort((a, b) => {
    const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (s !== 0) return s;
    // pending: 오래된 것 먼저 (FIFO 처리)
    // 나머지: 체크인 임박 순
    if (a.status === "pending" && b.status === "pending") {
      return a.created_at.localeCompare(b.created_at);
    }
    return a.check_in.localeCompare(b.check_in);
  });
}

export function AdminDashboard({
  admin,
  initialRows,
  locale,
}: {
  admin: { username: string; displayName: string; role: "admin" | "viewer" };
  initialRows: AdminReservationRow[];
  locale: string;
}) {
  const router = useRouter();
  const canWrite = admin.role === "admin";

  const [rows, setRows] = useState(initialRows);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [dateScope, setDateScope] = useState<DateScope>("upcoming");
  const [view, setView] = useState<ViewMode>("list");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [historyByRow, setHistoryByRow] = useState<Record<number, HistoryState>>({});
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<AdminModalRequest | null>(null);
  const modalResolveRef = useRef<((ok: boolean) => void) | null>(null);
  const [, startTransition] = useTransition();

  const today = todayISO();
  const weekEnd = addDaysISO(today, 7);
  const monthStart = monthStartISO();

  const counts = useMemo(() => {
    const c: Record<ReservationStatus, number> = { pending: 0, confirmed: 0, cancelled: 0 };
    for (const r of rows) c[r.status] += 1;
    return c;
  }, [rows]);

  const kpi = useMemo(() => {
    let todayCheckIn = 0;
    let weekCheckIn = 0;
    let monthRevenue = 0;
    for (const r of rows) {
      if (r.status === "cancelled") continue;
      if (r.check_in === today) todayCheckIn += 1;
      if (r.check_in >= today && r.check_in < weekEnd) weekCheckIn += 1;
      if (r.status === "confirmed" && r.check_in >= monthStart) monthRevenue += r.total_price;
    }
    return { pending: counts.pending, todayCheckIn, weekCheckIn, monthRevenue };
  }, [rows, counts.pending, today, weekEnd, monthStart]);

  const filtered = useMemo(() => {
    const list = rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (dateScope === "upcoming" && r.check_out < today) return false;
      if (dateScope === "past" && r.check_in >= today) return false;
      return true;
    });
    return sortReservations(list);
  }, [rows, statusFilter, dateScope, today]);

  const byDate = useMemo(() => {
    const map = new Map<string, AdminReservationRow[]>();
    for (const r of filtered) {
      const list = map.get(r.check_in) ?? [];
      list.push(r);
      map.set(r.check_in, list);
    }
    return [...map.entries()]
      .map(([d, list]) => [d, sortReservations(list)] as const)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const byRoom = useMemo(() => {
    const map: Record<RoomKey | "none", AdminReservationRow[]> = {
      room_4: [],
      room_5: [],
      room_6: [],
      room_8: [],
      none: [],
    };
    for (const r of filtered) {
      if (r.room_key) map[r.room_key].push(r);
      else map.none.push(r);
    }
    for (const key of ROOM_KEYS) map[key] = sortReservations(map[key]);
    map.none = sortReservations(map.none);
    return map;
  }, [filtered]);

  function openModal(request: AdminModalRequest): Promise<boolean> {
    return new Promise((resolve) => {
      modalResolveRef.current = resolve;
      setModal(request);
    });
  }
  function resolveModal(ok: boolean) {
    const r = modalResolveRef.current;
    modalResolveRef.current = null;
    setModal(null);
    r?.(ok);
  }
  async function showAlert(title: string, message: string, variant: "primary" | "danger" = "primary") {
    await openModal({ title, message, confirmLabel: "확인", variant });
  }

  async function refresh() {
    const res = await fetch("/api/admin/reservations", { cache: "no-store" });
    const json = await res.json();
    if (res.ok) setRows(json.rows);
    else await showAlert("조회 실패", json.error ?? "예약을 불러오지 못했습니다.", "danger");
  }

  async function transition(id: number, action: "confirm" | "cancel", request: AdminModalRequest) {
    const ok = await openModal(request);
    if (!ok) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showAlert("처리 실패", json.error ?? "상태 변경 중 오류가 발생했습니다.", "danger");
        return;
      }
      await refresh();
      setHistoryByRow((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (expandedIds.has(id)) void fetchHistory(id);
    } catch {
      await showAlert("네트워크 오류", "요청 중 문제가 발생했습니다.", "danger");
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    startTransition(() => {
      router.replace(`/${locale}/admin/login`);
      router.refresh();
    });
  }

  async function fetchHistory(id: number) {
    setHistoryByRow((prev) => ({ ...prev, [id]: { status: "loading" } }));
    try {
      const res = await fetch(`/api/admin/reservations/${id}/history`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "이력 조회 실패");
      setHistoryByRow((prev) => ({
        ...prev,
        [id]: { status: "ready", entries: json.entries as ReservationHistoryEntry[] },
      }));
    } catch (err) {
      setHistoryByRow((prev) => ({
        ...prev,
        [id]: { status: "error", message: err instanceof Error ? err.message : "이력 조회 실패" },
      }));
    }
  }

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        const cur = historyByRow[id];
        if (!cur || cur.status === "error") void fetchHistory(id);
      }
      return next;
    });
  }

  function askConfirm(row: AdminReservationRow) {
    void transition(row.id, "confirm", {
      title: `예약 확정`,
      message: `${row.package_label}\n${row.guests_count}명 · ${won(row.total_price)}\n\n입금이 확인되어 예약을 확정합니다.`,
      confirmLabel: "확정",
      cancelLabel: "닫기",
      variant: "primary",
    });
  }
  function askCancel(row: AdminReservationRow) {
    void transition(row.id, "cancel", {
      title: `예약 취소`,
      message:
        (row.status === "confirmed"
          ? `이미 확정된 예약을 취소합니다.\n`
          : `대기 중인 예약을 취소합니다.\n`) +
        `${row.package_label}\n${row.guests_count}명 · ${won(row.total_price)}`,
      confirmLabel: "취소하기",
      cancelLabel: "닫기",
      variant: "danger",
    });
  }

  const tableProps: TableProps = {
    canWrite,
    busyId,
    expandedIds,
    onToggle: toggleExpand,
    onConfirm: askConfirm,
    onCancel: askCancel,
    historyByRow,
    today,
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-8 py-4 md:py-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
        <div>
          <p className="tracking-[0.2em] uppercase" style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
            ADMIN
          </p>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 900, letterSpacing: "-0.02em", color: "#fff" }}>
            예약 관리
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
            {admin.displayName}
            <span style={{ opacity: 0.55, marginLeft: "4px" }}>({admin.username})</span>
          </span>
          <span
            style={{
              padding: "3px 8px",
              backgroundColor: canWrite ? "rgba(0,194,209,0.15)" : "rgba(255,255,255,0.06)",
              color: canWrite ? "#00d5e6" : "rgba(255,255,255,0.55)",
              fontSize: "11px",
              fontWeight: 700,
              borderRadius: "2px",
            }}
          >
            {canWrite ? "변경 권한" : "조회 권한"}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "2px",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.75)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
        <KpiCard
          label="확정 대기"
          value={kpi.pending}
          unit="건"
          accent="#ffc107"
          highlighted={kpi.pending > 0}
        />
        <KpiCard label="오늘 체크인" value={kpi.todayCheckIn} unit="건" accent="#00d5e6" />
        <KpiCard label="이번 주 체크인" value={kpi.weekCheckIn} unit="건" accent="#a1a1aa" />
        <KpiCard label="이번 달 확정 매출" value={`₩${wonShort(kpi.monthRevenue)}`} accent="#00d5e6" />
      </div>

      {/* Toolbar */}
      <div
        className="mb-4 p-2.5 md:p-3"
        style={{
          backgroundColor: "#14171c",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "4px",
        }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div
            className="inline-flex p-0.5"
            role="tablist"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "3px",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            {(
              [
                ["list", "목록"],
                ["date", "일자별"],
                ["room", "호실별"],
              ] as const
            ).map(([key, label]) => {
              const active = view === key;
              return (
                <button
                  type="button"
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(key)}
                  style={{
                    padding: "6px 14px",
                    backgroundColor: active ? "#fff" : "transparent",
                    color: active ? "#0b0d10" : "rgba(255,255,255,0.65)",
                    fontSize: "12px",
                    fontWeight: 700,
                    borderRadius: "2px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={refresh}
            style={{
              padding: "6px 12px",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "2px",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.75)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ↻ 새로고침
          </button>
        </div>

        <div
          className="mt-2 pt-2 flex items-center justify-between gap-2 flex-wrap"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex flex-wrap gap-1">
            <FilterChip label="확정 대기" active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} count={counts.pending} accent="#ffc107" />
            <FilterChip label="확정" active={statusFilter === "confirmed"} onClick={() => setStatusFilter("confirmed")} count={counts.confirmed} accent="#00d5e6" />
            <FilterChip label="취소" active={statusFilter === "cancelled"} onClick={() => setStatusFilter("cancelled")} count={counts.cancelled} accent="#ff6b7a" />
            <FilterChip label="전체" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} count={rows.length} />
          </div>
          <div className="flex flex-wrap gap-1">
            <ScopeChip label="다가오는" active={dateScope === "upcoming"} onClick={() => setDateScope("upcoming")} />
            <ScopeChip label="전체 기간" active={dateScope === "all"} onClick={() => setDateScope("all")} />
            <ScopeChip label="지난 예약" active={dateScope === "past"} onClick={() => setDateScope("past")} />
          </div>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : view === "list" ? (
        <ReservationTable rows={filtered} {...tableProps} />
      ) : view === "date" ? (
        <div className="space-y-5">
          {byDate.map(([date, list]) => {
            const totalGuests = list.reduce((s, r) => s + r.guests_count, 0);
            return (
              <section key={date}>
                <SectionHeader
                  left={formatFullDateKo(date)}
                  right={`${list.length}건 · ${totalGuests}명`}
                  isToday={date === today}
                />
                <div className="mt-2">
                  <ReservationTable rows={list} {...tableProps} />
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {ROOM_KEYS.map((rk) => {
            const list = byRoom[rk];
            const room = ROOMS[rk];
            return (
              <section key={rk}>
                <SectionHeader
                  left={room.title}
                  right={`${list.length}건${list.length ? ` · ${
                    room.minGuests === room.maxGuests
                      ? `${room.minGuests}인`
                      : `${room.minGuests}~${room.maxGuests}인`
                  }${room.hasLoft ? " · 다락방" : ""}` : ""}`}
                />
                <div className="mt-2">
                  {list.length === 0 ? (
                    <p
                      className="px-3 py-4"
                      style={{
                        backgroundColor: "#14171c",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "3px",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      예약 없음
                    </p>
                  ) : (
                    <ReservationTable rows={list} {...tableProps} />
                  )}
                </div>
              </section>
            );
          })}
          {byRoom.none.length > 0 && (
            <section>
              <SectionHeader
                left="객실 미지정"
                right={`${byRoom.none.length}건`}
                warning
              />
              <div className="mt-2">
                <ReservationTable rows={byRoom.none} {...tableProps} />
              </div>
            </section>
          )}
        </div>
      )}

      <AdminModal
        request={modal}
        onConfirm={() => resolveModal(true)}
        onCancel={() => resolveModal(false)}
      />
    </div>
  );
}

// ---------- Reservation table ----------

type TableProps = {
  canWrite: boolean;
  busyId: number | null;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onConfirm: (r: AdminReservationRow) => void;
  onCancel: (r: AdminReservationRow) => void;
  historyByRow: Record<number, HistoryState>;
  today: string;
};

const COL_COUNT = 6;

function ReservationTable({ rows, ...props }: TableProps & { rows: AdminReservationRow[] }) {
  return (
    <div
      className="overflow-x-auto"
      style={{
        backgroundColor: "#14171c",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "4px",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: "640px",
          borderCollapse: "collapse",
          fontSize: "13px",
          color: "#fff",
        }}
      >
        <colgroup>
          <col style={{ width: "90px" }} />
          <col />
          <col style={{ width: "180px" }} />
          <col style={{ width: "130px" }} />
          <col style={{ width: "130px" }} />
          <col style={{ width: "32px" }} />
        </colgroup>
        <thead>
          <tr style={thRowStyle}>
            <th style={thStyle}>상태</th>
            <th style={thStyle}>예약자</th>
            <th style={thStyle}>일정</th>
            <th style={thStyle}>객실 · 인원</th>
            <th style={{ ...thStyle, textAlign: "right" }}>금액</th>
            <th style={thStyle} aria-label="확장" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <ReservationTableRow key={r.id} row={r} zebra={i % 2 === 1} {...props} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thRowStyle: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.02)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const thStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: "10px",
  fontWeight: 700,
  color: "rgba(255,255,255,0.5)",
  textAlign: "left",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
};

function ReservationTableRow({
  row,
  zebra,
  canWrite,
  busyId,
  expandedIds,
  onToggle,
  onConfirm,
  onCancel,
  historyByRow,
  today,
}: TableProps & { row: AdminReservationRow; zebra: boolean }) {
  const expanded = expandedIds.has(row.id);
  const c = STATUS_COLOR[row.status];
  const busy = busyId === row.id;
  const roomTitle = row.room_key ? ROOMS[row.room_key].title : "미지정";
  const nights = Math.max(
    1,
    Math.round((new Date(row.check_out).getTime() - new Date(row.check_in).getTime()) / 86_400_000),
  );
  const isCheckInToday = row.check_in === today;
  const isCancelled = row.status === "cancelled";
  const rowBg = expanded
    ? "rgba(255,255,255,0.04)"
    : zebra
      ? "rgba(255,255,255,0.015)"
      : "transparent";

  return (
    <Fragment>
      <tr
        onClick={() => onToggle(row.id)}
        style={{
          cursor: "pointer",
          backgroundColor: rowBg,
          borderBottom: expanded ? "none" : "1px solid rgba(255,255,255,0.05)",
          borderLeft: `3px solid ${c.border}`,
          opacity: isCancelled ? 0.65 : 1,
          transition: "background-color 120ms",
        }}
      >
        <td style={tdStyle}>
          <span
            style={{
              padding: "3px 8px",
              backgroundColor: c.bg,
              color: c.fg,
              fontSize: "10px",
              fontWeight: 800,
              borderRadius: "2px",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {STATUS_LABEL[row.status]}
          </span>
        </td>
        <td style={tdStyle}>
          <div style={{ fontWeight: 700 }}>
            {row.representative?.name || <Dim>이름 미기재</Dim>}
          </div>
          {row.representative?.phone && (
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "1px" }}>
              {row.representative.phone}
            </div>
          )}
        </td>
        <td style={tdStyle}>
          <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
            {formatDateWithDay(row.check_in)} → {formatDateWithDay(row.check_out)}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "1px" }}>
            {nights}박
            {isCheckInToday && !isCancelled && (
              <span
                style={{
                  marginLeft: "6px",
                  padding: "1px 6px",
                  backgroundColor: "rgba(0,213,230,0.15)",
                  color: "#00d5e6",
                  fontSize: "10px",
                  fontWeight: 800,
                  borderRadius: "2px",
                }}
              >
                오늘
              </span>
            )}
          </div>
        </td>
        <td style={tdStyle}>
          <div style={{ fontWeight: 600 }}>{roomTitle}</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "1px" }}>
            {row.guests_count}명
          </div>
        </td>
        <td style={{ ...tdStyle, textAlign: "right" }}>
          <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "-0.01em" }}>
            {won(row.total_price)}
          </div>
        </td>
        <td style={{ ...tdStyle, textAlign: "center", padding: "10px 6px" }}>
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              fontSize: "10px",
              color: "rgba(255,255,255,0.4)",
              transition: "transform 150ms",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▾
          </span>
        </td>
      </tr>
      {expanded && (
        <tr
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            borderLeft: `3px solid ${c.border}`,
          }}
        >
          <td colSpan={COL_COUNT} style={{ padding: "12px 16px" }}>
            <ExpandedDetail
              row={row}
              canWrite={canWrite}
              busy={busy}
              onConfirm={onConfirm}
              onCancel={onCancel}
              historyState={historyByRow[row.id] ?? { status: "loading" }}
            />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function ExpandedDetail({
  row,
  canWrite,
  busy,
  onConfirm,
  onCancel,
  historyState,
}: {
  row: AdminReservationRow;
  canWrite: boolean;
  busy: boolean;
  onConfirm: (r: AdminReservationRow) => void;
  onCancel: (r: AdminReservationRow) => void;
  historyState: HistoryState;
}) {
  return (
    <div>
      {row.packages.length > 0 && (
        <div className="mb-3">
          <FieldLabel>패키지 구성</FieldLabel>
          <ul
            className="mt-1 space-y-0.5"
            style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}
          >
            {row.packages.map((p) => (
              <li key={p.configKey} className="flex justify-between gap-3">
                <span>
                  {p.label} <span style={{ color: "rgba(255,255,255,0.5)" }}>× {p.quantity}명</span>
                </span>
                <span style={{ color: "rgba(255,255,255,0.95)", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {won(p.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3">
        <MiniField label="예약번호">#{row.id}</MiniField>
        <MiniField label="접수일시">
          {new Date(row.created_at).toLocaleString("ko-KR")}
        </MiniField>
        <MiniField label="입금자명">
          {row.depositor_name ? (
            <>
              {row.depositor_name}
              {row.representative && row.depositor_name !== row.representative.name && (
                <span style={{ marginLeft: "6px", color: "#ffc107", fontSize: "10px", fontWeight: 700 }}>
                  (대표자와 다름)
                </span>
              )}
            </>
          ) : (
            <Dim>-</Dim>
          )}
        </MiniField>
        <MiniField label="계절">
          {row.season === "peak" ? "성수기" : row.season === "off" ? "비수기" : "혼합"}
        </MiniField>
        {row.guest_names.length > 1 && (
          <MiniField label="동행" span2>
            {row.guest_names.slice(1).join(", ")}
          </MiniField>
        )}
        {row.memo && (
          <MiniField label="요청사항" span2>
            {row.memo}
          </MiniField>
        )}
      </div>

      {canWrite && row.status === "pending" && (
        <div className="flex gap-2 flex-wrap mb-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(row)}
            style={primaryBtn(busy)}
          >
            입금 확인 · 확정
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(row)}
            style={dangerBtn(busy)}
          >
            취소
          </button>
        </div>
      )}
      {canWrite && row.status === "confirmed" && (
        <div className="mb-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(row)}
            style={dangerBtn(busy)}
          >
            예약 취소
          </button>
        </div>
      )}

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
        <FieldLabel>이력</FieldLabel>
        <HistoryTimeline state={historyState} />
      </div>
    </div>
  );
}

function primaryBtn(busy: boolean): React.CSSProperties {
  return {
    padding: "7px 14px",
    backgroundColor: "#00C2D1",
    color: "#001518",
    fontSize: "13px",
    fontWeight: 800,
    borderRadius: "2px",
    border: "none",
    cursor: busy ? "wait" : "pointer",
    opacity: busy ? 0.5 : 1,
    letterSpacing: "-0.01em",
  };
}
function dangerBtn(busy: boolean): React.CSSProperties {
  return {
    padding: "7px 14px",
    backgroundColor: "transparent",
    color: "#ff6b7a",
    fontSize: "13px",
    fontWeight: 700,
    borderRadius: "2px",
    border: "1px solid rgba(255,107,122,0.4)",
    cursor: busy ? "wait" : "pointer",
    opacity: busy ? 0.5 : 1,
  };
}

// ---------- Sub-components ----------

function Dim({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "rgba(255,255,255,0.4)" }}>{children}</span>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "10px",
        fontWeight: 700,
        color: "rgba(255,255,255,0.45)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </p>
  );
}

function MiniField({
  label,
  children,
  span2,
}: {
  label: string;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <div
      className={span2 ? "sm:col-span-2" : ""}
      style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginRight: "6px",
        }}
      >
        {label}
      </span>
      <span>{children}</span>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  accent,
  highlighted,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className="p-3 md:p-4"
      style={{
        backgroundColor: "#14171c",
        border: `1px solid ${highlighted ? `${accent}88` : "rgba(255,255,255,0.08)"}`,
        borderRadius: "4px",
        boxShadow: highlighted ? `0 0 0 3px ${accent}22 inset` : "none",
      }}
    >
      <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.02em" }}>
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span
          style={{
            fontSize: "clamp(20px, 4.5vw, 26px)",
            fontWeight: 900,
            color: accent,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

function SectionHeader({
  left,
  right,
  isToday,
  warning,
}: {
  left: string;
  right?: string;
  isToday?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-2 flex-wrap px-1"
      style={{
        paddingBottom: "6px",
        borderBottom: `1px solid ${
          warning ? "rgba(255,193,7,0.3)" : "rgba(255,255,255,0.1)"
        }`,
      }}
    >
      <h3
        style={{
          fontSize: "13px",
          fontWeight: 800,
          color: warning
            ? "#ffc107"
            : isToday
              ? "#00d5e6"
              : "rgba(255,255,255,0.9)",
          letterSpacing: "-0.01em",
        }}
      >
        {left}
        {isToday && (
          <span
            style={{
              marginLeft: "6px",
              fontSize: "10px",
              padding: "1px 6px",
              backgroundColor: "rgba(0,194,209,0.15)",
              borderRadius: "2px",
              fontWeight: 800,
            }}
          >
            오늘
          </span>
        )}
      </h3>
      {right && (
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
          {right}
        </span>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  count,
  accent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 10px",
        border: active ? `1px solid ${accent ?? "#fff"}` : "1px solid rgba(255,255,255,0.12)",
        backgroundColor: active ? "rgba(255,255,255,0.06)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.65)",
        fontSize: "12px",
        fontWeight: 700,
        borderRadius: "2px",
        cursor: "pointer",
      }}
    >
      {label} <span style={{ opacity: 0.6 }}>({count})</span>
    </button>
  );
}

function ScopeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "4px 10px",
        backgroundColor: active ? "rgba(0,194,209,0.15)" : "transparent",
        border: `1px solid ${active ? "rgba(0,194,209,0.4)" : "rgba(255,255,255,0.1)"}`,
        color: active ? "#00d5e6" : "rgba(255,255,255,0.55)",
        fontSize: "11px",
        fontWeight: 700,
        borderRadius: "999px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div
      className="p-8 md:p-10 text-center"
      style={{
        backgroundColor: "#14171c",
        border: "1px dashed rgba(255,255,255,0.15)",
        borderRadius: "4px",
        color: "rgba(255,255,255,0.5)",
        fontSize: "13px",
      }}
    >
      해당 조건의 예약이 없습니다.
    </div>
  );
}

// ---------- History ----------

const STATUS_LABEL_HISTORY: Record<ReservationStatus, string> = {
  pending: "확정 대기",
  confirmed: "확정",
  cancelled: "취소",
};

function actionLabel(entry: ReservationHistoryEntry): string {
  if (entry.action === "created") return "예약 접수";
  if (entry.after_status) return STATUS_LABEL_HISTORY[entry.after_status];
  return entry.action;
}

function HistoryTimeline({ state }: { state: HistoryState }) {
  if (state.status === "loading") {
    return (
      <p className="mt-1" style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
        불러오는 중…
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <p className="mt-1" style={{ fontSize: "12px", color: "#ff6b7a" }}>
        {state.message}
      </p>
    );
  }
  if (state.status === "idle" || state.entries.length === 0) {
    return (
      <p className="mt-1" style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
        이력이 없습니다.
      </p>
    );
  }
  return (
    <ol className="mt-1.5 space-y-1.5" style={{ listStyle: "none", padding: 0 }}>
      {state.entries.map((e) => {
        const who =
          e.admin_display_name && e.admin_username
            ? `${e.admin_display_name} (${e.admin_username})`
            : e.admin_display_name ?? e.admin_username ?? "고객";
        return (
          <li key={e.id} className="flex gap-2" style={{ fontSize: "12px" }}>
            <span
              aria-hidden="true"
              style={{
                width: "6px",
                height: "6px",
                marginTop: "6px",
                borderRadius: "50%",
                backgroundColor: e.action === "created" ? "#a1a1aa" : "#00d5e6",
                flexShrink: 0,
              }}
            />
            <div className="min-w-0 flex-1">
              <div
                className="flex flex-wrap items-baseline gap-x-2"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                <span style={{ fontWeight: 700 }}>{actionLabel(e)}</span>
                {e.before_status && e.after_status && (
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
                    {STATUS_LABEL_HISTORY[e.before_status]} → {STATUS_LABEL_HISTORY[e.after_status]}
                  </span>
                )}
              </div>
              <div
                className="mt-0.5 flex flex-wrap gap-x-2"
                style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}
              >
                <span>{who}</span>
                <span>·</span>
                <span>{new Date(e.created_at).toLocaleString("ko-KR")}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
