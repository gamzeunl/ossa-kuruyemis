import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/container";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { BreadcrumbJsonLd } from "@/components/ui/breadcrumb-json-ld";
import { publicEnv } from "@/config/env";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { PillNav, type PillNavItem } from "@/components/catalog/pill-nav";
import { ProductListCard } from "@/components/catalog/product-list-card";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SortDropdown } from "@/components/catalog/sort-dropdown";
import { getCategoryContent } from "@/lib/category-content";
import { getMegaMenuContent, getMegaMenuGroup } from "@/lib/mega-menu-content";
import {
  getCategoryBySlug,
  listProducts,
  listProductsByGroup,
} from "@/server/services/catalog-service";
import { listFavoritedProductIdSet } from "@/server/services/favorite-service";
import type { ProductSortOption } from "@/server/repositories/product-repository";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";

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

function buildPageUrl(
  slug: string,
  params: { sayfa?: number; sirala?: string; grup?: string },
): string {
  const search = new URLSearchParams();
  if (params.sirala) {
    search.set("sirala", params.sirala);
  }
  if (params.grup) {
    search.set("grup", params.grup);
  }
  if (params.sayfa && params.sayfa > 1) {
    search.set("sayfa", String(params.sayfa));
  }
  const query = search.toString();
  return query ? `/${slug}?${query}` : `/${slug}`;
}

interface CategoryPageViewProps {
  slug: string;
  searchParams: { sayfa?: string; sirala?: string; grup?: string };
}

/**
 * Tüm kategori sayfalarının (`/cerez`, `/lokum`, ...) paylaştığı görünüm.
 * Her `src/app/<slug>/page.tsx` bu bileşeni kendi sabit slug'ıyla çağırır.
 */
export async function CategoryPageView({ slug, searchParams }: CategoryPageViewProps) {
  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const content = getCategoryContent(slug);
  const page = parsePage(searchParams.sayfa);
  const sort = resolveSort(searchParams.sirala);

  const activeGroupSlug = searchParams.grup;
  const activeGroup = getMegaMenuGroup(slug, activeGroupSlug);

  const megaMenuGroups = getMegaMenuContent(slug)?.groups ?? [];
  const groupNavItems: PillNavItem[] =
    megaMenuGroups.length === 0
      ? []
      : [
          {
            key: "all",
            label: "Tümü",
            href: buildPageUrl(slug, { sirala: searchParams.sirala }),
            active: !activeGroupSlug,
          },
          ...megaMenuGroups.map((group) => ({
            key: group.groupSlug,
            label: group.label,
            href: buildPageUrl(slug, { sirala: searchParams.sirala, grup: group.groupSlug }),
            active: activeGroupSlug === group.groupSlug,
          })),
        ];

  // `grup` tanımlıysa (bilinen veya bilinmeyen değer fark etmeksizin) filtreleme
  // her zaman `listProductsByGroup` üzerinden yürür: grup tanınmıyorsa bu fonksiyon
  // sorguyu hiç çalıştırmadan boş sonuç döner — filtresiz tüm kategoriyi sessizce
  // göstermek yerine açık bir boş durum ekranı sunulur.
  const result = activeGroupSlug
    ? await listProductsByGroup({
        categorySlug: slug,
        groupSlug: activeGroupSlug,
        page,
        pageSize: PAGE_SIZE,
        sort,
      })
    : await listProducts({ categorySlug: slug, page, pageSize: PAGE_SIZE, sort });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const user = await betterAuthProvider.getCurrentUser();
  const favoritedProductIds = user
    ? await listFavoritedProductIdSet(
        user.id,
        result.items.map((product) => product.id),
      )
    : new Set<string>();

  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Ana Sayfa", href: "/" }, { label: category.name }];

  return (
    <PageContainer maxWidthClassName="max-w-[1200px]" className="gap-8">
      <BreadcrumbJsonLd items={breadcrumbItems} currentUrl={`${publicEnv.NEXT_PUBLIC_SITE_URL}/${slug}`} />
      <Breadcrumb items={breadcrumbItems} />

      <div
        className={`flex flex-col gap-2 ${content?.sectionToneClassName ? `${content.sectionToneClassName} -mx-4 rounded-2xl px-4 py-4 sm:-mx-6 sm:px-6` : ""}`}
      >
        <span className="text-brand text-xs font-bold tracking-[0.18em] uppercase">Kategori</span>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {category.name}
          {activeGroup ? <span className="text-foreground/50"> — {activeGroup.label}</span> : null}
        </h1>
        <p className="text-foreground/60 max-w-2xl text-sm">
          {content?.shortDescription ?? category.description}
        </p>
      </div>

      {groupNavItems.length > 0 ? (
        <PillNav items={groupNavItems} ariaLabel={`${category.name} alt grupları`} />
      ) : null}

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-foreground text-sm font-semibold">{result.total} ürün</p>
          <Suspense fallback={<div className="h-[42px] w-[180px]" />}>
            <SortDropdown />
          </Suspense>
        </div>

        {result.items.length === 0 ? (
          <CatalogEmptyState
            message={
              activeGroupSlug
                ? "Bu grupta henüz ürün bulunmuyor."
                : "Bu kategoride henüz ürün bulunmuyor."
            }
            ctaLabel={activeGroupSlug ? "Tüm Ürünleri Gör" : undefined}
            ctaHref={activeGroupSlug ? "/urunler" : undefined}
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

        {totalPages > 1 ? (
          <nav aria-label="Sayfalama" className="flex items-center justify-center gap-2 pt-2 sm:gap-4">
            {page > 1 ? (
              <Link
                href={buildPageUrl(slug, {
                  sayfa: page - 1,
                  sirala: searchParams.sirala,
                  grup: searchParams.grup,
                })}
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
                href={buildPageUrl(slug, {
                  sayfa: page + 1,
                  sirala: searchParams.sirala,
                  grup: searchParams.grup,
                })}
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

    </PageContainer>
  );
}
