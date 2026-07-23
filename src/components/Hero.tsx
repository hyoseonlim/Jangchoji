"use client";

import { useEffect, useRef, useState } from "react";
import { PlayIcon, InstagramIcon } from "lucide-react";
import type { Dictionary, Locale } from "@/i18n";
import { ReserveButton } from "./ReserveButton";

const skiImage = "/images/ski.png";
const boardImage = "/images/board.png";

type ChipItem = { text: string; href: string };

function CategoryRow({ label, items }: { label: string; items: readonly ChipItem[] }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <span
          className="w-6 h-px"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          aria-hidden="true"
        />
        <span
          className="text-black/50 tracking-[0.3em] uppercase"
          style={{ fontSize: "10px", fontWeight: 700 }}
        >
          {label}
        </span>
        <span
          className="w-6 h-px"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          aria-hidden="true"
        />
      </div>
      <ul className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        {items.map((item) => (
          <li key={item.text}>
            <a
              href={item.href}
              className="inline-block px-2.5 py-1 text-black/80 hover:text-black transition-colors"
              style={{
                border: "1px solid rgba(0,0,0,0.2)",
                fontSize: "11px",
                fontWeight: 500,
                borderRadius: "999px",
                backgroundColor: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(4px)",
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [settled, setSettled] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    if (mq.matches) {
      setSettled(true);
      return;
    }
    const t = setTimeout(() => setSettled(true), 180);
    return () => clearTimeout(t);
  }, []);

  const skierStyle: React.CSSProperties = {
    transform: (!reducedMotionRef.current && !settled) ? "translateX(-110vw)" : "translateX(0)",
    transition: settled ? "transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
  };

  const boarderStyle: React.CSSProperties = {
    transform: (!reducedMotionRef.current && !settled) ? "translateX(110vw)" : "translateX(0)",
    transition: settled ? "transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
  };

  return (
    <section
      id="home"
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#ffffff",
        minHeight: "100svh",
        paddingTop: "64px",
      }}
    >
      {/* Subtle gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,194,209,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Hero text — z-10 so it stays above silhouettes */}
      <div className="relative z-10 text-center px-6 py-8 w-full max-w-4xl">
        <h1
          className="text-black"
          style={{
            fontSize: "clamp(32px, 9vw, 96px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
          }}
        >
          {dict.hero.title}
        </h1>

        <p
          className="text-black/60 mt-3 tracking-[0.2em]"
          style={{ fontSize: "clamp(11px, 2vw, 14px)", fontWeight: 600 }}
        >
          {dict.hero.tag}
        </p>

        {/* Mobile-only silhouettes above hook line — slide in from both sides */}
        <div
          className="md:hidden mt-2 flex items-end justify-center gap-3 overflow-hidden"
          aria-hidden="true"
        >
          <img
            src={skiImage}
            alt=""
            style={{
              width: "44%",
              height: "auto",
              display: "block",
              ...skierStyle,
            }}
          />
          <img
            src={boardImage}
            alt=""
            style={{
              width: "44%",
              height: "auto",
              display: "block",
              ...boarderStyle,
            }}
          />
        </div>

        {/* Hook line */}
        <div className="mt-4 md:mt-8">
          <p
            className="text-black"
            style={{
              fontSize: "clamp(14px, 3.4vw, 26px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.35,
            }}
          >
            {dict.hero.hook}
          </p>
        </div>

        {/* Category chips — 2-col on mobile (Activities | Relax & Dine), stacked on sm+ */}
        <div className="mt-4 md:mt-10 grid grid-cols-2 gap-4 sm:block sm:space-y-5">
          <CategoryRow label={dict.hero.activitiesLabel} items={dict.hero.activitiesItems} />
          <CategoryRow label={dict.hero.relaxDineLabel} items={dict.hero.relaxDineItems} />
        </div>

        {/* Social channels (compact row above the secondary CTA) */}
        <div className="mt-5 md:mt-8 flex items-center justify-center gap-3">
          <a
            href="https://www.youtube.com/@JangchojiTV/videos"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={dict.footer.socialAria.youtube}
            className="inline-flex items-center justify-center transition-transform hover:scale-110"
            style={{
              width: "26px",
              height: "26px",
              backgroundColor: "#FF0000",
              color: "#fff",
              borderRadius: "6px",
            }}
          >
            <PlayIcon
              size={12}
              strokeWidth={0}
              fill="currentColor"
              style={{ marginLeft: "1px" }}
              aria-hidden="true"
            />
          </a>
          <a
            href="https://m.blog.naver.com/yeji0109-?tab=1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={dict.footer.socialAria.blog}
            className="inline-flex items-center justify-center transition-transform hover:scale-110"
            style={{
              width: "26px",
              height: "26px",
              backgroundColor: "#03C75A",
              color: "#fff",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            B
          </a>
          <a
            href="https://www.instagram.com/mad.water.ski/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={dict.footer.socialAria.instagram}
            className="inline-flex items-center justify-center transition-transform hover:scale-110"
            style={{
              width: "26px",
              height: "26px",
              background:
                "linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)",
              color: "#fff",
              borderRadius: "4px",
            }}
          >
            <InstagramIcon size={15} strokeWidth={2.2} />
          </a>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2 items-center justify-center">
          <ReserveButton
            label={dict.hero.ctaPrimary}
            size="md"
            locale={locale}
            className="hidden md:inline-flex transition-transform hover:scale-[1.02] active:scale-[0.98]"
          />
          <a
            href="#activities"
            className="inline-flex items-center justify-center px-5 py-2.5 text-black border border-black/25 hover:border-black/50 transition-colors"
            style={{ fontSize: "14px", fontWeight: 700, borderRadius: "2px", letterSpacing: "-0.01em" }}
          >
            {dict.hero.ctaSecondary}
          </a>
        </div>
      </div>

      {/* Water skier — slides in from LEFT, settles at bottom-left (desktop only) */}
      <div
        className="hero-silhouette hidden md:block absolute bottom-0 left-0 pointer-events-none"
        style={skierStyle}
        aria-hidden="true"
      >
        <img
          src={skiImage}
          alt=""
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      </div>

      {/* Wakeboarder — slides in from RIGHT, settles at bottom-right (desktop only) */}
      <div
        className="hero-silhouette hidden md:block absolute bottom-0 right-0 pointer-events-none"
        style={boarderStyle}
        aria-hidden="true"
      >
        <img
          src={boardImage}
          alt=""
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2">
        <span className="text-black/40" style={{ fontSize: "11px", letterSpacing: "0.2em" }}>
          {dict.hero.scroll}
        </span>
        <div
          className="w-px bg-black/20"
          style={{ height: "40px" }}
        >
          <div
            className="w-full bg-black/60"
            style={{
              height: "40%",
              animation: "scrollDot 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scrollDot {
          0% { transform: translateY(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(150%); opacity: 0; }
        }
        .hero-silhouette {
          width: min(38vw, 380px);
        }
      `}</style>
    </section>
  );
}
