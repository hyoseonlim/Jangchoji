import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/i18n";
import { ReserveForm } from "@/components/reserve/ReserveForm";
import { listActivePackagePrices } from "@/lib/reservations";

export const metadata = { title: "예약 · 건전한 레저" };
export const dynamic = "force-dynamic";

export default async function ReservePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale as Locale);
  const packagePrices = await listActivePackagePrices();

  return (
    <main style={{ backgroundColor: "#f7f7f7", minHeight: "100vh" }}>
      <ReserveForm dict={dict} locale={locale as Locale} packagePrices={packagePrices} />
    </main>
  );
}
