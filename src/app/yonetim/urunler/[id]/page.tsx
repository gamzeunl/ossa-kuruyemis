import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/container";
import { ProductAdminForm, type AdminProductFormData } from "@/components/admin/product-admin-form";
import { ProductDangerZone } from "@/components/admin/product-danger-zone";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import { ProductStockManager, type AdminVariantStockData } from "@/components/admin/product-stock-manager";
import { requireRole } from "@/server/auth/guard";
import { listActiveCategoryOptions } from "@/server/repositories/category-repository";
import { listInventoryMovementsForVariant } from "@/server/repositories/inventory-repository";
import { findProductForAdmin } from "@/server/repositories/product-repository";

const MOVEMENT_HISTORY_LIMIT = 10;

export const metadata: Metadata = { title: "Ürün Düzenle" };

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN", "/yonetim/urunler");
  const { id } = await params;
  const [product, categoryOptions] = await Promise.all([
    findProductForAdmin(id),
    listActiveCategoryOptions(),
  ]);

  if (!product) {
    notFound();
  }

  const variantStock: AdminVariantStockData[] = await Promise.all(
    product.variants.map(async (variant) => ({
      variantId: variant.id,
      variantName: variant.name,
      sku: variant.sku,
      quantityAvailable: variant.inventory?.quantityAvailable ?? 0,
      quantityReserved: variant.inventory?.quantityReserved ?? 0,
      movements: (await listInventoryMovementsForVariant(variant.id, MOVEMENT_HISTORY_LIMIT)).map((m) => ({
        id: m.id,
        type: m.type,
        quantityDelta: m.quantityDelta,
        reason: m.reason,
        createdAt: m.createdAt.toISOString(),
      })),
    })),
  );

  const formData: AdminProductFormData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
    isRecommended: product.isRecommended,
    newBadgeOverride: product.newBadgeOverride,
    categoryId: product.productCategories[0]?.categoryId ?? "",
    description: product.description ?? "",
    shortDescription: product.shortDescription ?? "",
    ingredients: product.ingredients ?? "",
    storageConditions: product.storageConditions ?? "",
    deliveryInfo: product.deliveryInfo ?? "",
    allergenInfo: product.allergenInfo ?? "",
    originInfo: product.originInfo ?? "",
    usageSuggestion: product.usageSuggestion ?? "",
    nutrition: {
      energyKcal: product.nutritionEnergyKcal?.toString() ?? "",
      energyKj: product.nutritionEnergyKj?.toString() ?? "",
      fat: product.nutritionFat?.toString() ?? "",
      saturatedFat: product.nutritionSaturatedFat?.toString() ?? "",
      carbohydrate: product.nutritionCarbohydrate?.toString() ?? "",
      sugars: product.nutritionSugars?.toString() ?? "",
      fiber: product.nutritionFiber?.toString() ?? "",
      protein: product.nutritionProtein?.toString() ?? "",
      salt: product.nutritionSalt?.toString() ?? "",
      sourceName: product.nutritionSourceName ?? "",
      sourceUrl: product.nutritionSourceUrl ?? "",
      sourceProduct: product.nutritionSourceProduct ?? "",
      referenceType: product.nutritionReferenceType ?? "",
      confidence: product.nutritionConfidence ?? "",
    },
    metaTitle: product.metaTitle ?? "",
    metaDescription: product.metaDescription ?? "",
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      weightGram: variant.weightGram,
      price: variant.price.toString(),
      isActive: variant.isActive,
      hasActiveDiscount: variant.isDiscountActive,
    })),
  };

  return (
    <PageContainer maxWidthClassName="max-w-[820px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/urunler" className="text-brand w-fit text-xs font-semibold">
          ← Ürün Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="text-foreground/60 text-sm">/urunler/{product.slug}</p>
        <p className="text-foreground/60 text-sm">Favori: {product._count.favorites}</p>
      </div>

      <ProductAdminForm product={formData} categoryOptions={categoryOptions} />

      <div className="border-border-muted bg-surface flex flex-col gap-4 rounded-xl border p-5">
        <ProductStockManager productId={product.id} variants={variantStock} />
      </div>

      <div className="border-border-muted bg-surface flex flex-col gap-4 rounded-xl border p-5">
        <ProductImageManager productId={product.id} images={product.images} />
      </div>

      <ProductDangerZone productId={product.id} productName={product.name} />
    </PageContainer>
  );
}
