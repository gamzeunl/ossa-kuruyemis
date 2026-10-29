"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { featuredPickFormSchema } from "@/lib/featured-pick-schema";
import { recordAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import {
  createFeaturedPick,
  deleteFeaturedPick,
  findFeaturedPickById,
  updateFeaturedPick,
  type FeaturedPickFields,
} from "@/server/repositories/featured-pick-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

const LIST_PATH = "/yonetim/kampanyalar/ayin-favorileri";

function parseOptionalDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}


function parseFormInput(formData: FormData) {
  const parsed = featuredPickFormSchema.safeParse({
    productId: String(formData.get("productId") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    startsAt: String(formData.get("startsAt") ?? "").trim() || undefined,
    endsAt: String(formData.get("endsAt") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return parsed;
  }

  return parsed;
}



function toFields(
  raw: {
    productId: string;
    sortOrder: number;
    startsAt?: string;
    endsAt?: string;
  },
  isActive: boolean
): FeaturedPickFields {
  return {
    productId: raw.productId,
    sortOrder: raw.sortOrder,
    startsAt: parseOptionalDate(raw.startsAt),
    endsAt: parseOptionalDate(raw.endsAt),
    isActive,
  };
}


export async function createFeaturedPickAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  });
  if (!product) {
    return { ok: false, message: "Ürün bulunamadı." };
  }

  const isActive = formData.get("isActive") === "on";

  let createdId: string;
  try {
    const pick = await createFeaturedPick(toFields(parsed.data, isActive));
    createdId = pick.id;
  } catch {
    return { ok: false, message: "Kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "FEATURED_PICK_CREATED",
    entityType: "FeaturedProductPick",
    entityId: createdId,
    metadata: { productId: parsed.data.productId },
  });

  revalidatePath("/");
  redirect(`${LIST_PATH}/${createdId}`);
}

export async function updateFeaturedPickAction(pickId: string, formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const existing = await findFeaturedPickById(pickId);
  if (!existing) {
    return { ok: false, message: "Kayıt bulunamadı." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  });
  if (!product) {
    return { ok: false, message: "Ürün bulunamadı." };
  }

  const isActive = formData.get("isActive") === "on";

  try {
    await updateFeaturedPick(pickId, toFields(parsed.data, isActive));
  } catch {
    return { ok: false, message: "Kaydedilemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "FEATURED_PICK_UPDATED",
    entityType: "FeaturedProductPick",
    entityId: pickId,
  });

  revalidatePath("/");
  return { ok: true };
}

export async function deleteFeaturedPickAction(pickId: string): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const existing = await findFeaturedPickById(pickId);
  if (!existing) {
    return { ok: false, message: "Kayıt bulunamadı." };
  }

  try {
    await deleteFeaturedPick(pickId);
  } catch {
    return { ok: false, message: "Silinemedi." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "FEATURED_PICK_DELETED",
    entityType: "FeaturedProductPick",
    entityId: pickId,
  });

  revalidatePath("/");
  redirect(LIST_PATH);
}
