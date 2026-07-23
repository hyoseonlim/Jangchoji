"use client";

import { useState } from "react";

// 계좌번호 · 예금주 표시 + 클릭 시 계좌번호 클립보드 복사.
// theme = "light" (기본) | "dark" (예약 완료 다크 배경용)
export function CopyableAccount({
  bankLabel,
  account,
  holderPrefix,
  holder,
  theme = "light",
}: {
  bankLabel: string;
  account: string;
  holderPrefix: string;
  holder: string;
  theme?: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);

  const displayAccount = account;
  const copyValue = account.replace(/-/g, "");

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyValue);
      } else {
        const ta = document.createElement("textarea");
        ta.value = copyValue;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // no-op
    }
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${bankLabel} ${displayAccount} 계좌번호 복사`}
      className="inline-flex items-center gap-1.5 group"
      style={{
        padding: "6px 10px",
        border: isDark
          ? "1px solid rgba(0,194,209,0.35)"
          : "1px solid rgba(0,0,0,0.15)",
        backgroundColor: isDark ? "rgba(0,194,209,0.08)" : "#fff",
        borderRadius: "2px",
        fontSize: "13px",
        lineHeight: 1.4,
        cursor: "pointer",
        color: isDark ? "#e6f9fb" : "#111",
        transition: "background-color 120ms",
      }}
    >
      <span style={{ fontWeight: 700 }}>{bankLabel}</span>
      <strong style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>{displayAccount}</strong>
      <span style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)" }}>
        · {holderPrefix} {holder}
      </span>
      <span
        aria-hidden="true"
        style={{
          marginLeft: "4px",
          fontSize: "11px",
          fontWeight: 700,
          color: copied ? "#00a86b" : isDark ? "#00d5e6" : "#009aa8",
          padding: "2px 6px",
          backgroundColor: copied
            ? "rgba(0,168,107,0.12)"
            : isDark
              ? "rgba(0,213,230,0.15)"
              : "rgba(0,194,209,0.12)",
          borderRadius: "2px",
          whiteSpace: "nowrap",
        }}
      >
        {copied ? "복사됨 ✓" : "복사"}
      </span>
    </button>
  );
}
