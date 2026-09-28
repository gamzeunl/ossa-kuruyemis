import { z } from "zod";

/**
 * Admin'in ELLE tetikleyebileceği hareket türleri — `RESERVATION`/
 * `RESERVATION_RELEASE`/`SALE` sistem tarafından otomatik yönetilir, admin
 * formunda hiç seçenek olarak SUNULMAZ (bkz. `inventory-repository.ts`).
 * Yön (işaret) türe göre SABİTTİR: Stok Girişi/İade her zaman artırır, Hasar/
 * Kayıp her zaman azaltır — yalnızca Sayım Düzeltmesi her iki yöne de gidebilir.
 */
export const ADMIN_INVENTORY_MOVEMENT_TYPES = ["PURCHASE_IN", "RETURN", "ADJUSTMENT", "DAMAGE"] as const;

export const adjustInventoryFormSchema = z
  .object({
    type: z.enum(ADMIN_INVENTORY_MOVEMENT_TYPES, { message: "Geçerli bir işlem türü seçin." }),
    quantity: z.coerce.number().int("Miktar tam sayı olmalı.").refine((v) => v !== 0, "Miktar 0 olamaz."),
    reason: z.string().trim().max(300, "Not en fazla 300 karakter olabilir.").optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.type === "PURCHASE_IN" || data.type === "RETURN") && data.quantity < 0) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: "Bu işlem türü için miktar pozitif olmalı." });
    }
    if (data.type === "DAMAGE" && data.quantity > 0) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: "Hasar/kayıp miktarı negatif olmalı (ör. -2)." });
    }
  });

export type AdjustInventoryFormSchema = z.infer<typeof adjustInventoryFormSchema>;
