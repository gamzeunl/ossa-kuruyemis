"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eventCardFormSchema } from "@/lib/event-card-schema";
import { fileToUploadInput, validateUploadedImage } from "@/lib/image-upload";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { resolveStorageProvider } from "@/server/providers/storage-provider";
import {
  createEventCard,
  deleteEventCard,
  findEventCardById,
  updateEventCard,
  type EventCardFields,
} from "@/server/repositories/event-card-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

const LIST_PATH = "/yonetim/icerik/etkinlik-kartlari";

function parseFormInput(formData: FormData) {
  return eventCardFormSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    buttonLabel: String(formData.get("buttonLabel") ?? ""),
    buttonHref: String(formData.get("buttonHref") ?? ""),
    imageAlt: String(formData.get("imageAlt") ?? "").trim() || undefined,
    sortOrder: String(formData.get("sortOrder") ?? "0"),
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

function toEventCardFields(
  raw: ReturnType<typeof eventCardFormSchema.parse>,
  imageUrl: string | null,
  isActive: boolean,
): EventCardFields {
  return {
    title: raw.title,
    description: raw.description,
    imageUrl,
    imageAlt: raw.imageAlt && raw.imageAlt.length > 0 ? raw.imageAlt : null,
    buttonLabel: raw.buttonLabel,
    buttonHref: raw.buttonHref,
    isActive,
    sortOrder: raw.sortOrder,
  };
}

export async function createEventCardAction(formData: FormData): Promise<AdminActionResult> {
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
    const card = await createEventCard(toEventCardFields(parsed.data, imageResult.imageUrl, isActive));
    createdId = card.id;
  } catch {
    return { ok: false, message: "Etkinlik kartı kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "EVENT_CARD_CREATED",
    entityType: "EventCard",
    entityId: createdId,
  });

  revalidatePath("/");
  redirect(`${LIST_PATH}/${createdId}`);
}

export async function updateEventCardAction(cardId: string, formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const existing = await findEventCardById(cardId);
  if (!existing) {
    return { ok: false, message: "Etkinlik kartı bulunamadı." };
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
    await updateEventCard(cardId, toEventCardFields(parsed.data, imageResult.imageUrl, isActive));
  } catch {
    return { ok: false, message: "Etkinlik kartı kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "EVENT_CARD_UPDATED",
    entityType: "EventCard",
    entityId: cardId,
  });

  revalidatePath("/");
  return { ok: true };
}

export async function deleteEventCardAction(cardId: string): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  try {
    await deleteEventCard(cardId);
  } catch {
    return { ok: false, message: "Etkinlik kartı silinemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "EVENT_CARD_DELETED",
    entityType: "EventCard",
    entityId: cardId,
  });

  revalidatePath("/");
  redirect(LIST_PATH);
}
