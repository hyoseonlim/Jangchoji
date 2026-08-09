import Link from "next/link";
import {
  ClockIcon,
  HomeIcon,
  InfoIcon,
  MapPinIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/i18n";

export const operatingHours = [
  {
    title: "성수기",
    period: "7월 17일 ~ 8월 16일",
    hours: "오전 9:00 ~ 오후 6:00",
  },
  {
    title: "비수기 평일",
    period: "월요일 ~ 금요일",
    hours: "오전 10:00 ~ 오후 6:00",
  },
  {
    title: "비수기 주말",
    period: "토요일 · 일요일 · 공휴일",
    hours: "오전 9:00 ~ 오후 6:00",
  },
];

export const commonItems = [
  "플라이피쉬는 놀이기구 패키지에 포함되지 않으며, 이용 시 1인 15,000원이 추가됩니다.",
  "추가 이용 요금은 현장에서 결제 가능합니다.",
  "안전한 이용을 위해 현장 안내와 안전수칙을 따라주세요.",
];

export function InfoShell({
  locale,
  eyebrow,
  title,
  description,
  homeLinkPosition = "top",
  children,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  description: string;
  homeLinkPosition?: "top" | "bottom";
  children: React.ReactNode;
}) {
  const homeLink = (
    <Link
      href={`/${locale}`}
      className="inline-flex text-black/60 hover:text-black"
      style={{ fontSize: "13px", fontWeight: 700 }}
    >
      ← 홈으로
    </Link>
  );

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-black">
      <section className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-16">
        {homeLinkPosition === "top" && homeLink}

        <div
          className={`${homeLinkPosition === "top" ? "mt-5" : ""} bg-white p-6 md:p-10`}
          style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "3px" }}
        >
          <p className="tracking-[0.15em] uppercase text-black/50" style={{ fontSize: "10px", fontWeight: 700 }}>
            {eyebrow}
          </p>
          <h1 className="mt-2 text-black" style={{ fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 900 }}>
            {title}
          </h1>
          <p className="mt-3 text-black/70" style={{ fontSize: "14px", lineHeight: 1.8 }}>
            {description}
          </p>
          {children}
          <div className="mt-8 border-t border-black/10 pt-5" style={{ fontSize: "14px", lineHeight: 1.8 }}>
            <p className="text-black" style={{ fontWeight: 800 }}>
              고객님의 즐겁고 안전한 추억을 위해
              <br />
              최선을 다해 준비하겠습니다.
            </p>
            <p className="mt-3 text-black/55" style={{ fontSize: "13px", fontWeight: 600 }}>
              건전한레저 대표 장우진 드림
            </p>
          </div>
          {homeLinkPosition === "bottom" && (
            <div className="mt-5">
              {homeLink}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const Icon = iconForSection(title);

  return (
    <section className="mt-8 border-t border-black/10 pt-6">
      <h2 className="flex items-center gap-2 text-black" style={{ fontSize: "18px", fontWeight: 900 }}>
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center bg-[#E9FBFC] text-[#008C96]"
          style={{ border: "1px solid rgba(0,194,209,0.28)", borderRadius: "3px" }}
          aria-hidden="true"
        >
          <Icon size={17} strokeWidth={2.2} />
        </span>
        {title}
      </h2>
      <div className="mt-4" style={{ fontSize: "14px", lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  );
}

function iconForSection(title: string): LucideIcon {
  if (title.includes("객실")) return HomeIcon;
  if (title.includes("입") || title.includes("시간") || title.includes("운영")) return ClockIcon;
  if (title.includes("오시는")) return MapPinIcon;
  if (title.includes("공통") || title.includes("안전")) return ShieldCheckIcon;
  return InfoIcon;
}

export function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <h3 className="mb-2 text-black/80" style={{ fontSize: "14px", fontWeight: 800 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3">
      <dt className="text-black/50" style={{ fontWeight: 700 }}>
        {k}
      </dt>
      <dd className="text-black/80">{v}</dd>
    </div>
  );
}

export function OperatingHoursSection() {
  return (
    <InfoSection title="놀이기구 운영시간">
      <div className="grid gap-3 md:grid-cols-3">
        {operatingHours.map((item) => (
          <article key={item.title} className="bg-[#f7f7f7] p-4" style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "3px" }}>
            <h3 className="text-black" style={{ fontSize: "14px", fontWeight: 900 }}>
              {item.title}
            </h3>
            <p className="mt-1 text-black/50" style={{ fontSize: "12px" }}>
              {item.period}
            </p>
            <p className="mt-3 text-black" style={{ fontSize: "14px", fontWeight: 800 }}>
              {item.hours}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-black/65" style={{ fontSize: "13px" }}>
        점심시간은 모든 기간 공통으로 오후 1:00 ~ 2:00입니다.
      </p>
    </InfoSection>
  );
}

export function CommonUseSection() {
  return (
    <InfoSection title="공통 이용 안내">
      <ul className="space-y-2">
        {commonItems.map((item) => (
          <li key={item} className="pl-3 text-black/75" style={{ borderLeft: "2px solid #00C2D1" }}>
            {item}
          </li>
        ))}
      </ul>
    </InfoSection>
  );
}

export function ContactSection({
  address,
  phone,
}: {
  address: string;
  phone: string;
}) {
  return (
    <InfoSection title="오시는 길">
      <dl className="space-y-2">
        <Row k="주소" v={address} />
        <Row
          k="문의"
          v={
            <a href={`tel:${phone}`} className="text-black underline underline-offset-4">
              {phone}
            </a>
          }
        />
      </dl>
    </InfoSection>
  );
}
