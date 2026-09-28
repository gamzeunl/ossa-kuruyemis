import type { Metadata } from "next";
import Link from "next/link";
import { EventCardAdminForm, type EventCardAdminFormValues } from "@/components/admin/event-card-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Yeni Etkinlik Kartı" };

const EMPTY_VALUES: EventCardAdminFormValues = {
  title: "",
  description: "",
  imageUrl: null,
  imageAlt: "",
  buttonLabel: "İletişime Geç",
  buttonHref: "",
  isActive: true,
  sortOrder: 0,
};

export default async function AdminNewEventCardPage() {
  await requireRole("ADMIN", "/yonetim/icerik/etkinlik-kartlari");

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/icerik/etkinlik-kartlari" className="text-brand w-fit text-xs font-semibold">
          ← Etkinlik Kartları Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Etkinlik Kartı</h1>
      </div>

      <EventCardAdminForm initialValues={EMPTY_VALUES} />
    </PageContainer>
  );
}
