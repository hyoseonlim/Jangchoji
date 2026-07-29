"use client";

import { Fragment, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminReservationRow,
  ReservationHistoryEntry,
  ReservationStatus,
} from "@/lib/reservations";
import type { PackagePriceRow } from "@/lib/pricing";
import { ROOMS, ROOM_KEYS, type RoomKey } from "@/lib/rooms";
import { AdminModal, type AdminModalRequest } from "./AdminModal";
import { ReservationEditor } from "./ReservationEditor";

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

type AdminTab = "pending" | "confirmed";

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
  packagePrices,
  locale,
}: {
  admin: { username: string; displayName: string; role: "admin" | "viewer" };
  initialRows: AdminReservationRow[];
  packagePrices: PackagePriceRow[];
  locale: string;
}) {
  const router = useRouter();
  const canWrite = admin.role === "admin";

  const [rows, setRows] = useState(initialRows);
  const [tab, setTab] = useState<AdminTab>("pending");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [historyByRow, setHistoryByRow] = useState<Record<number, HistoryState>>({});
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [editorTarget, setEditorTarget] = useState<AdminReservationRow | null>(null);
  const [modal, setModal] = useState<AdminModalRequest | null>(null);
  const modalResolveRef = useRef<((ok: boolean) => void) | null>(null);
  const [detailTarget, setDetailTarget] = useState<AdminReservationRow | null>(null);
  const [assignTarget, setAssignTarget] = useState<AdminReservationRow | null>(null);
  const [roomMoveTarget, setRoomMoveTarget] = useState<AdminReservationRow | null>(null);
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
    return {
      pending: counts.pending,
      todayCheckIn,
      weekCheckIn,
      monthRevenue,
    };
  }, [rows, counts.pending, today, weekEnd, monthStart]);

  const filtered = useMemo(() => {
    const list = rows.filter((r) => {
      if (tab === "pending") return r.status === "pending";
      return r.status === "confirmed";
    });
    return sortReservations(list);
  }, [rows, tab]);

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

  function openDetail(row: AdminReservationRow) {
    setDetailTarget(row);
    const cur = historyByRow[row.id];
    if (!cur || cur.status === "error") void fetchHistory(row.id);
  }

  function askConfirm(row: AdminReservationRow) {
    // room_key 가 없는 대기 예약(신규 온라인 예약)은 방 배정 다이얼로그로 라우팅
    if (row.reservation_type === "stay" && row.room_key == null) {
      setAssignTarget(row);
      return;
    }
    void transition(row.id, "confirm", {
      title: `예약 확정`,
      message: `${row.package_label}\n${row.guests_count}명 · ${won(row.total_price)}\n\n입금이 확인되어 예약을 확정합니다.`,
      confirmLabel: "확정",
      cancelLabel: "닫기",
      variant: "primary",
    });
  }

  async function handleAssignRoom(row: AdminReservationRow, roomKey: RoomKey) {
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/reservations/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "assign_room", roomKey }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showAlert("방 배정 실패", json.error ?? "방 배정 중 오류가 발생했습니다.", "danger");
        return;
      }
      setAssignTarget(null);
      await refresh();
      setHistoryByRow((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      if (expandedIds.has(row.id)) void fetchHistory(row.id);
    } catch {
      await showAlert("네트워크 오류", "요청 중 문제가 발생했습니다.", "danger");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMoveRoom(row: AdminReservationRow, roomKey: RoomKey) {
    const occupant = rows.find(
      (r) =>
        r.id !== row.id &&
        r.status === "confirmed" &&
        r.reservation_type === "stay" &&
        r.room_key === roomKey &&
        r.check_in === row.check_in &&
        r.check_out === row.check_out,
    );
    if (occupant) {
      const ok = await openModal({
        title: "호실 교체",
        message:
          `${ROOMS[roomKey].title}에는 이미 ${occupant.representative?.name ?? "-"} 예약이 배정되어 있습니다.\n\n` +
          `${row.representative?.name ?? "-"} 예약과 호실을 서로 바꿀까요?`,
        confirmLabel: "바꾸기",
        cancelLabel: "닫기",
        variant: "primary",
      });
      if (!ok) return false;
    }
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/reservations/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "move_room", roomKey }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showAlert("호실 변경 실패", json.error ?? "호실 변경 중 오류가 발생했습니다.", "danger");
        return false;
      }
      setRoomMoveTarget(null);
      setDetailTarget(null);
      await refresh();
      setHistoryByRow((prev) => {
        const next = { ...prev };
        delete next[row.id];
        if (occupant) delete next[occupant.id];
        return next;
      });
      return true;
    } catch {
      await showAlert("네트워크 오류", "요청 중 문제가 발생했습니다.", "danger");
      return false;
    } finally {
      setBusyId(null);
    }
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

  function openCreate() {
    setEditorTarget(null);
    setEditorMode("create");
  }
  function openEdit(row: AdminReservationRow) {
    setEditorTarget(row);
    setEditorMode("edit");
  }
  function closeEditor() {
    setEditorMode(null);
    setEditorTarget(null);
  }
  async function handleEditorSaved(result: {
    id: number;
    status: "pending" | "confirmed";
    checkIn: string;
    checkOut: string;
  }) {
    // 편집 시 이력 캐시 무효화
    if (editorTarget) {
      setHistoryByRow((prev) => {
        const next = { ...prev };
        delete next[editorTarget.id];
        return next;
      });
      if (expandedIds.has(editorTarget.id)) void fetchHistory(editorTarget.id);
    }
    await refresh();
    // 저장한 예약이 현재 필터에서 숨겨지지 않도록 자동 조정
    if (result.status === "pending" || result.status === "confirmed") setTab(result.status);
    // 방금 저장한 예약은 자동 확장해서 바로 확인 가능하도록
    setExpandedIds((prev) => new Set([...prev, result.id]));
  }

  const tableProps: TableProps = {
    canWrite,
    busyId,
    expandedIds,
    onToggle: toggleExpand,
    onConfirm: askConfirm,
    onCancel: askCancel,
    onEdit: openEdit,
    onOpenDetail: openDetail,
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
                ["pending", "대기건", counts.pending, "#ffc107"],
                ["confirmed", "확정건", counts.confirmed, "#00d5e6"],
              ] as const
            ).map(([key, label, count, accent]) => {
              const active = tab === key;
              return (
                <button
                  type="button"
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
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
                  <span style={{ marginLeft: "6px", color: active ? accent : "rgba(255,255,255,0.45)" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {canWrite && (
              <button
                type="button"
                onClick={openCreate}
                style={{
                  padding: "6px 12px",
                  border: "1px solid #00C2D1",
                  borderRadius: "2px",
                  backgroundColor: "#00C2D1",
                  color: "#001518",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                + 수기 등록
              </button>
            )}
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
        </div>

        <p className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "rgba(255,255,255,0.48)" }}>
          {tab === "pending" ? "대기건은 목록으로 확인하고 바로 확정 처리합니다." : "확정건은 다가오는 일정 기준으로 일자별 확인합니다."}
        </p>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : tab === "pending" ? (
        <ReservationTable rows={filtered} {...tableProps} />
      ) : (
        <ByDateGridView
          filtered={filtered}
          today={today}
          tableProps={tableProps}
        />
      )}

      <AdminModal
        request={modal}
        onConfirm={() => resolveModal(true)}
        onCancel={() => resolveModal(false)}
      />

      <ReservationDetailDialog
        row={detailTarget}
        canWrite={canWrite}
        busy={detailTarget ? busyId === detailTarget.id : false}
        historyState={detailTarget ? historyByRow[detailTarget.id] ?? { status: "loading" } : { status: "idle" }}
        onClose={() => setDetailTarget(null)}
        onConfirm={(row) => {
          setDetailTarget(null);
          askConfirm(row);
        }}
        onCancel={(row) => {
          setDetailTarget(null);
          askCancel(row);
        }}
        onEdit={(row) => {
          setDetailTarget(null);
          openEdit(row);
        }}
        onMoveRoom={(row) => {
          setDetailTarget(null);
          setRoomMoveTarget(row);
        }}
      />

      <ReservationEditor
        open={editorMode !== null}
        mode={editorMode ?? "create"}
        packagePrices={packagePrices}
        initial={editorTarget}
        onClose={closeEditor}
        onSaved={handleEditorSaved}
      />

      <AssignRoomDialog
        target={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssign={handleAssignRoom}
        busy={busyId != null}
      />

      <RoomMoveDialog
        target={roomMoveTarget}
        rows={rows}
        busy={roomMoveTarget ? busyId === roomMoveTarget.id : false}
        onClose={() => setRoomMoveTarget(null)}
        onMove={handleMoveRoom}
      />
    </div>
  );
}

// ---------- By-date grid view ----------

type ByDateEntry = readonly [string, AdminReservationRow[]];

function ByDateGridView({
  filtered,
  today,
  tableProps,
}: {
  filtered: AdminReservationRow[];
  today: string;
  tableProps: TableProps;
}) {
  const [showPastDates, setShowPastDates] = useState(false);
  // 일자별 점유 그룹핑
  const entries: ByDateEntry[] = useMemo(() => {
    const map = new Map<string, AdminReservationRow[]>();
    for (const r of filtered) {
      if (r.status === "cancelled") continue;
      const start = new Date(r.check_in);
      const end = new Date(r.check_out);
      const cursor = new Date(start);
      while (cursor < end) {
        const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        const list = map.get(iso) ?? [];
        list.push(r);
        map.set(iso, list);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);
  const yesterday = addDaysISO(today, -1);
  const pastEntries = entries.filter(([date]) => date < yesterday);
  const recentEntries = entries.filter(([date]) => date >= yesterday);
  const visibleEntries = showPastDates ? entries : recentEntries;

  if (entries.length === 0) return <EmptyState />;

  return (
    <div className="space-y-4">
      {pastEntries.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPastDates((prev) => !prev)}
          className="w-full text-left"
          style={{
            padding: "9px 12px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "4px",
            color: "rgba(255,255,255,0.72)",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          지난 일자 {pastEntries.length}일 {showPastDates ? "숨기기" : "보기"}
        </button>
      )}
      {visibleEntries.length === 0 ? (
        <EmptyState />
      ) : visibleEntries.map(([date, list]) => {
        const isToday = date === today;
        const totalGuests = list.reduce((s, r) => s + r.guests_count, 0);
        const stayCount = list.filter((r) => r.reservation_type === "stay").length;
        const dayUseCount = list.filter((r) => r.reservation_type === "day_use").length;

        // 각 물리 객실별로 그 날짜에 점유된 예약 찾기
        const cellByRoom = new Map<RoomKey, AdminReservationRow>();
        for (const r of list) {
          if (r.room_key) cellByRoom.set(r.room_key, r);
        }
        const occupiedCount = cellByRoom.size;
        const noRoomCount = list.filter((r) => r.reservation_type === "stay").length - occupiedCount;

        return (
          <section
            key={date}
            style={{
              backgroundColor: "#12151a",
              border: `1px solid ${isToday ? "rgba(0,213,230,0.45)" : "rgba(255,255,255,0.12)"}`,
              borderLeft: `4px solid ${isToday ? "#00d5e6" : "rgba(255,255,255,0.28)"}`,
              borderRadius: "4px",
              overflow: "hidden",
              boxShadow: isToday
                ? "0 0 0 1px rgba(0,213,230,0.08), 0 12px 26px rgba(0,0,0,0.24)"
                : "0 10px 22px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                padding: "11px 12px 10px",
                backgroundColor: isToday ? "rgba(0,213,230,0.08)" : "rgba(255,255,255,0.035)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                color: "inherit",
              }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: isToday ? "#00d5e6" : "#fff",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {formatFullDateKo(date)}
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
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>
                    숙박 {stayCount}건 · 당일 {dayUseCount}건 · {occupiedCount}/{ROOM_KEYS.length} 객실 점유 · {totalGuests}명
                    {noRoomCount > 0 && (
                      <span style={{ color: "#ffc107", marginLeft: "6px" }}>
                        · 객실 미지정 {noRoomCount}건
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* 7-cell grid */}
              <div
                className="mt-2 hidden md:grid gap-1"
                style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
              >
                {ROOM_KEYS.map((rk) => {
                  const room = ROOMS[rk];
                  const occupied = cellByRoom.get(rk);
                  return (
                    <RoomCell
                      key={rk}
                      primary={room.shortTitle}
                      secondary={room.typeTitle}
                      reservation={occupied ?? null}
                      onOpen={tableProps.onOpenDetail}
                    />
                  );
                })}
              </div>
              <div className="mt-2 md:hidden space-y-1.5">
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.72)" }}>
                  호실 현황과 당일이용 현황을 아래에서 확인하세요.
                </div>
              </div>
            </div>

            <div
              className="md:hidden grid gap-1.5"
              style={{
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                padding: "0 12px 10px",
              }}
            >
              {ROOM_KEYS.map((rk) => {
                const room = ROOMS[rk];
                const occupied = cellByRoom.get(rk) ?? null;
                const c = occupied ? STATUS_COLOR[occupied.status] : null;
                return (
                  <button
                    key={rk}
                    type="button"
                    disabled={!occupied}
                    onClick={() => occupied && tableProps.onOpenDetail(occupied)}
                    style={{
                      minHeight: "48px",
                      padding: "7px 8px",
                      textAlign: "left",
                      backgroundColor: occupied ? c?.bg : "rgba(255,255,255,0.025)",
                      border: occupied
                        ? `1px solid ${c?.border ?? "rgba(255,255,255,0.15)"}`
                        : "1px dashed rgba(255,255,255,0.12)",
                      borderRadius: "3px",
                      color: occupied ? c?.fg : "rgba(255,255,255,0.38)",
                      cursor: occupied ? "pointer" : "default",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 850 }}>
                      {room.shortTitle}
                    </div>
                    <div
                      style={{
                        marginTop: "2px",
                        fontSize: "11px",
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {occupied?.representative?.name ?? "비어있음"}
                    </div>
                  </button>
                );
              })}
            </div>

            {dayUseCount > 0 && (
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  padding: "8px 12px",
                  backgroundColor: "rgba(52,211,153,0.08)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#34d399", marginBottom: "5px" }}>
                  당일 패키지
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.filter((r) => r.reservation_type === "day_use").map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => tableProps.onOpenDetail(r)}
                      style={{
                        padding: "3px 7px",
                        border: "1px solid rgba(52,211,153,0.32)",
                        borderRadius: "2px",
                        fontSize: "11px",
                        color: "#d1fae5",
                        backgroundColor: "rgba(52,211,153,0.05)",
                        cursor: "pointer",
                      }}
                    >
                      #{r.id} {r.representative?.name ?? "-"} · {r.guests_count}명 · {r.package_label}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </section>
        );
      })}
    </div>
  );
}

function RoomCell({
  primary,
  secondary,
  reservation,
  onOpen,
}: {
  primary: string;
  secondary: string;
  reservation: AdminReservationRow | null;
  onOpen: (row: AdminReservationRow) => void;
}) {
  const occupied = reservation != null;
  const c = reservation ? STATUS_COLOR[reservation.status] : null;
  return (
    <button
      type="button"
      disabled={!reservation}
      onClick={() => reservation && onOpen(reservation)}
      title={`${primary} · ${secondary}`}
      style={{
        width: "100%",
        padding: "6px 4px",
        border: occupied
          ? `1px solid ${c?.border ?? "rgba(255,255,255,0.15)"}`
          : "1px dashed rgba(255,255,255,0.1)",
        borderRadius: "2px",
        backgroundColor: occupied ? (c?.bg ?? "transparent") : "transparent",
        textAlign: "center",
        minHeight: "48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "0px",
        cursor: occupied ? "pointer" : "default",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 900,
          color: occupied ? c?.fg : "rgba(255,255,255,0.55)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {primary}
      </div>
      <div
        style={{
          fontSize: "9px",
          fontWeight: 600,
          color: occupied ? c?.fg : "rgba(255,255,255,0.3)",
          opacity: occupied ? 0.8 : 1,
          lineHeight: 1.1,
        }}
      >
        {secondary}
      </div>
      {occupied && reservation?.representative && (
        <div
          style={{
            marginTop: "2px",
            fontSize: "10px",
            color: c?.fg,
            fontWeight: 700,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={reservation.representative.name}
        >
          {reservation.representative.name}
        </div>
      )}
    </button>
  );
}

// ---------- Reservation table ----------

type TableProps = {
  canWrite: boolean;
  busyId: number | null;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onOpenDetail: (row: AdminReservationRow) => void;
  onConfirm: (r: AdminReservationRow) => void;
  onCancel: (r: AdminReservationRow) => void;
  onEdit: (r: AdminReservationRow) => void;
  historyByRow: Record<number, HistoryState>;
  today: string;
};

const COL_COUNT = 6;

function ReservationTable({ rows, ...props }: TableProps & { rows: AdminReservationRow[] }) {
  return (
    <>
      <div className="md:hidden space-y-2">
        {rows.map((r) => (
          <MobileReservationCard key={r.id} row={r} today={props.today} onOpen={props.onOpenDetail} />
        ))}
      </div>
      <div
        className="hidden md:block overflow-x-auto"
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
    </>
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

function reservationRoomTitle(row: AdminReservationRow): string {
  if (row.reservation_type === "day_use") return "당일 이용";
  return row.room_key ? ROOMS[row.room_key].title : "미지정";
}

function reservationNights(row: AdminReservationRow): number {
  return Math.max(
    1,
    Math.round((new Date(row.check_out).getTime() - new Date(row.check_in).getTime()) / 86_400_000),
  );
}

function MobileReservationCard({
  row,
  today,
  onOpen,
}: {
  row: AdminReservationRow;
  today: string;
  onOpen: (row: AdminReservationRow) => void;
}) {
  const c = STATUS_COLOR[row.status];
  const isToday = row.check_in === today;
  const dateText =
    row.reservation_type === "day_use"
      ? `${formatDateWithDay(row.check_in)} 당일`
      : `${formatDateWithDay(row.check_in)} · ${reservationNights(row)}박`;
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="w-full text-left"
      style={{
        backgroundColor: "#14171c",
        border: `1px solid ${c.border}`,
        borderRadius: "4px",
        padding: "11px 12px",
        color: "#fff",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span style={{ fontSize: "14px", fontWeight: 850 }}>
              {row.representative?.name || "이름 미기재"}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 800, color: c.fg }}>
              {STATUS_LABEL[row.status]}
            </span>
            {row.reservation_type === "day_use" && (
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#34d399" }}>당일</span>
            )}
            {isToday && <span style={{ fontSize: "10px", fontWeight: 800, color: "#00d5e6" }}>오늘</span>}
          </div>
          <div style={{ marginTop: "4px", fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
            {dateText} · {row.guests_count}명 · {reservationRoomTitle(row)}
          </div>
          {row.representative?.phone && (
            <div style={{ marginTop: "3px", fontSize: "12px", color: "rgba(255,255,255,0.72)" }}>
              {row.representative.phone}
            </div>
          )}
          <div
            style={{
              marginTop: "5px",
              fontSize: "12px",
              color: "rgba(255,255,255,0.78)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.package_label}
          </div>
        </div>
        <div style={{ fontSize: "13px", fontWeight: 850, whiteSpace: "nowrap" }}>{won(row.total_price)}</div>
      </div>
    </button>
  );
}

function ReservationTableRow({
  row,
  zebra,
  canWrite,
  busyId,
  expandedIds,
  onToggle,
  onConfirm,
  onCancel,
  onEdit,
  historyByRow,
  today,
}: TableProps & { row: AdminReservationRow; zebra: boolean }) {
  const expanded = expandedIds.has(row.id);
  const c = STATUS_COLOR[row.status];
  const busy = busyId === row.id;
  const roomTitle = reservationRoomTitle(row);
  const nights = reservationNights(row);
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
          {row.source === "manual" && (
            <div
              style={{
                marginTop: "3px",
                fontSize: "9px",
                fontWeight: 800,
                color: "rgba(255,255,255,0.55)",
                letterSpacing: "0.05em",
              }}
            >
              수기
            </div>
          )}
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
            {row.reservation_type === "day_use" ? "당일" : `${nights}박`}
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
            {row.guests_count}명{row.pet_count > 0 ? ` · 🐶 반려견 ${row.pet_count}마리` : ""}
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
              onEdit={onEdit}
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
  onEdit,
  onMoveRoom,
  historyState,
}: {
  row: AdminReservationRow;
  canWrite: boolean;
  busy: boolean;
  onConfirm: (r: AdminReservationRow) => void;
  onCancel: (r: AdminReservationRow) => void;
  onEdit: (r: AdminReservationRow) => void;
  onMoveRoom?: (r: AdminReservationRow) => void;
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
        <MiniField label="대표 연락처">
          {row.representative?.phone ? (
            <a href={`tel:${row.representative.phone.replace(/\s+/g, "")}`} style={{ color: "#00d5e6", fontWeight: 800 }}>
              {row.representative.phone}
            </a>
          ) : (
            <Dim>-</Dim>
          )}
        </MiniField>
        <MiniField label="출처">
            {row.reservation_type === "day_use" && (
              <span style={{ marginRight: "6px", color: "#34d399", fontWeight: 800 }}>당일</span>
            )}
            {row.source === "manual" ? (
            <>
              수기 등록
              {row.created_by_admin && (
                <span style={{ marginLeft: "6px", color: "rgba(255,255,255,0.55)", fontSize: "11px" }}>
                  · {row.created_by_admin}
                </span>
              )}
            </>
          ) : (
            <span>온라인</span>
          )}
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
        {row.price_override != null && (
          <MiniField label="가격 오버라이드" span2>
            <span style={{ color: "#ffc107", fontWeight: 700 }}>
              적용됨 · {row.price_note ?? "사유 없음"}
            </span>
          </MiniField>
        )}
        {row.last_edited_at && (
          <MiniField label="최종 편집" span2>
            {new Date(row.last_edited_at).toLocaleString("ko-KR")}
            {row.last_edited_by && (
              <span style={{ marginLeft: "6px", color: "rgba(255,255,255,0.55)" }}>
                · {row.last_edited_by}
              </span>
            )}
          </MiniField>
        )}
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
            {row.reservation_type === "stay" && row.room_key == null ? "방 배정 및 확정" : "입금 확인 · 확정"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onEdit(row)}
            style={secondaryBtn(busy)}
          >
            편집
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
        <div className="mb-3 flex gap-2 flex-wrap">
          {row.reservation_type === "stay" && row.room_key && onMoveRoom && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onMoveRoom(row)}
              style={primaryBtn(busy)}
            >
              호실 바꾸기
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => onEdit(row)}
            style={secondaryBtn(busy)}
          >
            편집
          </button>
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

function ReservationDetailDialog({
  row,
  canWrite,
  busy,
  historyState,
  onClose,
  onConfirm,
  onCancel,
  onEdit,
  onMoveRoom,
}: {
  row: AdminReservationRow | null;
  canWrite: boolean;
  busy: boolean;
  historyState: HistoryState;
  onClose: () => void;
  onConfirm: (r: AdminReservationRow) => void;
  onCancel: (r: AdminReservationRow) => void;
  onEdit: (r: AdminReservationRow) => void;
  onMoveRoom: (r: AdminReservationRow) => void;
}) {
  if (!row) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 py-4"
      style={{ backgroundColor: "rgba(0,0,0,0.62)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl"
        style={{
          maxHeight: "88vh",
          overflowY: "auto",
          backgroundColor: "#14171c",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "6px",
          color: "#fff",
          padding: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em" }}>
              RESERVATION #{row.id}
            </p>
            <h2 style={{ fontSize: "18px", fontWeight: 900, marginTop: "2px" }}>
              {row.representative?.name ?? "이름 미기재"}
            </h2>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.58)", marginTop: "2px" }}>
              {row.reservation_type === "day_use" ? "당일" : reservationRoomTitle(row)} · {formatDateWithDay(row.check_in)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: "32px",
              height: "32px",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "2px",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.75)",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        <ExpandedDetail
          row={row}
          canWrite={canWrite}
          busy={busy}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onEdit={onEdit}
          onMoveRoom={onMoveRoom}
          historyState={historyState}
        />
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
function secondaryBtn(busy: boolean): React.CSSProperties {
  return {
    padding: "7px 14px",
    backgroundColor: "transparent",
    color: "rgba(255,255,255,0.85)",
    fontSize: "13px",
    fontWeight: 700,
    borderRadius: "2px",
    border: "1px solid rgba(255,255,255,0.2)",
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
  if (entry.action === "created") return "예약 접수 (온라인)";
  if (entry.action === "admin_created") return "수기 등록";
  if (entry.action === "edited") return "예약 편집";
  if (entry.after_status) return STATUS_LABEL_HISTORY[entry.after_status];
  return entry.action;
}

function actionColor(action: string): string {
  if (action === "created") return "#a1a1aa";
  if (action === "admin_created") return "#a78bfa";
  if (action === "edited") return "#fbbf24";
  if (action === "confirmed") return "#00d5e6";
  if (action === "cancelled") return "#ff6b7a";
  return "#00d5e6";
}

// 필드명을 한국어 라벨로 매핑
const FIELD_LABELS: Record<string, string> = {
  checkIn: "체크인",
  checkOut: "체크아웃",
  roomKey: "객실",
  guestsCount: "인원",
  status: "상태",
  memo: "요청사항",
  season: "계절",
  packageLabel: "패키지",
  totalPrice: "총액",
  priceOverride: "가격 오버라이드",
  priceNote: "오버라이드 사유",
  guests: "예약자",
  depositorName: "입금자명",
};

const ROOM_LABELS_HISTORY: Record<string, string> = {
  room_4: "4인실",
  room_5: "5인실",
  room_6: "6인실",
  room_8: "8인실",
};

function formatFieldValue(field: string, value: unknown): string {
  if (value == null || value === "") return "(비어있음)";
  if (field === "totalPrice" || field === "priceOverride") {
    if (typeof value === "number") return `₩${numberFmt.format(value)}`;
  }
  if (field === "roomKey" && typeof value === "string") {
    return ROOM_LABELS_HISTORY[value] ?? value;
  }
  if (field === "status" && typeof value === "string") {
    return STATUS_LABEL_HISTORY[value as ReservationStatus] ?? value;
  }
  if (field === "season" && typeof value === "string") {
    return value === "peak" ? "성수기" : value === "off" ? "비수기" : "혼합";
  }
  return String(value);
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
    <ol className="mt-1.5 space-y-2" style={{ listStyle: "none", padding: 0 }}>
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
                backgroundColor: actionColor(e.action),
                flexShrink: 0,
              }}
            />
            <div className="min-w-0 flex-1">
              <div
                className="flex flex-wrap items-baseline gap-x-2"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                <span style={{ fontWeight: 700 }}>{actionLabel(e)}</span>
                {e.before_status && e.after_status && e.action !== "edited" && (
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
              {e.changes && e.changes.length > 0 && (
                <ul
                  className="mt-1.5 space-y-0.5"
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.75)",
                    listStyle: "none",
                    padding: 0,
                    paddingLeft: "0",
                  }}
                >
                  {e.changes.map((c, idx) => (
                    <li key={idx} style={{ lineHeight: 1.5 }}>
                      <span style={{ color: "rgba(255,255,255,0.55)", marginRight: "4px" }}>
                        {FIELD_LABELS[c.field] ?? c.field}:
                      </span>
                      <span style={{ color: "rgba(255,107,122,0.85)" }}>
                        {formatFieldValue(c.field, c.before)}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 4px" }}>→</span>
                      <span style={{ color: "#00d5e6", fontWeight: 600 }}>
                        {formatFieldValue(c.field, c.after)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- Assign Room Dialog ----------

function AssignRoomDialog({
  target,
  onClose,
  onAssign,
  busy,
}: {
  target: AdminReservationRow | null;
  onClose: () => void;
  onAssign: (row: AdminReservationRow, roomKey: RoomKey) => void;
  busy: boolean;
}) {
  const [availability, setAvailability] = useState<Record<RoomKey, boolean> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedKey, setPickedKey] = useState<RoomKey | null>(null);

  useMemo(() => {
    if (!target) {
      setAvailability(null);
      setPickedKey(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setPickedKey(null);
    fetch(
      `/api/admin/rooms/availability?checkIn=${encodeURIComponent(target.check_in)}&checkOut=${encodeURIComponent(target.check_out)}`,
      { cache: "no-store" },
    )
      .then(async (res) => {
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "객실 조회 실패");
        return j.availability as Record<RoomKey, boolean>;
      })
      .then((a) => setAvailability(a))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "객실 조회 실패"))
      .finally(() => setLoading(false));
  }, [target]);

  if (!target) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#14171c",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "6px",
          padding: "20px",
          color: "#e6e8ec",
        }}
      >
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
          방 배정 및 확정
        </p>
        <h2 style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px", letterSpacing: "-0.01em" }}>
          #{target.id} · {target.representative?.name ?? "-"} · {target.guests_count}명
        </h2>
        <p style={{ marginTop: "6px", fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
          {target.check_in} ~ {target.check_out} · {target.package_label}
        </p>

        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)", marginBottom: "8px" }}>
            해당 일정에 사용 가능한 객실 (인원 대비 용량 미달 방은 비활성화)
          </p>
          {loading && (
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>불러오는 중…</p>
          )}
          {error && (
            <p style={{ fontSize: "12px", color: "#ff6b7a" }}>{error}</p>
          )}
          {availability && (
            <ul style={{ listStyle: "none", padding: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {ROOM_KEYS.map((k) => {
                const info = ROOMS[k];
                const free = availability[k];
                const fits = info.maxGuests >= target.guests_count;
                const enabled = free && fits;
                const picked = pickedKey === k;
                return (
                  <li key={k}>
                    <button
                      type="button"
                      disabled={!enabled || busy}
                      onClick={() => setPickedKey(k)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: "3px",
                        border: picked
                          ? "1px solid #00C2D1"
                          : enabled
                            ? "1px solid rgba(255,255,255,0.15)"
                            : "1px dashed rgba(255,255,255,0.1)",
                        backgroundColor: picked
                          ? "rgba(0,194,209,0.14)"
                          : enabled
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(255,255,255,0.02)",
                        color: enabled ? "#e6e8ec" : "rgba(255,255,255,0.35)",
                        cursor: enabled ? "pointer" : "not-allowed",
                      }}
                    >
                      <div style={{ fontSize: "13px", fontWeight: 800 }}>{info.title}</div>
                      <div style={{ fontSize: "11px", marginTop: "2px", color: enabled ? "rgba(255,255,255,0.6)" : "inherit" }}>
                        최대 {info.maxGuests}인
                        {!fits && " · 인원 초과"}
                        {fits && !free && " · 이미 배정됨"}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "8px 16px",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "2px",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.75)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            닫기
          </button>
          <button
            type="button"
            disabled={!pickedKey || busy}
            onClick={() => pickedKey && onAssign(target, pickedKey)}
            style={{
              padding: "8px 16px",
              borderRadius: "2px",
              border: "none",
              backgroundColor: "#00C2D1",
              color: "#001518",
              fontSize: "13px",
              fontWeight: 800,
              cursor: !pickedKey || busy ? "not-allowed" : "pointer",
              opacity: !pickedKey || busy ? 0.5 : 1,
            }}
          >
            {busy ? "처리 중…" : "배정 및 확정"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Room Move Dialog ----------

function RoomMoveDialog({
  target,
  rows,
  busy,
  onClose,
  onMove,
}: {
  target: AdminReservationRow | null;
  rows: AdminReservationRow[];
  busy: boolean;
  onClose: () => void;
  onMove: (row: AdminReservationRow, roomKey: RoomKey) => Promise<boolean>;
}) {
  if (!target || target.reservation_type !== "stay" || !target.room_key) return null;
  const currentRoomKey = target.room_key;
  const sameDateRows = rows.filter(
    (r) =>
      r.id !== target.id &&
      r.status === "confirmed" &&
      r.reservation_type === "stay" &&
      r.check_in === target.check_in &&
      r.check_out === target.check_out,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: "16px",
      }}
      onClick={busy ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "560px",
          backgroundColor: "#14171c",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "6px",
          padding: "20px",
          color: "#e6e8ec",
        }}
      >
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
          ROOM CHANGE
        </p>
        <h2 style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px", letterSpacing: "-0.01em" }}>
          호실 바꾸기
        </h2>
        <p style={{ marginTop: "6px", fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
          #{target.id} · {target.representative?.name ?? "-"} · {target.check_in}~{target.check_out}
        </p>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ROOM_KEYS.map((roomKey) => {
            const room = ROOMS[roomKey];
            const occupant = sameDateRows.find((r) => r.room_key === roomKey) ?? null;
            const current = currentRoomKey === roomKey;
            const targetFits = room.maxGuests >= target.guests_count;
            const swapFits = !occupant || ROOMS[currentRoomKey].maxGuests >= occupant.guests_count;
            const disabled = busy || current || !targetFits || !swapFits;
            return (
              <button
                key={roomKey}
                type="button"
                disabled={disabled}
                onClick={() => void onMove(target, roomKey)}
                style={{
                  minHeight: "74px",
                  padding: "9px",
                  textAlign: "left",
                  backgroundColor: current
                    ? "rgba(255,255,255,0.04)"
                    : occupant
                      ? "rgba(167,139,250,0.12)"
                      : "rgba(0,194,209,0.08)",
                  border: current
                    ? "1px solid rgba(255,255,255,0.14)"
                    : occupant
                      ? "1px solid rgba(167,139,250,0.45)"
                      : "1px solid rgba(0,194,209,0.35)",
                  borderRadius: "3px",
                  color: disabled ? "rgba(255,255,255,0.35)" : "#fff",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.65 : 1,
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 900 }}>{room.shortTitle}</div>
                <div style={{ marginTop: "3px", fontSize: "11px", color: "rgba(255,255,255,0.62)" }}>
                  {current
                    ? "현재 호실"
                    : occupant
                      ? `${occupant.representative?.name ?? "-"}와 교체`
                      : "빈 호실로 이동"}
                </div>
                {!targetFits && (
                  <div style={{ marginTop: "3px", fontSize: "10px", color: "#ff6b7a", fontWeight: 800 }}>
                    인원 초과
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p style={{ marginTop: "12px", fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
          이 호실 변경은 위 숙박 일정 안에서만 적용됩니다. 이미 배정된 호실을 선택하면 두 예약의 호실을 서로 바꿉니다.
        </p>

        <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "8px 16px",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "2px",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.75)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
