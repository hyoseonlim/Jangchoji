import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { listReservationsForAdmin } from "@/lib/reservations";
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

  const rows = await listReservationsForAdmin({ mask: false });

  return <AdminDashboard admin={admin} initialRows={rows} locale={locale} />;
}
