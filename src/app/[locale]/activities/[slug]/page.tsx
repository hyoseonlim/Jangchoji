import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, locales, type Locale } from "@/i18n";
import { ActivityDetail } from "@/components/ActivityDetail";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const validSlugs = [
  "rides",
  "ski",
  "wakesurf",
  "waterpark",
  "bbq",
  "cafe",
  "rooftop",
  "stay",
] as const;
type Slug = (typeof validSlugs)[number];

function isSlug(s: string): s is Slug {
  return (validSlugs as readonly string[]).includes(s);
}

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const slug of validSlugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

// OG 이미지·canonical 을 홈과 동일하게 고정하여 검색엔진 이 페이지별 이미지 대신
// 통일된 브랜드 대표 이미지를 사용하도록 유도. 페이지 title/description 은 각 활동 컨텐츠 기반.
const OG_IMAGE_PATH = "/images/main.png";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isSlug(slug)) return {};
  const dict = getDictionary(locale as Locale);
  const content = dict.detailPages.items[slug];
  const siteName = dict.meta.siteName;
  const pageTitle = `${content.title} · ${siteName}`;
  const pageDescription = content.intro;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: `/${locale}/activities/${slug}`,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: OG_IMAGE_PATH,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: dict.meta.ogTitle,
        },
      ],
    },
    twitter: {
      title: pageTitle,
      description: pageDescription,
      images: [OG_IMAGE_PATH],
    },
  };
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isSlug(slug)) notFound();
  const dict = getDictionary(locale as Locale);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation dict={dict} locale={locale as Locale} />
      <main className="flex-1">
        <ActivityDetail slug={slug} dict={dict} locale={locale} />
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </div>
  );
}
