"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { bundleOfferFormSchema } from "@/lib/bundle-offer-schema";
import { resolveVariantPricing } from "@/lib/product-pricing";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import {
  createBundleOffer,
  deleteBundleOffer,
  findBundleOfferForAdmin,
  updateBundleOffer,
  type BundleOfferFields,
} from "@/server/repositories/bundle-offer-repository";
import { findVariantForAdmin, type AdminDiscountVariantRow } from "@/server/repositories/product-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

const LIST_PATH = "/yonetim/kampanyalar/birlikte-al";

function parseOptionalDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Değişen kampanyanın ANA ürününün ilgili müşteri yüzeylerini günceller — `admin-discounts.ts` ile aynı desen. */
function revalidateProductSurfaces(product: AdminDiscountVariantRow["product"]): void {
  revalidatePath("/");
  revalidatePath("/urunler");
  revalidatePath(`/urunler/${product.slug}`);
  for (const { category } of product.productCategories) {
    revalidatePath(`/${category.slug}`);
  }
}

type ValidatedBundleOffer =
  | { ok: true; fields: BundleOfferFields; primaryProduct: AdminDiscountVariantRow["product"] }
  | { ok: false; message: string };

/**
 * Formdaki HER İKİ varyantı da DB'den yeniden okur (client'a asla güvenilmez);
 * `companionPrice`'ın tamamlayıcının o andaki GERÇEK bağımsız efektif
 * fiyatından (`resolveVariantPricing`, normal indirim zaten dahil) düşük
 * olduğunu doğrular. `/yonetim/urunler/[id]`'deki indirim doğrulamasıyla
 * (`validateVariantDiscountUpdate`) AYNI "DB'den oku, client'a güvenme"
 * ilkesini uygular — ayrı bir pricing sistemi değildir.
 */
async function validateAndBuildFields(formData: FormData): Promise<ValidatedBundleOffer> {
  const parsed = bundleOfferFormSchema.safeParse({
    primaryVariantId: String(formData.get("primaryVariantId") ?? ""),
    companionVariantId: String(formData.get("companionVariantId") ?? ""),
    companionPrice: String(formData.get("companionPrice") ?? "").trim(),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    startsAt: String(formData.get("startsAt") ?? "").trim() || undefined,
    endsAt: String(formData.get("endsAt") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const [primaryVariant, companionVariant] = await Promise.all([
    findVariantForAdmin(parsed.data.primaryVariantId),
    findVariantForAdmin(parsed.data.companionVariantId),
  ]);
  if (!primaryVariant) {
    return { ok: false, message: "Ana ürün/varyant bulunamadı." };
  }
  if (!companionVariant) {
    return { ok: false, message: "Tamamlayıcı ürün/varyant bulunamadı." };
  }

  const companionPriceNumber = Number(parsed.data.companionPrice);
  if (!Number.isFinite(companionPriceNumber) || companionPriceNumber <= 0) {
    return { ok: false, message: "Birlikte al fiyatı pozitif bir sayı olmalı." };
  }
  const companionPriceDecimal = new Prisma.Decimal(parsed.data.companionPrice);

  const companionPricing = resolveVariantPricing(companionVariant);
  if (!companionPriceDecimal.lessThan(companionPricing.effectivePrice)) {
    return {
      ok: false,
      message: `Birlikte al fiyatı, tamamlayıcının güncel geçerli fiyatından (${companionPricing.effectivePrice.toString()}) düşük olmalı.`,
    };
  }

  return {
    ok: true,
    fields: {
      primaryProductId: primaryVariant.product.id,
      primaryVariantId: primaryVariant.id,
      companionProductId: companionVariant.product.id,
      companionVariantId: companionVariant.id,
      companionPrice: companionPriceDecimal,
      startsAt: parseOptionalDate(parsed.data.startsAt),
      endsAt: parseOptionalDate(parsed.data.endsAt),
      isActive: formData.get("isActive") === "on",
      sortOrder: parsed.data.sortOrder,
    },
    primaryProduct: primaryVariant.product,
  };
}

export async function createBundleOfferAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const result = await validateAndBuildFields(formData);
  if (!result.ok) {
    return result;
  }

  let createdId: string;
  try {
    const created = await createBundleOffer(result.fields);
    createdId = created.id;
  } catch {
    return { ok: false, message: "Kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "BUNDLE_OFFER_CREATED",
    entityType: "BundleOffer",
    entityId: createdId,
  });

  revalidateProductSurfaces(result.primaryProduct);
  redirect(`${LIST_PATH}/${createdId}`);
}

export async function updateBundleOfferAction(id: string, formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const existing = await findBundleOfferForAdmin(id);
  if (!existing) {
    return { ok: false, message: "Kampanya bulunamadı." };
  }

  const result = await validateAndBuildFields(formData);
  if (!result.ok) {
    return result;
  }

  try {
    await updateBundleOffer(id, result.fields);
  } catch {
    return { ok: false, message: "Kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "BUNDLE_OFFER_UPDATED",
    entityType: "BundleOffer",
    entityId: id,
  });

  revalidateProductSurfaces(result.primaryProduct);
  return { ok: true };
}

export async function deleteBundleOfferAction(id: string): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const existing = await findBundleOfferForAdmin(id);
  if (!existing) {
    return { ok: false, message: "Kampanya bulunamadı." };
  }

  try {
    await deleteBundleOffer(id);
  } catch {
    return { ok: false, message: "Silinemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "BUNDLE_OFFER_DELETED",
    entityType: "BundleOffer",
    entityId: id,
  });

  revalidatePath("/");
  revalidatePath("/urunler");
  revalidatePath(`/urunler/${existing.primaryProduct.slug}`);
  redirect(LIST_PATH);
}
