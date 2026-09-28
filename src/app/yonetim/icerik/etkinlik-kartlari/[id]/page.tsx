import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEventCardAction } from "@/actions/admin-event-cards";
import { ContentDeleteForm } from "@/components/admin/content-delete-form";
import { EventCardAdminForm, type EventCardAdminFormValues } from "@/components/admin/event-card-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { findEventCardById } from "@/server/repositories/event-card-repository";

export const metadata: Metadata = { title: "Etkinlik Kartını Düzenle" };

export default async function AdminEditEventCardPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "/yonetim/icerik/etkinlik-kartlari");
  const { id } = await params;
  const card = await findEventCardById(id);

  if (!card) {
    notFound();
  }

  const initialValues: EventCardAdminFormValues = {
    title: card.title,
    description: card.description,
    imageUrl: card.imageUrl,
    imageAlt: card.imageAlt ?? "",
    buttonLabel: card.buttonLabel,
    buttonHref: card.buttonHref,
    isActive: card.isActive,
    sortOrder: card.sortOrder,
  };

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/icerik/etkinlik-kartlari" className="text-brand w-fit text-xs font-semibold">
          ← Etkinlik Kartları Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{card.title}</h1>
      </div>

      <EventCardAdminForm cardId={card.id} initialValues={initialValues} />

      <div className="border-border-muted border-t pt-6">
        <ContentDeleteForm
          action={deleteEventCardAction.bind(null, card.id)}
          confirmMessage="Bu etkinlik kartını silmek istediğinize emin misiniz?"
        />
      </div>
    </PageContainer>
  );
}
