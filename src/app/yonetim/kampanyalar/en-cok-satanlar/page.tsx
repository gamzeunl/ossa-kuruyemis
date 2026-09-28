import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { formatPrice } from "@/lib/format-money";
import { requireRole } from "@/server/auth/guard";
import { getBestSellingProductsWithQuantity } from "@/server/services/catalog-service";
import { getCategoryNamesByProductIds } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "En Çok Satanlar" };

const LIMIT = 50;

export default async function AdminBestSellersPage() {
  await requireRole("ADMIN", "/yonetim/kampanyalar/en-cok-satanlar");

  const rows = await getBestSellingProductsWithQuantity(LIMIT);
  const categoryByProductId = await getCategoryNamesByProductIds(rows.map((row) => row.product.id));

  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar" className="text-brand w-fit text-xs font-semibold">
          ← Kampanyalar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">En Çok Satanlar</h1>
        <p className="text-foreground/60 text-sm">
          Salt-okunur — son 90 gün, gerçek tamamlanmış sipariş verisinden (en az 3 adet). Yönetici bu listeyi
          elle değiştiremez.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="border-border-muted text-foreground/60 rounded-xl border p-8 text-center text-sm">
          Son 90 günde eşiği aşan bir satış yok.
        </div>
      ) : (
        <div className="border-border-muted overflow-x-auto rounded-xl border">
          <table className="w-full min-w-150 text-left text-sm">
            <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Ürün</th>
                <th className="px-4 py-3 font-semibold">Son 90 Gün Satılan Adet</th>
                <th className="px-4 py-3 font-semibold">Fiyat</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {rows.map(({ product, unitsSold }) => (
                <tr key={product.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">{unitsSold}</td>
                  <td className="px-4 py-3">{product.minPrice ? formatPrice(product.minPrice) : "—"}</td>
                  <td className="px-4 py-3">{categoryByProductId.get(product.id) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
