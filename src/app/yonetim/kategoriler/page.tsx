import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { ProductImage } from "@/components/catalog/product-image";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { listCategoriesForAdmin } from "@/server/repositories/category-repository";

export const metadata: Metadata = { title: "Kategori Yönetimi" };

export default async function AdminCategoriesListPage() {
  await requireRole("ADMIN", "/yonetim/kategoriler");
  const categories = await listCategoriesForAdmin();

  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim" className="text-brand w-fit text-xs font-semibold">
          ← Yönetim
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Kategori Yönetimi</h1>
          <Link
            href="/yonetim/kategoriler/yeni"
            className="bg-brand hover:bg-brand-dark min-h-10 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
          >
            Yeni Kategori
          </Link>
        </div>
        <p className="text-foreground/60 text-sm">{categories.length} kategori</p>
      </div>

      {categories.length === 0 ? (
        <div role="status" className="border-border-muted text-foreground/60 rounded-md border p-8 text-center text-sm">
          Henüz kategori yok.
        </div>
      ) : (
        <div className="border-border-muted overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Görsel</th>
                <th className="px-4 py-3 font-semibold">Ad</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Sıra</th>
                <th className="px-4 py-3 font-semibold">Ürün Sayısı</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <div className="bg-surface-muted relative h-10 w-10 overflow-hidden rounded-lg">
                      <ProductImage
                        src={category.imageUrl}
                        alt={category.imageAlt ?? category.name}
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="text-foreground/60 px-4 py-3">{category.slug}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={category.isActive ? "Aktif" : "Pasif"} tone={category.isActive ? "success" : "neutral"} />
                  </td>
                  <td className="px-4 py-3">{category.sortOrder}</td>
                  <td className="px-4 py-3">{category._count.productCategories}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/yonetim/kategoriler/${category.id}`}
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
