import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/container";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { BreadcrumbJsonLd } from "@/components/ui/breadcrumb-json-ld";
import { BundleOfferSection } from "@/components/catalog/bundle-offer-section";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { ProductBadgePills } from "@/components/catalog/product-badge-pills";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductInformationSection } from "@/components/catalog/product-information-section";
import { ProductListCard } from "@/components/catalog/product-list-card";
import { ProductPurchasePanel } from "@/components/catalog/product-purchase-panel";
import { ProductReviews } from "@/components/catalog/product-reviews";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { publicEnv } from "@/config/env";
import { getCategoryHref } from "@/lib/category-routes";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import {
  getBundleOffersForProduct,
  getProductBySlug,
  getRelatedProducts,
} from "@/server/services/catalog-service";
import { listFavoritedProductIdSet } from "@/server/services/favorite-service";
import { getProductReviewAggregate, getProductReviews } from "@/server/services/review-service";

const RELATED_PRODUCTS_LIMIT = 4;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Ürün bulunamadı" };
  }

  const title = product.metaTitle ?? product.name;
  const description =
    product.metaDescription ?? product.shortDescription ?? `${product.name} — OSSA Kuruyemiş.`;
  const canonical = `${publicEnv.NEXT_PUBLIC_SITE_URL}/urunler/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const primaryCategory = product.categories[0] ?? null;
  const canonical = `${publicEnv.NEXT_PUBLIC_SITE_URL}/urunler/${product.slug}`;

  const [relatedProducts, reviewAggregate, reviewFirstPage, bundleOffers] = await Promise.all([
    getRelatedProducts(product, RELATED_PRODUCTS_LIMIT),
    getProductReviewAggregate(product.id),
    getProductReviews(product.id, 1),
    getBundleOffersForProduct(product.variants.map((variant) => variant.id)),
  ]);

  const isInStock = product.variants.some((variant) => variant.isAvailable);

  const user = await betterAuthProvider.getCurrentUser();
  const favoritedProductIds = user
    ? await listFavoritedProductIdSet(user.id, [
        product.id,
        ...relatedProducts.map((related) => related.id),
      ])
    : new Set<string>();

  // Yalnızca gerçek onaylı yorum varsa aggregateRating/review eklenir — hiç
  // onaylı yorum yoksa bu alanlar tamamen atlanır, sahte puan üretilmez.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.shortDescription ? { description: product.shortDescription } : {}),
    ...(product.primaryImage
      ? { image: [`${publicEnv.NEXT_PUBLIC_SITE_URL}${product.primaryImage.url}`] }
      : {}),
    ...(product.defaultVariant ? { sku: product.defaultVariant.sku } : {}),
    ...(product.minPrice
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "TRY",
            // `minPrice` tüm varyantlar arasındaki EN DÜŞÜK fiyat olabilir, ama
            // sayfa yüklendiğinde müşteriye GÖSTERİLEN fiyat `defaultVariant`
            // (indirimli varyant varsa önce o) — ikisi farklı varyantsa (ör. daha
            // pahalı bir varyant indirimdeyken daha ucuz bir varyant indirimsizse)
            // JSON-LD, gerçekte render edilen fiyatla eşleşmeli (Google'ın
            // structured-data kuralı). `minPrice`, `defaultVariant` hiç yoksa
            // (olmaması beklenmez) savunma amaçlı fallback olarak kalır.
            price: product.defaultVariant?.effectivePrice ?? product.minPrice,
            availability: isInStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: canonical,
            // Yalnızca GERÇEKTEN aktif bir indirimin GERÇEK bitiş tarihi varsa
            // eklenir (`resolveVariantPricing` çıktısından) — kampanya
            // metadata'sından hesaplama YAPILMAZ, geçmiş tarih asla yazılmaz
            // (indirim aktif değilse bu alan zaten hiç eklenmez).
            ...(product.defaultVariant?.hasActiveDiscount && product.defaultVariant.discountEndsAt
              ? // schema.org `Offer.priceValidUntil` tipi `Date` (YYYY-MM-DD) — saat bileşeni atılır.
                { priceValidUntil: product.defaultVariant.discountEndsAt.toISOString().slice(0, 10) }
              : {}),
          },
        }
      : {}),
    ...(reviewAggregate.total > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewAggregate.average,
            reviewCount: reviewAggregate.total,
          },
        }
      : {}),
    ...(reviewFirstPage.rows.length > 0
      ? {
          review: reviewFirstPage.rows.map((row) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: row.rating },
            author: { "@type": "Person", name: row.displayName },
            ...(row.content ? { reviewBody: row.content } : {}),
          })),
        }
      : {}),
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Ana Sayfa", href: "/" },
    ...(primaryCategory
      ? [{ label: primaryCategory.name, href: getCategoryHref(primaryCategory.slug) }]
      : []),
    { label: product.name },
  ];

  return (
    <PageContainer maxWidthClassName="max-w-[1200px]" className="gap-8 lg:gap-10">
      <script
        type="application/ld+json"
        // JSON.stringify zaten tüm string alanları güvenli biçimde kaçırır (escape);
        // `</script>` enjeksiyon vektörüne karşı ek önlem olarak "<" işareti de kaçırılır.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} currentUrl={canonical} />

      <Breadcrumb items={breadcrumbItems} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-foreground text-2xl font-bold tracking-tight wrap-break-word sm:text-3xl">
                {product.name}
              </h1>
              <FavoriteButton
                variant="icon"
                layout="static"
                productId={product.id}
                productPath={`/urunler/${product.slug}`}
                initialFavorited={favoritedProductIds.has(product.id)}
                isLoggedIn={Boolean(user)}
              />
            </div>
            {product.badges.length > 0 ? <ProductBadgePills inline badges={product.badges} /> : null}
            {product.shortDescription ? (
              <p className="text-foreground/60 text-sm leading-6">{product.shortDescription}</p>
            ) : null}
          </div>
          <ProductPurchasePanel
            productId={product.id}
            slug={product.slug}
            name={product.name}
            image={product.primaryImage?.url ?? null}
            variants={product.variants}
            defaultVariantId={product.defaultVariant?.id ?? null}
          />
        </div>
      </div>

      <div className="flex flex-col gap-12 md:gap-16 lg:gap-20">
        <BundleOfferSection
          offers={bundleOffers}
          primaryProductImage={product.primaryImage?.url ?? null}
          primaryVariants={product.variants}
        />

        <ProductInformationSection
          description={product.description}
          shortDescription={product.shortDescription}
          ingredients={product.ingredients}
          storageConditions={product.storageConditions}
          deliveryInfo={product.deliveryInfo}
          allergenInfo={product.allergenInfo}
          originInfo={product.originInfo}
          usageSuggestion={product.usageSuggestion}
          nutrition={{
            energyKcal: product.nutritionEnergyKcal,
            energyKj: product.nutritionEnergyKj,
            fat: product.nutritionFat,
            saturatedFat: product.nutritionSaturatedFat,
            carbohydrate: product.nutritionCarbohydrate,
            sugars: product.nutritionSugars,
            fiber: product.nutritionFiber,
            protein: product.nutritionProtein,
            salt: product.nutritionSalt,
          }}
        />

        <ProductReviews
          productId={product.id}
          productPath={`/urunler/${product.slug}`}
          aggregate={reviewAggregate}
          firstPage={reviewFirstPage}
        />

        {relatedProducts.length > 0 ? (
          <section className="flex flex-col gap-5">
            <h2 className="text-foreground text-xl font-bold tracking-tight">Bunları da Beğenebilirsiniz</h2>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {relatedProducts.map((related, index) => (
                <ScrollReveal key={related.id} delayMs={index * 60}>
                  <ProductListCard
                    product={related}
                    isFavorited={favoritedProductIds.has(related.id)}
                    isLoggedIn={Boolean(user)}
                  />
                </ScrollReveal>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageContainer>
  );
}
