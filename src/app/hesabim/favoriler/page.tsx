import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { ProductListCard } from "@/components/catalog/product-list-card";
import { HeartIcon } from "@/components/ui/icons";
import { requireUser } from "@/server/auth/guard";
import { getUserFavoriteProducts } from "@/server/services/favorite-service";

export const metadata: Metadata = {
  title: "Favorilerim",
  description: "Favorilediğiniz ürünleri görüntüleyin.",
};

export default async function FavoritesPage() {
  const user = await requireUser("/hesabim/favoriler");
  const products = await getUserFavoriteProducts(user.id);

  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/hesabim" className="text-brand w-fit text-xs font-semibold">
          ← Hesabım
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Favorilerim</h1>
        <p className="text-foreground/60 text-sm">{products.length} favori ürün</p>
      </div>

      {products.length === 0 ? (
        <div className="border-border-muted bg-surface flex flex-col items-center gap-4 rounded-2xl border p-14 text-center shadow-sm">
          <span className="bg-surface-muted flex h-14 w-14 items-center justify-center rounded-full">
            <HeartIcon className="text-foreground/40 h-7 w-7" />
          </span>
          <p className="text-foreground/60 text-sm">Henüz favori ürününüz yok.</p>
          <Link
            href="/urunler"
            className="bg-brand text-brand-foreground hover:bg-brand-dark mt-1 inline-flex min-h-11 items-center justify-center rounded-full px-7 text-sm font-bold transition-colors"
          >
            Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductListCard key={product.id} product={product} isFavorited isLoggedIn />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
