"use server";

import { revalidatePath } from "next/cache";
import { HOMEPAGE_SECTION_KEYS, getHomepageSectionConfig } from "@/lib/homepage-sections";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { reorderHomepageSections, setHomepageSectionActive } from "@/server/repositories/homepage-section-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

async function requireAdmin() {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return null;
  }
  return admin;
}

/** Ana sayfa bölüm sırasını günceller — `orderedKeys` TAM ve geçerli bir sıralama olmalı. */
export async function reorderHomepageSectionsAction(orderedKeys: string[]): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const validKeys = new Set(HOMEPAGE_SECTION_KEYS);
  const isValid =
    orderedKeys.length === HOMEPAGE_SECTION_KEYS.length && orderedKeys.every((key) => validKeys.has(key));
  if (!isValid) {
    return { ok: false, message: "Geçersiz sıralama." };
  }

  await reorderHomepageSections(orderedKeys);
  await recordAuditLog({
    actorId: admin.id,
    action: "HOMEPAGE_SECTIONS_REORDERED",
    entityType: "HomepageSection",
    metadata: { orderedKeys },
  });

  revalidatePath("/yonetim/anasayfa");
  revalidatePath("/");
  return { ok: true };
}

/** Bir bölümü aktif/pasif yapar — yalnızca `toggleable: true` bölümler için izinlidir. */
export async function toggleHomepageSectionActiveAction(key: string, isActive: boolean): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const config = getHomepageSectionConfig(key);
  if (!config) {
    return { ok: false, message: "Geçersiz bölüm." };
  }
  if (!config.toggleable) {
    return { ok: false, message: "Bu bölüm gizlenemez." };
  }

  await setHomepageSectionActive(key, isActive);
  await recordAuditLog({
    actorId: admin.id,
    action: isActive ? "HOMEPAGE_SECTION_ACTIVATED" : "HOMEPAGE_SECTION_DEACTIVATED",
    entityType: "HomepageSection",
    entityId: key,
  });

  revalidatePath("/yonetim/anasayfa");
  revalidatePath("/");
  return { ok: true };
}
