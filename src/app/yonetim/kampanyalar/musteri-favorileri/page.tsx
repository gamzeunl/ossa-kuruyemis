import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { formatPrice } from "@/lib/format-money";
import { requireRole } from "@/server/auth/guard";
import { getMostFavoritedProducts } from "@/server/services/catalog-service";
import { getCategoryNamesByProductIds } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Müşterilerin Favorileri" };

const LIMIT = 50;

export default async function AdminMostFavoritedProductsPage() {
  await requireRole("ADMIN", "/yonetim/kampanyalar/musteri-favorileri");

  const rows = await getMostFavoritedProducts(LIMIT);
  const categoryByProductId = await getCategoryNamesByProductIds(rows.map((row) => row.product.id));

  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar" className="text-brand w-fit text-xs font-semibold">
          ← Kampanyalar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Müşterilerin Favorileri</h1>
        <p className="text-foreground/60 text-sm">
          Salt-okunur — gerçek <code>Favorite</code> tablosundan, favori sayısına göre azalan sırayla. Sahte
          minimum eşik yoktur.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="border-border-muted text-foreground/60 rounded-xl border p-8 text-center text-sm">
          Henüz hiçbir üründe favori kaydı yok.
        </div>
      ) : (
        <div className="border-border-muted overflow-x-auto rounded-xl border">
          <table className="w-full min-w-175 text-left text-sm">
            <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Ürün</th>
                <th className="px-4 py-3 font-semibold">Favori Sayısı</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Fiyat</th>
                <th className="px-4 py-3 font-semibold">Aktif İndirim</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {rows.map(({ product, favoriteCount }) => (
                <tr key={product.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">{favoriteCount}</td>
                  <td className="px-4 py-3">{categoryByProductId.get(product.id) ?? "—"}</td>
                  <td className="px-4 py-3">{product.minPrice ? formatPrice(product.minPrice) : "—"}</td>
                  <td className="px-4 py-3">
                    {product.defaultVariant?.hasActiveDiscount
                      ? `%${product.defaultVariant.discountPercentage ?? ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/urunler/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand font-semibold underline underline-offset-2"
                    >
                      Ürünü Gör
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
