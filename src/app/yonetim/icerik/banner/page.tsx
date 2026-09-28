import type { Metadata } from "next";
import Link from "next/link";
import { BannerType } from "@/generated/prisma/client";
import { AdminContentTable, type AdminContentTableRow } from "@/components/admin/admin-content-table";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { listBannersByType } from "@/server/repositories/banner-repository";

export const metadata: Metadata = { title: "Banner Yönetimi" };

export default async function AdminBannerListPage() {
  await requireRole("ADMIN", "/yonetim/icerik/banner");
  const banners = await listBannersByType(BannerType.FULL_WIDTH);

  const rows: AdminContentTableRow[] = banners.map((banner) => ({
    id: banner.id,
    imageUrl: banner.imageUrl,
    imageAlt: banner.imageAlt ?? banner.title,
    title: banner.title,
    isActive: banner.isActive,
    sortOrder: banner.sortOrder,
    editHref: `/yonetim/icerik/banner/${banner.id}`,
  }));

  return (
    <PageContainer maxWidthClassName="max-w-[900px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/anasayfa" className="text-brand w-fit text-xs font-semibold">
          ← Anasayfa Yönetimi
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Banner Yönetimi</h1>
          <Link
            href="/yonetim/icerik/banner/yeni"
            className="bg-brand hover:bg-brand-dark min-h-10 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
          >
            Yeni Banner
          </Link>
        </div>
        <p className="text-foreground/60 text-sm">En düşük sıradaki aktif banner ana sayfada gösterilir.</p>
      </div>

      <AdminContentTable rows={rows} emptyMessage="Henüz banner yok." />
    </PageContainer>
  );
}
