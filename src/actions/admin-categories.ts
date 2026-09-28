"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { categoryFormSchema } from "@/lib/category-schema";
import { fileToUploadInput, validateUploadedImage } from "@/lib/image-upload";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { resolveStorageProvider } from "@/server/providers/storage-provider";
import {
  createCategory,
  deleteCategory,
  findCategoryById,
  updateCategory,
  type CategoryFields,
} from "@/server/repositories/category-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

const LIST_PATH = "/yonetim/kategoriler";

function parseFormInput(formData: FormData) {
  return categoryFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    imageAlt: String(formData.get("imageAlt") ?? "").trim() || undefined,
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  });
}

/** Yeni dosya yüklendiyse `StorageProvider`'a yazar (yükleme hatasında kayıt HİÇ oluşmaz); yoksa mevcut görseli korur. */
async function resolveImageUrl(
  formData: FormData,
  existingImageUrl: string | null,
): Promise<{ ok: true; imageUrl: string | null } | { ok: false; message: string }> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const validation = validateUploadedImage(file);
    if (!validation.ok) {
      return { ok: false, message: validation.message ?? "Görsel doğrulanamadı." };
    }
    try {
      const uploaded = await resolveStorageProvider().upload(await fileToUploadInput(file));
      return { ok: true, imageUrl: uploaded.url };
    } catch {
      return { ok: false, message: "Görsel yüklenemedi." };
    }
  }
  return { ok: true, imageUrl: existingImageUrl };
}

function toCategoryFields(
  raw: ReturnType<typeof categoryFormSchema.parse>,
  imageUrl: string | null,
  isActive: boolean,
): CategoryFields {
  return {
    name: raw.name,
    slug: raw.slug,
    description: raw.description && raw.description.length > 0 ? raw.description : null,
    imageUrl,
    imageAlt: raw.imageAlt && raw.imageAlt.length > 0 ? raw.imageAlt : null,
    isActive,
    sortOrder: raw.sortOrder,
  };
}

export async function createCategoryAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const imageResult = await resolveImageUrl(formData, null);
  if (!imageResult.ok) {
    return imageResult;
  }

  const isActive = formData.get("isActive") === "on";

  const result = await createCategory(toCategoryFields(parsed.data, imageResult.imageUrl, isActive));
  if (!result.ok) {
    return { ok: false, message: "Bu slug zaten kullanılıyor." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "CATEGORY_CREATED",
    entityType: "Category",
    entityId: result.categoryId,
  });

  revalidatePath("/");
  redirect(`${LIST_PATH}/${result.categoryId}`);
}

export async function updateCategoryAction(categoryId: string, formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const existing = await findCategoryById(categoryId);
  if (!existing) {
    return { ok: false, message: "Kategori bulunamadı." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const imageResult = await resolveImageUrl(formData, existing.imageUrl);
  if (!imageResult.ok) {
    return imageResult;
  }

  const isActive = formData.get("isActive") === "on";

  const result = await updateCategory(categoryId, toCategoryFields(parsed.data, imageResult.imageUrl, isActive));
  if (!result.ok) {
    return {
      ok: false,
      message: result.reason === "DUPLICATE_SLUG" ? "Bu slug zaten kullanılıyor." : "Kategori bulunamadı.",
    };
  }

  // Görsel gerçekten değiştiyse eski dosyayı best-effort sil — sahipsiz dosya bırakmamak için.
  if (existing.imageUrl && imageResult.imageUrl !== existing.imageUrl) {
    await resolveStorageProvider().deleteByUrl(existing.imageUrl);
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "CATEGORY_UPDATED",
    entityType: "Category",
    entityId: categoryId,
  });

  revalidatePath("/");
  return { ok: true };
}

export async function deleteCategoryAction(categoryId: string): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const existing = await findCategoryById(categoryId);
  if (!existing) {
    return { ok: false, message: "Kategori bulunamadı." };
  }

  const result = await deleteCategory(categoryId);
  if (!result.ok) {
    if (result.reason === "HAS_PRODUCTS") {
      return {
        ok: false,
        message: "Bu kategoriye bağlı ürünler var. Silmeden önce ürünleri başka bir kategoriye taşıyın.",
      };
    }
    return { ok: false, message: "Kategori bulunamadı." };
  }

  if (existing.imageUrl) {
    await resolveStorageProvider().deleteByUrl(existing.imageUrl);
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "CATEGORY_DELETED",
    entityType: "Category",
    entityId: categoryId,
  });

  revalidatePath("/");
  redirect(LIST_PATH);
}
