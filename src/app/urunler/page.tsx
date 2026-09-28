import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCategoryDisplayDescription, getCategoryDisplayName } from "@/lib/category-display";
import { PageContainer } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { PillNav, type PillNavItem } from "@/components/catalog/pill-nav";
import { ProductFilters } from "@/components/catalog/product-filters";
import { ProductListCard } from "@/components/catalog/product-list-card";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SortDropdown } from "@/components/catalog/sort-dropdown";
import { listFavoritedProductIdSet } from "@/server/services/favorite-service";
import {
  getActiveCategories,
  getCategoryBySlug,
  getMarketingCampaignBasicById,
  listProducts,
} from "@/server/services/catalog-service";
import type { ProductSortOption } from "@/server/repositories/product-repository";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";

export const metadata: Metadata = {
  title: "Ürünler",
  description: "OSSA Kuruyemiş ürün kataloğunu inceleyin.",
};

const PAGE_SIZE = 12;

const SORT_PARAM_TO_OPTION: Record<string, ProductSortOption> = {
  "fiyat-artan": "price-asc",
  "fiyat-azalan": "price-desc",
  "a-z": "name-asc",
  "z-a": "name-desc",
  "en-yeniler": "newest",
};

function parsePage(value: string | undefined): number {
  const parsed = value ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function resolveSort(value: string | undefined): ProductSortOption {
  return (value && SORT_PARAM_TO_OPTION[value]) || "default";
}

function buildUrl(params: {
  kategori?: string;
  sayfa?: number;
  ara?: string;
  sirala?: string;
  kampanya?: string;
}): string {
  const search = new URLSearchParams();
  if (params.kategori) {
    search.set("kategori", params.kategori);
  }
  if (params.kampanya) {
    search.set("kampanya", params.kampanya);
  }
  if (params.ara) {
    search.set("ara", params.ara);
  }
  if (params.sirala) {
    search.set("sirala", params.sirala);
  }
  if (params.sayfa && params.sayfa > 1) {
    search.set("sayfa", String(params.sayfa));
  }
  const query = search.toString();
  return query ? `/urunler?${query}` : "/urunler";
}

export default async function UrunlerPage({
  searchParams,
}: {
  searchParams: Promise<{
    kategori?: string;
    sayfa?: string;
    ara?: string;
    sirala?: string;
    kampanya?: string;
  }>;
}) {
  const { kategori, sayfa, ara, sirala, kampanya } = await searchParams;
  const page = parsePage(sayfa);
  const query = ara?.trim() || undefined;
  const sort = resolveSort(sirala);

  const [categories, activeCategory, activeCampaign] = await Promise.all([
    getActiveCategories(),
    kategori ? getCategoryBySlug(kategori) : Promise.resolve(null),
    kampanya ? getMarketingCampaignBasicById(kampanya) : Promise.resolve(null),
  ]);

  const categoryNotFound = Boolean(kategori) && !activeCategory;
  // Mega menü/anasayfa ile tutarlı olacak şekilde, arama boş-durum önerilerinde
  // yalnızca gerçek "ana" kategoriler gösterilir (kampanyalı paketler hariç).
  const mainCategories = categories.filter((category) => category.slug !== "kampanyali-paketler");

  // Mobil kategori pill nav'ı — `ProductFilters`'ın sol panelindeki kategori
  // linkleriyle AYNI hedefe gitmiyor: burada sayfa değişmeden `kategori` query'si
  // güncellenir, `sirala`/`ara` korunur (backend zaten ikisini birlikte destekliyor).
  const categoryPillItems: PillNavItem[] = [
    { key: "all", label: "Tüm Ürünler", href: buildUrl({ ara: query, sirala }), active: !kategori },
    ...mainCategories.map((category) => ({
      key: category.slug,
      label: getCategoryDisplayName(category),
      href: buildUrl({ kategori: category.slug, ara: query, sirala }),
      active: category.slug === kategori,
    })),
  ];

  const result = categoryNotFound
    ? { items: [], total: 0, page, pageSize: PAGE_SIZE, hasNextPage: false }
    : await listProducts({
        page,
        pageSize: PAGE_SIZE,
        categorySlug: activeCategory?.slug,
        campaignId: activeCampaign?.id,
        query,
        sort,
      });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  // Favori durumu TEK sorguyla, sayfadaki tüm ürünler için birlikte çözülür (N+1 yok).
  const user = await betterAuthProvider.getCurrentUser();
  const favoritedProductIds = user
    ? await listFavoritedProductIdSet(
        user.id,
        result.items.map((product) => product.id),
      )
    : new Set<string>();

  return (
    <PageContainer maxWidthClassName="max-w-[1400px]" className="gap-6">
      <Breadcrumb
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Ürünler", href: activeCategory ? "/urunler" : undefined },
          ...(activeCategory ? [{ label: getCategoryDisplayName(activeCategory) }] : []),
        ]}
      />

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {query
            ? `"${query}" için arama sonuçları`
            : activeCategory
              ? getCategoryDisplayName(activeCategory)
              : activeCampaign
                ? (activeCampaign.headline ?? activeCampaign.name)
                : "Ürünler"}
        </h1>
        <p className="text-foreground/60 text-sm">
          {query
            ? "Aramanızla eşleşen ürünler aşağıda listelenir."
            : activeCategory
              ? (getCategoryDisplayDescription(activeCategory) ??
                "OSSA Kuruyemiş kataloğundaki ürünleri inceleyin.")
              : activeCampaign
                ? "Bu kampanyaya dahil ürünler."
                : "OSSA Kuruyemiş kataloğundaki ürünleri inceleyin."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Mobil/tablet: kategori pill nav + daraltılabilir diğer filtreler */}
        <div className="flex flex-col gap-3 lg:hidden">
          <PillNav items={categoryPillItems} ariaLabel="Kategoriler" />
          <details className="border-border-muted rounded-xl border">
            <summary className="text-foreground cursor-pointer list-none px-4 py-3 text-sm font-bold">
              Diğer Filtreler
            </summary>
            <div className="border-border-muted border-t px-4 py-4">
              <ProductFilters categories={categories} activeCategorySlug={kategori} hideCategories />
            </div>
          </details>
        </div>

        {/* Masaüstü: her zaman açık sol panel */}
        <div className="hidden lg:block">
          <ProductFilters categories={categories} activeCategorySlug={kategori} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-foreground text-sm font-semibold">{result.total} ürün</p>
            <Suspense fallback={<div className="h-[42px] w-[180px]" />}>
              <SortDropdown />
            </Suspense>
          </div>

          {categoryNotFound ? (
            <div
              role="status"
              className="border-border-muted text-foreground/60 rounded-md border p-6 text-center text-sm"
            >
              Aradığınız kategori bulunamadı.{" "}
              <Link href="/urunler" className="text-brand font-medium underline underline-offset-2">
                Tüm ürünlere göz atın
              </Link>
              .
            </div>
          ) : result.items.length === 0 && query ? (
            <div
              role="status"
              className="border-border-muted text-foreground/60 rounded-md border p-6 text-center text-sm"
            >
              <div className="flex flex-col items-center gap-4">
                <p>Aramanızla eşleşen ürün bulunamadı.</p>
                <p className="text-foreground/50 text-xs">
                  Yazımı kontrol edin veya daha genel bir kelime deneyin.
                </p>

                {mainCategories.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {mainCategories.slice(0, 6).map((category) => (
                      <Link
                        key={category.id}
                        href={buildUrl({ kategori: category.slug })}
                        className="border-border-muted hover:border-brand hover:text-brand rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                      >
                        {getCategoryDisplayName(category)}
                      </Link>
                    ))}
                  </div>
                ) : null}

                <Link href="/urunler" className="text-brand font-medium underline underline-offset-2">
                  Tüm ürünleri görüntüle
                </Link>
              </div>
            </div>
          ) : result.items.length === 0 ? (
            <CatalogEmptyState
              message={kategori ? "Bu kategoride henüz ürün bulunmuyor." : "Henüz ürün bulunmuyor."}
              ctaLabel={kategori ? "Tüm Ürünleri Gör" : undefined}
              ctaHref={kategori ? "/urunler" : undefined}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {result.items.map((product, index) => (
                <ScrollReveal key={product.id} delayMs={index * 40}>
                  <ProductListCard
                    product={product}
                    isFavorited={favoritedProductIds.has(product.id)}
                    isLoggedIn={Boolean(user)}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}

          {!categoryNotFound && totalPages > 1 ? (
            <nav aria-label="Sayfalama" className="flex items-center justify-center gap-2 pt-4 sm:gap-4">
              {page > 1 ? (
                <Link
                  href={buildUrl({ kategori, sayfa: page - 1, ara: query, sirala, kampanya })}
                  className="border-border-muted hover:border-brand hover:text-brand rounded-full border px-3 py-2 text-sm font-medium transition-colors sm:px-4"
                >
                  Önceki
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="border-border-muted text-foreground/30 rounded-full border px-3 py-2 text-sm sm:px-4"
                >
                  Önceki
                </span>
              )}
              <span className="text-foreground/60 text-sm whitespace-nowrap">
                Sayfa {page} / {totalPages}
              </span>
              {result.hasNextPage ? (
                <Link
                  href={buildUrl({ kategori, sayfa: page + 1, ara: query, sirala, kampanya })}
                  className="border-border-muted hover:border-brand hover:text-brand rounded-full border px-3 py-2 text-sm font-medium transition-colors sm:px-4"
                >
                  Sonraki
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="border-border-muted text-foreground/30 rounded-full border px-3 py-2 text-sm sm:px-4"
                >
                  Sonraki
                </span>
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
