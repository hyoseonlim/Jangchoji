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
} from "../_components";

export const metadata = {
  title: "숙박 패키지 이용안내 · 건전한 레저",
  description: "건전한 레저 숙박 패키지 예약 고객을 위한 객실, 입퇴실, 운영시간 안내",
};

const roomItems = [
  "간단한 취사도구, 전자레인지, 냉장고가 구비되어 있습니다.",
  "밥솥과 물컵은 제공되지 않습니다.",
  "세면도구 및 샤워용품은 구비되어 있지 않으니 개별 지참 부탁드립니다. (수건은 제공)",
  "필요 시 매점에서도 샤워용품을 판매하고 있습니다. (각 1,000원)",
];

export default async function StayReservationInfoPage({
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
      description="숙박 패키지를 예약하신 고객님은 객실 준비물과 입·퇴실 시간을 함께 확인해 주세요."
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
