import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { listActivePackagePrices, listReservationsForAdmin } from "@/lib/reservations";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const admin = await getCurrentAdmin();
  if (!admin) redirect(`/${locale}/admin/login`);

  const [rows, packagePrices] = await Promise.all([
    listReservationsForAdmin({ mask: false }),
    listActivePackagePrices(),
  ]);

  return (
    <AdminDashboard
      admin={admin}
      initialRows={rows}
      packagePrices={packagePrices}
      locale={locale}
    />
  );
}
