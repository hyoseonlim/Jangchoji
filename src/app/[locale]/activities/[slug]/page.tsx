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
