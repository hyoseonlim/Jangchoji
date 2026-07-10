"use client";

import Link from "next/link";
import type { Dictionary, Locale } from "@/i18n";
import { locales } from "@/i18n/config";

export function LanguageSwitcher({
  dict,
  locale,
  variant = "dark",
}: {
  dict: Dictionary;
  locale: Locale;
  variant?: "dark" | "light";
}) {
  const isDark = variant === "dark";
  const activeBg = isDark ? "#ffffff" : "#111111";
  const activeFg = isDark ? "#111111" : "#ffffff";
  const idleFg = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const borderColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";

  return (
    <div
      role="group"
      aria-label={dict.languageSwitcher.ariaLabel}
      className="inline-flex items-center"
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: "2px",
        padding: "2px",
      }}
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={`/${l}`}
            aria-current={active ? "page" : undefined}
            aria-label={
              active
                ? `${dict.languageSwitcher.ariaCurrent}: ${dict.languageSwitcher[l]}`
                : dict.languageSwitcher[l]
            }
            className="px-2 py-1 transition-colors"
            style={{
              backgroundColor: active ? activeBg : "transparent",
              color: active ? activeFg : idleFg,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              borderRadius: "2px",
            }}
          >
            {l.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
