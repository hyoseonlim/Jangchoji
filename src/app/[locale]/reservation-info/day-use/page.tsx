import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/i18n";
import {
  CommonUseSection,
  ContactSection,
  InfoSection,
  InfoShell,
  OperatingHoursSection,
  Row,
} from "../_components";

export const metadata = {
  title: "당일 패키지 이용안내 · 건전한 레저",
  description: "건전한 레저 당일 패키지 예약 고객을 위한 현장 이용, 운영시간, 주소 안내",
};

const showerItems = [
  "샤워실은 무료로 이용하실 수 있습니다.",
  "세면도구 및 샤워용품은 개별 지참 부탁드립니다. (수건은 제공)",
  "필요 시 매점에서도 샤워용품을 판매하고 있습니다. (각 1,000원)",
];

export default async function DayUseReservationInfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale as Locale);

  return (
    <InfoShell
      locale={locale as Locale}
      eyebrow="DAY PACKAGE"
      title="당일 패키지 이용안내"
      description="당일 패키지를 예약하신 고객님은 이용일 도착 후 현장 안내에 따라 접수해 주세요."
    >
      <InfoSection title="이용 안내">
        <p className="text-black/75" style={{ lineHeight: 1.8 }}>
          예약하신 이용일에 현장 접수 후 워터파크 및 수상레저를 이용하실 수 있습니다.
          도착 후 직원 안내에 따라 이용권 확인과 안전 안내를 진행해 주세요.
        </p>
      </InfoSection>

      <InfoSection title="이용 시간">
        <dl className="space-y-2">
          <Row k="접수" v="예약 당일 현장 접수" />
          <Row k="이용" v="놀이기구 운영시간 내 이용" />
        </dl>
      </InfoSection>

      <InfoSection title="샤워실 안내">
        <ul className="space-y-2">
          {showerItems.map((item) => (
            <li key={item} className="pl-3 text-black/75" style={{ borderLeft: "2px solid #00C2D1" }}>
              {item}
            </li>
          ))}
        </ul>
      </InfoSection>

      <OperatingHoursSection />
      <CommonUseSection />
      <ContactSection address={dict.brand.address.road} phone={dict.brand.phone} />
    </InfoShell>
  );
}
