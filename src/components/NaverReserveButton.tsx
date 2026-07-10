import { twMerge } from "tailwind-merge";

const NAVER_STORE_URL =
  "https://smartstore.naver.com/madski/products/11804623124";

type Size = "sm" | "md" | "lg";

const sizes: Record<
  Size,
  {
    padding: string;
    fontSize: string;
    chipPx: number;
    chipFontSize: string;
    gap: string;
    radius: string;
  }
> = {
  sm: {
    padding: "px-5 py-2",
    fontSize: "14px",
    chipPx: 16,
    chipFontSize: "10px",
    gap: "gap-1.5",
    radius: "2px",
  },
  md: {
    padding: "py-3 px-4",
    fontSize: "14px",
    chipPx: 16,
    chipFontSize: "10px",
    gap: "gap-2",
    radius: "2px",
  },
  lg: {
    padding: "px-8 py-4",
    fontSize: "16px",
    chipPx: 20,
    chipFontSize: "12px",
    gap: "gap-2",
    radius: "3px",
  },
};

export function NaverReserveButton({
  label,
  size = "md",
  fullWidth = false,
  className = "",
  onClick,
}: {
  label: string;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const cfg = sizes[size];
  const layout = fullWidth
    ? `flex items-center justify-center ${cfg.gap}`
    : `inline-flex items-center ${cfg.gap}`;
  return (
    <a
      href={NAVER_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={twMerge(
        `${layout} ${cfg.padding} text-white font-bold transition-opacity hover:opacity-90`,
        className,
      )}
      style={{
        backgroundColor: "#03C75A",
        fontSize: cfg.fontSize,
        borderRadius: cfg.radius,
      }}
    >
      <span
        className="inline-flex items-center justify-center flex-shrink-0"
        style={{
          width: `${cfg.chipPx}px`,
          height: `${cfg.chipPx}px`,
          backgroundColor: "#fff",
          color: "#03C75A",
          fontSize: cfg.chipFontSize,
          fontWeight: 900,
          borderRadius: "2px",
        }}
        aria-hidden="true"
      >
        N
      </span>
      {label}
    </a>
  );
}
