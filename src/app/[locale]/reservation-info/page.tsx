import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n";
import { InfoShell } from "./_components";

export const metadata = {
  title: "예약 이용안내 · 건전한 레저",
  description: "건전한 레저 예약 고객을 위한 숙박 패키지와 당일 패키지 이용안내",
};

export default async function ReservationInfoIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <InfoShell
      locale={locale as Locale}
      eyebrow="RESERVATION INFO"
      title="예약 이용안내"
      description="예약하신 상품에 맞는 안내를 확인해 주세요."
    >
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <InfoLink href={`/${locale}/reservation-info/stay`} title="숙박 패키지 이용안내" description="객실, 입·퇴실, 숙박 고객 이용 안내" />
        <InfoLink href={`/${locale}/reservation-info/day-use`} title="당일 패키지 이용안내" description="당일 이용 흐름, 운영시간, 현장 안내" />
      </div>
    </InfoShell>
  );
}

function InfoLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-[#f7f7f7] p-5 text-black transition hover:bg-[#efefef]"
      style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "3px" }}
    >
      <h2 style={{ fontSize: "16px", fontWeight: 900 }}>{title}</h2>
      <p className="mt-2 text-black/65" style={{ fontSize: "13px", lineHeight: 1.7 }}>
        {description}
      </p>
      <span className="mt-4 inline-flex text-black" style={{ fontSize: "13px", fontWeight: 800 }}>
        확인하기 →
      </span>
    </Link>
  );
}
