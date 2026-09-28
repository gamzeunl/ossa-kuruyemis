import type { Metadata } from "next";
import Link from "next/link";
import { AdminContentTable, type AdminContentTableRow } from "@/components/admin/admin-content-table";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { listEventCards } from "@/server/repositories/event-card-repository";

export const metadata: Metadata = { title: "Etkinlik Kartları Yönetimi" };

export default async function AdminEventCardListPage() {
  await requireRole("ADMIN", "/yonetim/icerik/etkinlik-kartlari");
  const cards = await listEventCards();

  const rows: AdminContentTableRow[] = cards.map((card) => ({
    id: card.id,
    imageUrl: card.imageUrl,
    imageAlt: card.imageAlt ?? card.title,
    title: card.title,
    isActive: card.isActive,
    sortOrder: card.sortOrder,
    editHref: `/yonetim/icerik/etkinlik-kartlari/${card.id}`,
  }));

  return (
    <PageContainer maxWidthClassName="max-w-[900px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/anasayfa" className="text-brand w-fit text-xs font-semibold">
          ← Anasayfa Yönetimi
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Etkinlik Kartları Yönetimi</h1>
          <Link
            href="/yonetim/icerik/etkinlik-kartlari/yeni"
            className="bg-brand hover:bg-brand-dark min-h-10 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
          >
            Yeni Kart
          </Link>
        </div>
        <p className="text-foreground/60 text-sm">
          Ana sayfada &ldquo;Kına ve Düğün Çerezleri&rdquo; bölümünde aktif kartlardan sıraya göre ilk 2&apos;si gösterilir.
        </p>
      </div>

      <AdminContentTable rows={rows} emptyMessage="Henüz etkinlik kartı yok." />
    </PageContainer>
  );
}
