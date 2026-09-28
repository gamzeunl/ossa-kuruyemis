import type { Metadata } from "next";
import Link from "next/link";
import { AdminContentTable, type AdminContentTableRow } from "@/components/admin/admin-content-table";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { listInstagramPostsForAdmin } from "@/server/repositories/instagram-post-repository";

export const metadata: Metadata = { title: "Instagram Vitrini Yönetimi" };

export default async function AdminInstagramListPage() {
  await requireRole("ADMIN", "/yonetim/instagram");
  const posts = await listInstagramPostsForAdmin();

  const rows: AdminContentTableRow[] = posts.map((post) => ({
    id: post.id,
    // Artık hiçbir görsel/video OSSA'ya yüklenmiyor — tablo önizlemesi her zaman
    // mevcut ikon fallback'ine düşer (gerçek içerik storefront'ta Instagram'ın
    // kendi embed'inden gelir).
    imageUrl: null,
    imageAlt: post.caption ?? "Instagram gönderisi",
    title: post.caption ?? post.postUrl,
    isActive: post.isActive,
    sortOrder: post.sortOrder,
    editHref: `/yonetim/instagram/${post.id}`,
  }));

  return (
    <PageContainer maxWidthClassName="max-w-[900px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/anasayfa" className="text-brand w-fit text-xs font-semibold">
          ← Anasayfa Yönetimi
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Instagram Vitrini Yönetimi</h1>
          <Link
            href="/yonetim/instagram/yeni"
            className="bg-brand hover:bg-brand-dark min-h-10 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
          >
            Yeni Gönderi
          </Link>
        </div>
        <p className="text-foreground/60 text-sm">
          Ana sayfada ilk 4 aktif gönderi gösterilir. Yalnızca gönderi linki eklenir — kaydedildiğinde gerçek
          medya Instagram API&apos;den otomatik çözülür, hiçbir dosya OSSA&apos;ya yüklenmez.
        </p>
      </div>

      <AdminContentTable rows={rows} emptyMessage="Henüz Instagram gönderisi yok." />
    </PageContainer>
  );
}
