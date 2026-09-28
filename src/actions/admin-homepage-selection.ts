"use server";

import { revalidatePath } from "next/cache";
import { HOMEPAGE_SELECTION_MAX_PRODUCTS, homepageSelectionFormSchema } from "@/lib/homepage-selection-schema";
import { fileToUploadInput, validateUploadedImage } from "@/lib/image-upload";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { resolveStorageProvider } from "@/server/providers/storage-provider";
import {
  getHomepageSelectionForAdmin,
  upsertHomepageSelection,
} from "@/server/repositories/homepage-selection-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

function parseFormInput(formData: FormData) {
  return homepageSelectionFormSchema.safeParse({
    eyebrow: String(formData.get("eyebrow") ?? "").trim() || undefined,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? "").trim() || undefined,
    ctaLabel: String(formData.get("ctaLabel") ?? ""),
    ctaHref: String(formData.get("ctaHref") ?? ""),
    imageAlt: String(formData.get("imageAlt") ?? "").trim() || undefined,
  });
}

/** Yeni dosya yüklendiyse `StorageProvider`'a yazar; yoksa mevcut görseli (varsa) korur — görsel zorunlu değildir. */
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
    const uploaded = await resolveStorageProvider().upload(await fileToUploadInput(file));
    return { ok: true, imageUrl: uploaded.url };
  }
  return { ok: true, imageUrl: existingImageUrl };
}

/** `productSlot1`..`productSlot4` alanlarından boş olmayan, tekrarsız ürün id'lerini SIRAYLA döner. */
function resolveProductIds(formData: FormData): string[] {
  const ids: string[] = [];
  for (let slot = 1; slot <= HOMEPAGE_SELECTION_MAX_PRODUCTS; slot += 1) {
    const value = String(formData.get(`productSlot${slot}`) ?? "").trim();
    if (value.length > 0 && !ids.includes(value)) {
      ids.push(value);
    }
  }
  return ids;
}

export async function updateHomepageSelectionAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const existing = await getHomepageSelectionForAdmin();
  const imageResult = await resolveImageUrl(formData, existing?.imageUrl ?? null);
  if (!imageResult.ok) {
    return imageResult;
  }

  const isActive = formData.get("isActive") === "on";
  const productIds = resolveProductIds(formData);

  let selectionId: string;
  try {
    selectionId = await upsertHomepageSelection(
      {
        isActive,
        eyebrow: parsed.data.eyebrow ?? null,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        ctaLabel: parsed.data.ctaLabel,
        ctaHref: parsed.data.ctaHref,
        imageUrl: imageResult.imageUrl,
        imageAlt: parsed.data.imageAlt ?? null,
      },
      productIds,
    );
  } catch {
    return { ok: false, message: "Kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: existing ? "HOMEPAGE_SELECTION_UPDATED" : "HOMEPAGE_SELECTION_CREATED",
    entityType: "HomepageSelection",
    entityId: selectionId,
  });

  revalidatePath("/");
  revalidatePath("/yonetim/anasayfa-seckisi");
  return { ok: true };
}
