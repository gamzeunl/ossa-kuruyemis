"use server";

import { redirect } from "next/navigation";
import { BlogPostStatus, Prisma } from "@/generated/prisma/client";
import { blogPostFormSchema } from "@/lib/blog-schema";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { createPost, updatePost, type BlogPostFields } from "@/server/repositories/blog-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

function parseOptionalDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseFormInput(formData: FormData) {
  return blogPostFormSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    excerpt: String(formData.get("excerpt") ?? "").trim() || undefined,
    content: String(formData.get("content") ?? ""),
    coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim() || undefined,
    status: String(formData.get("status") ?? BlogPostStatus.DRAFT),
    publishedAt: String(formData.get("publishedAt") ?? "").trim() || undefined,
    metaTitle: String(formData.get("metaTitle") ?? "").trim() || undefined,
    metaDescription: String(formData.get("metaDescription") ?? "").trim() || undefined,
  });
}

function toBlogPostFields(
  raw: ReturnType<typeof blogPostFormSchema.parse>,
  productIds: string[],
): BlogPostFields {
  return {
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt && raw.excerpt.length > 0 ? raw.excerpt : null,
    content: raw.content,
    coverImageUrl: raw.coverImageUrl && raw.coverImageUrl.length > 0 ? raw.coverImageUrl : null,
    status: raw.status,
    publishedAt: parseOptionalDate(raw.publishedAt),
    metaTitle: raw.metaTitle && raw.metaTitle.length > 0 ? raw.metaTitle : null,
    metaDescription: raw.metaDescription && raw.metaDescription.length > 0 ? raw.metaDescription : null,
    productIds,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createBlogPostAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const productIds = formData.getAll("productIds").map(String);

  let createdId: string;
  try {
    const post = await createPost(admin.id, toBlogPostFields(parsed.data, productIds));
    createdId = post.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, message: "Bu slug zaten kullanılıyor." };
    }
    return { ok: false, message: "Yazı kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "BLOG_POST_CREATED",
    entityType: "BlogPost",
    entityId: createdId,
  });

  redirect(`/yonetim/blog/${createdId}`);
}

export async function updateBlogPostAction(
  postId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const productIds = formData.getAll("productIds").map(String);

  try {
    await updatePost(postId, toBlogPostFields(parsed.data, productIds));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, message: "Bu slug zaten kullanılıyor." };
    }
    return { ok: false, message: "Yazı kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "BLOG_POST_UPDATED",
    entityType: "BlogPost",
    entityId: postId,
  });

  return { ok: true };
}
