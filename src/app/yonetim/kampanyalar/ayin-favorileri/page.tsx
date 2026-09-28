import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { formatDate } from "@/lib/format-date";
import { requireRole } from "@/server/auth/guard";
import { listPicksForAdmin } from "@/server/repositories/featured-pick-repository";

export const metadata: Metadata = { title: "Ayın Favorileri" };

export default async function AdminFeaturedPicksPage() {
  await requireRole("ADMIN", "/yonetim/kampanyalar/ayin-favorileri");
  const picks = await listPicksForAdmin();

  return (
    <PageContainer maxWidthClassName="max-w-[900px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar" className="text-brand w-fit text-xs font-semibold">
          ← Kampanyalar
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Ayın Favorileri</h1>
          <Link
            href="/yonetim/kampanyalar/ayin-favorileri/yeni"
            className="bg-brand hover:bg-brand-dark min-h-10 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
          >
            Ürün Ekle
          </Link>
        </div>
        <p className="text-foreground/60 text-sm">
          Ana sayfa &quot;Ayın Favorileri&quot; vitrininde gösterilecek ürünler. Süresi dolan veya henüz
          başlamamış kayıtlar vitrinde otomatik olarak görünmez.
        </p>
      </div>

      {picks.length === 0 ? (
        <div className="border-border-muted text-foreground/60 rounded-xl border p-8 text-center text-sm">
          Henüz ürün eklenmedi.
        </div>
      ) : (
        <div className="border-border-muted overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Ürün</th>
                <th className="px-4 py-3 font-semibold">Sıra</th>
                <th className="px-4 py-3 font-semibold">Başlangıç</th>
                <th className="px-4 py-3 font-semibold">Bitiş</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {picks.map((pick) => (
                <tr key={pick.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium">{pick.product.name}</td>
                  <td className="px-4 py-3">{pick.sortOrder}</td>
                  <td className="px-4 py-3">{pick.startsAt ? formatDate(pick.startsAt) : "—"}</td>
                  <td className="px-4 py-3">{pick.endsAt ? formatDate(pick.endsAt) : "—"}</td>
                  <td className="px-4 py-3">{pick.isActive ? "Aktif" : "Pasif"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/yonetim/kampanyalar/ayin-favorileri/${pick.id}`}
                      className="text-brand font-semibold underline underline-offset-2"
                    >
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
