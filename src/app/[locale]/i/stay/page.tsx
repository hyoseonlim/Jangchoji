import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/i18n";
import {
  CommonUseSection,
  ContactSection,
  InfoBlock,
  InfoSection,
  InfoShell,
  OperatingHoursSection,
  Row,
} from "../../reservation-info/_components";

export const metadata = {
  title: "숙박 패키지 이용안내 · 건전한 레저",
  description: "건전한 레저 숙박 패키지 예약 고객을 위한 이용 정보 안내",
};

const roomItems = [
  "간단한 취사도구, 전자레인지, 냉장고가 구비되어 있습니다.",
  "밥솥과 물컵은 제공되지 않습니다.",
  "세면도구(칫솔, 치약, 수건 등)는 개별 준비해 주세요.",
];

export default async function StayInfoShortLinkPage({
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
      eyebrow="STAY PACKAGE"
      title="숙박 패키지 이용안내"
      description="예약해 주셔서 감사합니다. 숙박 패키지 이용 정보를 안내드립니다."
      homeLinkPosition="bottom"
    >
      <InfoSection title="객실 안내">
        <InfoBlock title="객실 비품">
          <ul className="space-y-2">
            {roomItems.map((item) => (
              <li key={item} className="pl-3 text-black/75" style={{ borderLeft: "2px solid #00C2D1" }}>
                {item}
              </li>
            ))}
          </ul>
        </InfoBlock>
      </InfoSection>

      <InfoSection title="입·퇴실 안내">
        <dl className="space-y-2">
          <Row k="입실" v="오후 3:00" />
          <Row k="퇴실" v="오전 11:00" />
        </dl>
        <p className="mt-3 text-black/70">
          입실 전과 퇴실 후에도 워터파크 및 수상레저 이용이 가능합니다.
        </p>
      </InfoSection>

      <OperatingHoursSection />
      <CommonUseSection />
      <ContactSection address={dict.brand.address.road} phone={dict.brand.phone} />
    </InfoShell>
  );
}
