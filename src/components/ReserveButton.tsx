import Link from "next/link";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/i18n";

type Size = "sm" | "md" | "lg";

// 사이트 전반의 CTA 스펙에 맞춰 통일 :
//   sm  → 네비게이션 우측 등 컴팩트 영역
//   md  → 표준 프라이머리 CTA (Hero · Footer · Safety 등)
//   lg  → 모바일 스티키 등 강조 필요한 위치
// 모든 사이즈 radius 2px, 폰트 무게 800 로 통일.
const sizes: Record<
  Size,
  { padding: string; fontSize: string; letterSpacing: string }
> = {
  sm: { padding: "px-4 py-2", fontSize: "13px", letterSpacing: "-0.01em" },
  md: { padding: "px-5 py-2.5", fontSize: "14px", letterSpacing: "-0.01em" },
  lg: { padding: "px-6 py-3.5", fontSize: "15px", letterSpacing: "-0.01em" },
};

export function ReserveButton({
  label,
  size = "md",
  fullWidth = false,
  locale,
  className = "",
}: {
  label: string;
  size?: Size;
  fullWidth?: boolean;
  locale: Locale;
  className?: string;
}) {
  const cfg = sizes[size];
  const layout = fullWidth
    ? "flex items-center justify-center"
    : "inline-flex items-center justify-center";
  return (
    <Link
      href={`/${locale}/reserve`}
      className={twMerge(
        `${layout} ${cfg.padding} font-bold transition-opacity hover:opacity-90`,
        className,
      )}
      style={{
        backgroundColor: "#00C2D1",
        color: "#001518",
        fontSize: cfg.fontSize,
        fontWeight: 800,
        letterSpacing: cfg.letterSpacing,
        borderRadius: "2px",
      }}
    >
      {label}
    </Link>
  );
}
