"use server";

import { revalidatePath } from "next/cache";
import { adjustInventoryFormSchema } from "@/lib/inventory-schema";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { adjustInventory } from "@/server/repositories/inventory-repository";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

/**
 * Admin'in elle stok girişi/düzeltmesi/hasar kaydı — her değişiklik
 * `InventoryMovement` + `AuditLog` ile izlenir (kim/ne zaman/ne yaptı).
 * Negatif sonuca ASLA izin verilmez (bkz. `adjustInventory`, ayrıca DB'de
 * CHECK constraint).
 */
export async function adjustInventoryAction(
  variantId: string,
  productId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const parsed = adjustInventoryFormSchema.safeParse({
    type: String(formData.get("type") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    reason: String(formData.get("reason") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const result = await adjustInventory({
    variantId,
    delta: parsed.data.quantity,
    type: parsed.data.type,
    actorId: admin.id,
    reason: parsed.data.reason,
  });

  if (!result.ok) {
    return { ok: false, message: "Bu işlem stoğu negatife düşürür — mevcut stoktan fazla azaltma yapılamaz." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "INVENTORY_ADJUSTED",
    entityType: "ProductVariant",
    entityId: variantId,
    metadata: { type: parsed.data.type, quantity: parsed.data.quantity, reason: parsed.data.reason ?? null },
  });

  revalidatePath(`/yonetim/urunler/${productId}`);
  return { ok: true };
}
