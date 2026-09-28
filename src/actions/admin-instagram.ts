"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { instagramPostFormSchema, normalizeInstagramPostUrl } from "@/lib/instagram-post-schema";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import {
  findInstagramMediaByPermalink,
  isInstagramApiConfigured,
  type InstagramMediaResult,
} from "@/server/providers/instagram-graph-api-provider";
import {
  createInstagramPost,
  deleteInstagramPost,
  findInstagramPostById,
  updateInstagramPost,
  type AdminInstagramPostRow,
  type InstagramPostFields,
} from "@/server/repositories/instagram-post-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

const LIST_PATH = "/yonetim/instagram";

function parseFormInput(formData: FormData) {
  return instagramPostFormSchema.safeParse({
    postUrl: String(formData.get("postUrl") ?? ""),
    caption: String(formData.get("caption") ?? "").trim() || undefined,
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  });
}

interface MediaCacheFields {
  instagramMediaId: string | null;
  mediaType: InstagramPostFields["mediaType"];
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  captionCached: string | null;
  publishedAt: Date | null;
  lastSyncedAt: Date | null;
}

function toMediaCacheFields(media: InstagramMediaResult): MediaCacheFields {
  return {
    instagramMediaId: media.id,
    mediaType: media.mediaType,
    mediaUrl: media.mediaUrl,
    thumbnailUrl: media.thumbnailUrl,
    captionCached: media.caption,
    publishedAt: new Date(media.publishedAt),
    lastSyncedAt: new Date(),
  };
}

function toExistingCacheFields(existing: AdminInstagramPostRow): MediaCacheFields {
  return {
    instagramMediaId: existing.instagramMediaId,
    mediaType: existing.mediaType,
    mediaUrl: existing.mediaUrl,
    thumbnailUrl: existing.thumbnailUrl,
    captionCached: existing.captionCached,
    publishedAt: existing.publishedAt,
    lastSyncedAt: existing.lastSyncedAt,
  };
}

/**
 * Instagram Graph API'den gerçek medyayı çözer. `existing` varsa (düzenleme,
 * URL değişmemiş) API geçici olarak başarısız olduğunda mevcut cache'e
 * sessizce düşer — yalnızca sortOrder/isActive/caption değiştiren bir
 * düzenleme, Instagram API'nin o anki durumuna bağımlı kalmaz. `existing`
 * YOKSA (yeni kayıt VEYA URL değişti) başarısızlık akışı DURDURUR — cache
 * edecek hiçbir önceki veri yoktur.
 */
async function resolveMediaCache(
  normalizedUrl: string,
  existing: AdminInstagramPostRow | null,
): Promise<{ ok: true; fields: MediaCacheFields } | { ok: false; message: string }> {
  if (!isInstagramApiConfigured()) {
    if (existing) {
      return { ok: true, fields: toExistingCacheFields(existing) };
    }
    return { ok: false, message: "Instagram API yapılandırılmamış. Lütfen sistem yöneticisiyle iletişime geçin." };
  }

  try {
    const media = await findInstagramMediaByPermalink(normalizedUrl);
    if (!media) {
      if (existing) {
        return { ok: true, fields: toExistingCacheFields(existing) };
      }
      return {
        ok: false,
        message: "Bu gönderi @ossa.kuruyemis hesabına ait bulunamadı veya Instagram API'de görünmüyor.",
      };
    }
    return { ok: true, fields: toMediaCacheFields(media) };
  } catch {
    if (existing) {
      return { ok: true, fields: toExistingCacheFields(existing) };
    }
    return { ok: false, message: "Instagram gönderisi şu anda doğrulanamadı. Lütfen tekrar deneyin." };
  }
}

function toInstagramPostFields(
  raw: ReturnType<typeof instagramPostFormSchema.parse>,
  postUrl: string,
  isActive: boolean,
  mediaCache: MediaCacheFields,
): InstagramPostFields {
  return {
    postUrl,
    caption: raw.caption && raw.caption.length > 0 ? raw.caption : null,
    isActive,
    sortOrder: raw.sortOrder,
    ...mediaCache,
  };
}

export async function createInstagramPostAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const normalizedUrl = normalizeInstagramPostUrl(parsed.data.postUrl);
  if (!normalizedUrl) {
    return { ok: false, message: "Geçerli bir Instagram gönderi veya reel linki girin." };
  }

  const mediaResult = await resolveMediaCache(normalizedUrl, null);
  if (!mediaResult.ok) {
    return mediaResult;
  }

  const isActive = formData.get("isActive") === "on";

  let createdId: string;
  try {
    const post = await createInstagramPost(
      toInstagramPostFields(parsed.data, normalizedUrl, isActive, mediaResult.fields),
    );
    createdId = post.id;
  } catch {
    return { ok: false, message: "Instagram gönderisi kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "INSTAGRAM_POST_CREATED",
    entityType: "InstagramPost",
    entityId: createdId,
  });

  revalidatePath("/");
  redirect(`${LIST_PATH}/${createdId}`);
}

export async function updateInstagramPostAction(postId: string, formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const existing = await findInstagramPostById(postId);
  if (!existing) {
    return { ok: false, message: "Instagram gönderisi bulunamadı." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const normalizedUrl = normalizeInstagramPostUrl(parsed.data.postUrl);
  if (!normalizedUrl) {
    return { ok: false, message: "Geçerli bir Instagram gönderi veya reel linki girin." };
  }

  // URL değişmediyse mevcut cache'e (API geçici başarısız olsa dahi) düşülebilir;
  // değiştiyse yeni URL için MUTLAKA yeniden çözümleme gerekir.
  const urlChanged = normalizedUrl !== existing.postUrl;
  const mediaResult = await resolveMediaCache(normalizedUrl, urlChanged ? null : existing);
  if (!mediaResult.ok) {
    return mediaResult;
  }

  const isActive = formData.get("isActive") === "on";

  try {
    await updateInstagramPost(
      postId,
      toInstagramPostFields(parsed.data, normalizedUrl, isActive, mediaResult.fields),
    );
  } catch {
    return { ok: false, message: "Instagram gönderisi kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "INSTAGRAM_POST_UPDATED",
    entityType: "InstagramPost",
    entityId: postId,
  });

  revalidatePath("/");
  return { ok: true };
}

export async function deleteInstagramPostAction(postId: string): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  try {
    await deleteInstagramPost(postId);
  } catch {
    return { ok: false, message: "Instagram gönderisi silinemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "INSTAGRAM_POST_DELETED",
    entityType: "InstagramPost",
    entityId: postId,
  });

  revalidatePath("/");
  redirect(LIST_PATH);
}
