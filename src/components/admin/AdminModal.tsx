"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";

export type AdminModalVariant = "primary" | "danger";

export type AdminModalRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string; // 생략 시 alert 모드 (확인 버튼만)
  variant?: AdminModalVariant;
};

const primaryColors = { bg: "#00C2D1", fg: "#001518", border: "#00C2D1" };
const dangerColors = { bg: "#ff6b7a", fg: "#1a0002", border: "#ff6b7a" };

export function AdminModal({
  request,
  onConfirm,
  onCancel,
}: {
  request: AdminModalRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const open = request !== null;
  const cancelLabel = request?.cancelLabel;
  const colors = request?.variant === "danger" ? dangerColors : primaryColors;

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && open) onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 100,
          }}
        />
        <AlertDialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(92vw, 420px)",
            backgroundColor: "#14171c",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "4px",
            padding: "24px",
            zIndex: 101,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <AlertDialog.Title
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.01em",
              marginBottom: "8px",
            }}
          >
            {request?.title}
          </AlertDialog.Title>
          <AlertDialog.Description
            style={{
              fontSize: "13px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.75)",
              whiteSpace: "pre-line",
            }}
          >
            {request?.message}
          </AlertDialog.Description>

          <div
            className="mt-6 flex gap-2"
            style={{ flexDirection: "row-reverse" }}
          >
            <AlertDialog.Action
              onClick={onConfirm}
              style={{
                padding: "8px 16px",
                backgroundColor: colors.bg,
                color: colors.fg,
                border: `1px solid ${colors.border}`,
                borderRadius: "2px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {request?.confirmLabel}
            </AlertDialog.Action>
            {cancelLabel && (
              <AlertDialog.Cancel
                onClick={onCancel}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.75)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "2px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {cancelLabel}
              </AlertDialog.Cancel>
            )}
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
