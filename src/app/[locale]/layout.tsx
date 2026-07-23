import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, locales, type Locale } from "@/i18n";
import "../globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-noto-sans-kr",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00C2D1",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// OG 이미지 (네이버/카톡/페이스북 등 공유 시 노출). 절대 URL 로 노출되도록
// metadataBase 를 설정하면 아래 상대경로가 자동으로 절대 URL 로 확장됩니다.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const OG_IMAGE_PATH = "/images/main.png";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const altLanguages: Record<string, string> = {};
  for (const l of locales) altLanguages[l] = `/${l}`;

  const ogImage = {
    url: OG_IMAGE_PATH,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: dict.meta.ogTitle,
  };

  return {
    metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: altLanguages,
    },
    openGraph: {
      type: "website",
      siteName: dict.meta.siteName,
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      locale: locale === "ko" ? "ko_KR" : "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      images: [OG_IMAGE_PATH],
    },
    other: {
      "itemprop:name": dict.meta.siteName,
      "itemprop:telephone": `+82-${dict.brand.phone.replace(/^0/, "")}`,
      "itemprop:postalCode": dict.brand.address.postalCode,
      "itemprop:addressCountry": "KR",
    },
  };
}

function buildLocalBusinessJsonLd(dict: ReturnType<typeof getDictionary>) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: dict.meta.siteName,
    alternateName: ["Water leisure", "건전한 레저"],
    description: dict.meta.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: dict.brand.address.road,
      addressLocality: "Gapyeong",
      addressRegion: dict.locale === "ko" ? "경기도" : "Gyeonggi-do",
      postalCode: dict.brand.address.postalCode,
      addressCountry: "KR",
    },
    telephone: `+82-${dict.brand.phone.replace(/^0/, "")}`,
    priceRange: "₩10,000 - ₩159,000",
    areaServed: dict.locale === "ko" ? "가평" : "Gapyeong",
    sameAs: [
      "https://www.youtube.com/@JangchojiTV/videos",
      "https://m.blog.naver.com/yeji0109-",
      "https://www.instagram.com/mad.water.ski/",
      "https://smartstore.naver.com/madski",
    ],
  };
}

function buildFaqJsonLd(dict: ReturnType<typeof getDictionary>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: dict.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale as Locale);
  const localBusiness = buildLocalBusinessJsonLd(dict);
  const faq = buildFaqJsonLd(dict);

  return (
    <html lang={dict.htmlLang} className={`${notoSansKR.variable} ${inter.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
        />
        {children}
      </body>
    </html>
  );
}
