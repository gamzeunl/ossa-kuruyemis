"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BannerType } from "@/generated/prisma/client";
import { bannerFormSchema } from "@/lib/banner-schema";
import { fileToUploadInput, validateUploadedImage } from "@/lib/image-upload";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { resolveStorageProvider } from "@/server/providers/storage-provider";
import {
  createBanner,
  deleteBanner,
  findBannerById,
  updateBanner,
  type BannerFields,
} from "@/server/repositories/banner-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

type BannerTypeParam = "HERO" | "FULL_WIDTH";

function listPathForType(type: BannerTypeParam): string {
  return type === "HERO" ? "/yonetim/icerik/hero-banner" : "/yonetim/icerik/banner";
}

function parseFormInput(formData: FormData) {
  return bannerFormSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    subtitle: String(formData.get("subtitle") ?? "").trim() || undefined,
    primaryButtonLabel: String(formData.get("primaryButtonLabel") ?? ""),
    primaryButtonHref: String(formData.get("primaryButtonHref") ?? ""),
    secondaryButtonLabel: String(formData.get("secondaryButtonLabel") ?? "").trim() || undefined,
    secondaryButtonHref: String(formData.get("secondaryButtonHref") ?? "").trim() || undefined,
    imageAlt: String(formData.get("imageAlt") ?? "").trim() || undefined,
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  });
}

/** Yeni dosya yüklendiyse `StorageProvider`'a yazar; yoksa (düzenlemede) mevcut görseli korur. */
async function resolveImageUrl(
  formData: FormData,
  existingImageUrl: string | null,
): Promise<{ ok: true; imageUrl: string } | { ok: false; message: string }> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const validation = validateUploadedImage(file);
    if (!validation.ok) {
      return { ok: false, message: validation.message ?? "Görsel doğrulanamadı." };
    }
    const uploaded = await resolveStorageProvider().upload(await fileToUploadInput(file));
    return { ok: true, imageUrl: uploaded.url };
  }
  if (existingImageUrl) {
    return { ok: true, imageUrl: existingImageUrl };
  }
  return { ok: false, message: "Bir görsel yükleyin." };
}

function toBannerFields(
  raw: ReturnType<typeof bannerFormSchema.parse>,
  imageUrl: string,
  isActive: boolean,
): BannerFields {
  return {
    title: raw.title,
    subtitle: raw.subtitle && raw.subtitle.length > 0 ? raw.subtitle : null,
    imageUrl,
    imageAlt: raw.imageAlt && raw.imageAlt.length > 0 ? raw.imageAlt : null,
    primaryButtonLabel: raw.primaryButtonLabel,
    primaryButtonHref: raw.primaryButtonHref,
    secondaryButtonLabel:
      raw.secondaryButtonLabel && raw.secondaryButtonLabel.length > 0 ? raw.secondaryButtonLabel : null,
    secondaryButtonHref:
      raw.secondaryButtonHref && raw.secondaryButtonHref.length > 0 ? raw.secondaryButtonHref : null,
    isActive,
    sortOrder: raw.sortOrder,
  };
}

export async function createBannerAction(type: BannerTypeParam, formData: FormData): Promise<AdminActionResult> {
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

  let createdId: string;
  try {
    const banner = await createBanner(
      type === "HERO" ? BannerType.HERO : BannerType.FULL_WIDTH,
      toBannerFields(parsed.data, imageResult.imageUrl, isActive),
    );
    createdId = banner.id;
  } catch {
    return { ok: false, message: "Banner kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "BANNER_CREATED",
    entityType: "Banner",
    entityId: createdId,
    metadata: { type },
  });

  revalidatePath("/");
  redirect(`${listPathForType(type)}/${createdId}`);
}

export async function updateBannerAction(bannerId: string, formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const existing = await findBannerById(bannerId);
  if (!existing) {
    return { ok: false, message: "Banner bulunamadı." };
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

  try {
    await updateBanner(bannerId, toBannerFields(parsed.data, imageResult.imageUrl, isActive));
  } catch {
    return { ok: false, message: "Banner kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "BANNER_UPDATED",
    entityType: "Banner",
    entityId: bannerId,
  });

  revalidatePath("/");
  return { ok: true };
}

export async function deleteBannerAction(bannerId: string): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const existing = await findBannerById(bannerId);
  if (!existing) {
    return { ok: false, message: "Banner bulunamadı." };
  }

  try {
    await deleteBanner(bannerId);
  } catch {
    return { ok: false, message: "Banner silinemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "BANNER_DELETED",
    entityType: "Banner",
    entityId: bannerId,
  });

  revalidatePath("/");
  redirect(listPathForType(existing.type === BannerType.HERO ? "HERO" : "FULL_WIDTH"));
}
