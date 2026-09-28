"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateVariantDiscountUpdate } from "@/lib/product-pricing";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import {
  findVariantForAdmin,
  updateVariantDiscount,
  type AdminDiscountVariantRow,
} from "@/server/repositories/product-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

const LIST_PATH = "/yonetim/kampanyalar/haftanin-firsatlari";

function parseOptionalDate(value: string): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Değişen ürünün ilgili müşteri yüzeylerini günceller — `admin-banners.ts::revalidatePath` deseninin genişletilmiş hâli. */
function revalidateProductSurfaces(product: AdminDiscountVariantRow["product"]): void {
  revalidatePath("/");
  revalidatePath("/urunler");
  revalidatePath(`/urunler/${product.slug}`);
  for (const { category } of product.productCategories) {
    revalidatePath(`/${category.slug}`);
  }
}

function readRawInput(formData: FormData) {
  return {
    discountPriceRaw: String(formData.get("discountPrice") ?? "").trim(),
    isDiscountActive: formData.get("isDiscountActive") === "on",
    discountStartsAt: parseOptionalDate(String(formData.get("discountStartsAt") ?? "").trim()),
    discountEndsAt: parseOptionalDate(String(formData.get("discountEndsAt") ?? "").trim()),
  };
}

export async function createDiscountAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const variantId = String(formData.get("variantId") ?? "").trim();
  if (!variantId) {
    return { ok: false, message: "Bir ürün/varyant seçmelisiniz." };
  }

  const variant = await findVariantForAdmin(variantId);
  if (!variant) {
    return { ok: false, message: "Varyant bulunamadı." };
  }

  const raw = readRawInput(formData);
  // Normal fiyat HER ZAMAN DB'den okunan gerçek `variant.price`'tır — client'tan gelmez.
  const validation = validateVariantDiscountUpdate(variant.price, {
    discountPrice: raw.discountPriceRaw,
    isDiscountActive: raw.isDiscountActive,
    discountStartsAt: raw.discountStartsAt,
    discountEndsAt: raw.discountEndsAt,
  });
  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  try {
    await updateVariantDiscount(variantId, {
      id: variantId,
      discountPrice: validation.discountPrice,
      discountStartsAt: raw.discountStartsAt,
      discountEndsAt: raw.discountEndsAt,
      isDiscountActive: raw.isDiscountActive,
    });
  } catch {
    return { ok: false, message: "Kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_DISCOUNT_CHANGED",
    entityType: "Product",
    entityId: variant.product.id,
  });

  revalidateProductSurfaces(variant.product);
  redirect(`${LIST_PATH}/${variantId}`);
}

export async function updateDiscountAction(variantId: string, formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const variant = await findVariantForAdmin(variantId);
  if (!variant) {
    return { ok: false, message: "Varyant bulunamadı." };
  }

  const raw = readRawInput(formData);
  const validation = validateVariantDiscountUpdate(variant.price, {
    discountPrice: raw.discountPriceRaw,
    isDiscountActive: raw.isDiscountActive,
    discountStartsAt: raw.discountStartsAt,
    discountEndsAt: raw.discountEndsAt,
  });
  if (!validation.ok) {
    return { ok: false, message: validation.message };
  }

  try {
    await updateVariantDiscount(variantId, {
      id: variantId,
      discountPrice: validation.discountPrice,
      discountStartsAt: raw.discountStartsAt,
      discountEndsAt: raw.discountEndsAt,
      isDiscountActive: raw.isDiscountActive,
    });
  } catch {
    return { ok: false, message: "Kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_DISCOUNT_CHANGED",
    entityType: "Product",
    entityId: variant.product.id,
  });

  revalidateProductSurfaces(variant.product);
  return { ok: true };
}
