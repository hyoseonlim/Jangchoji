import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/i18n";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Activities } from "@/components/Activities";
import { Rides } from "@/components/Rides";
import { Pricing } from "@/components/Pricing";
import { InfoGallery } from "@/components/InfoGallery";
import { Safety } from "@/components/Safety";
import { FAQSection } from "@/components/FAQSection";
import { MinorPolicy } from "@/components/MinorPolicy";
import { Channels } from "@/components/Channels";
import { Directions } from "@/components/Directions";
import { Footer } from "@/components/Footer";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale as Locale);

  return (
    <div className="min-h-screen">
      <Navigation dict={dict} locale={locale as Locale} />
      <main>
        <Hero dict={dict} />
        <Activities dict={dict} locale={locale as Locale} />
        <Rides dict={dict} />
        <Pricing dict={dict} />
        <InfoGallery dict={dict} />
        <Safety dict={dict} />
        <FAQSection dict={dict} />
        <MinorPolicy dict={dict} />
        <Channels dict={dict} />
        <Directions dict={dict} />
      </main>
      <Footer dict={dict} />
    </div>
  );
}
