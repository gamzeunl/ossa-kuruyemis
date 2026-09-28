"use client";

import { useActionState, useState, useTransition } from "react";
import { adjustInventoryAction } from "@/actions/admin-inventory";
import { markAllProductVariantsSoldOutAction, markVariantSoldOutAction } from "@/actions/admin-products";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { useToast } from "@/components/admin/toast-provider";
import { ADMIN_INVENTORY_MOVEMENT_TYPES } from "@/lib/inventory-schema";
import type { InventoryMovementType } from "@/generated/prisma/client";

export interface AdminInventoryMovementData {
  id: string;
  type: InventoryMovementType;
  quantityDelta: number;
  reason: string | null;
  createdAt: string;
}

export interface AdminVariantStockData {
  variantId: string;
  variantName: string;
  sku: string;
  quantityAvailable: number;
  quantityReserved: number;
  movements: AdminInventoryMovementData[];
}

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

const inputClassName =
  "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-colors";

const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  PURCHASE_IN: "Stok Girişi",
  RESERVATION: "Rezervasyon",
  RESERVATION_RELEASE: "Rezervasyon Serbest",
  SALE: "Satış",
  RETURN: "İade",
  ADJUSTMENT: "Sayım Düzeltmesi",
  DAMAGE: "Hasar/Kayıp",
};

const ADMIN_TYPE_LABELS: Record<(typeof ADMIN_INVENTORY_MOVEMENT_TYPES)[number], string> = {
  PURCHASE_IN: "Stok Girişi (+)",
  RETURN: "İade (+)",
  ADJUSTMENT: "Sayım Düzeltmesi (±)",
  DAMAGE: "Hasar/Kayıp (-)",
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function VariantStockRow({ productId, variant }: { productId: string; variant: AdminVariantStockData }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmSoldOut, setConfirmSoldOut] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [isSoldOutPending, startSoldOutTransition] = useTransition();
  const [isRestockPending, startRestockTransition] = useTransition();
  const sellable = variant.quantityAvailable - variant.quantityReserved;
  const isSoldOut = sellable <= 0;
  const { showToast } = useToast();

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await adjustInventoryAction(variant.variantId, productId, formData);
    return result.ok ? { message: "Stok güncellendi.", success: true } : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  function handleMarkSoldOut() {
    startSoldOutTransition(async () => {
      const result = await markVariantSoldOutAction(productId, variant.variantId);
      showToast(
        result.ok ? "Ürün tükendi olarak işaretlendi." : result.message,
        result.ok ? "success" : "error",
      );
      setConfirmSoldOut(false);
    });
  }

  function handleRestock() {
    const quantity = Number.parseInt(restockQuantity, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      showToast("Geçerli bir adet girin.", "error");
      return;
    }
    const formData = new FormData();
    formData.set("type", "PURCHASE_IN");
    formData.set("quantity", String(quantity));
    formData.set("reason", "Tekrar satışa açıldı");
    startRestockTransition(async () => {
      const result = await adjustInventoryAction(variant.variantId, productId, formData);
      showToast(result.ok ? "Ürün tekrar satışa açıldı." : result.message, result.ok ? "success" : "error");
      if (result.ok) {
        setRestockOpen(false);
        setRestockQuantity("");
      }
    });
  }

  return (
    <div className="border-border-muted flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-foreground text-sm font-semibold">{variant.variantName}</p>
          <p className="text-foreground/50 text-xs">{variant.sku}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge label={isSoldOut ? "Tükendi" : "Satışta"} tone={isSoldOut ? "danger" : "success"} />
          {isSoldOut ? (
            <button
              type="button"
              onClick={() => setRestockOpen((prev) => !prev)}
              className="border-border-muted hover:border-brand hover:text-brand min-h-8 rounded-lg border px-3 text-xs font-semibold transition-colors"
            >
              Satışa Aç
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmSoldOut(true)}
              className="border-border-muted hover:border-red-400 hover:text-red-700 min-h-8 rounded-lg border px-3 text-xs font-semibold transition-colors"
            >
              Tükendi Olarak İşaretle
            </button>
          )}
        </div>
      </div>

      {restockOpen ? (
        <div className="border-border-muted bg-surface-muted flex flex-wrap items-end gap-2 rounded-lg border p-3">
          <label className="text-foreground flex flex-col gap-1 text-xs font-medium">
            Eklenecek adet
            <input
              type="number"
              min={1}
              value={restockQuantity}
              onChange={(event) => setRestockQuantity(event.target.value)}
              placeholder="ör. 20"
              className={inputClassName}
            />
          </label>
          <button
            type="button"
            onClick={handleRestock}
            disabled={isRestockPending}
            className="bg-brand hover:bg-brand-dark min-h-9.5 rounded-lg px-4 text-sm font-bold text-brand-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRestockPending ? "Kaydediliyor…" : "Satışa Aç"}
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmSoldOut}
        title="Ürünü tükendi yap"
        description={`"${variant.variantName}" varyantının mevcut stoğu (${variant.quantityAvailable}) sıfırlanacak. Emin misiniz?`}
        confirmLabel="Tükendi Yap"
        danger
        isPending={isSoldOutPending}
        onConfirm={handleMarkSoldOut}
        onCancel={() => setConfirmSoldOut(false)}
      />

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-foreground/50 text-xs">Mevcut Stok</p>
          <p className="text-foreground font-semibold">{variant.quantityAvailable}</p>
        </div>
        <div>
          <p className="text-foreground/50 text-xs">Rezerve</p>
          <p className="text-foreground font-semibold">{variant.quantityReserved}</p>
        </div>
        <div>
          <p className="text-foreground/50 text-xs">Kullanılabilir</p>
          <p className="text-foreground font-semibold">{sellable}</p>
        </div>
      </div>

      {state.message ? (
        <p className={`text-xs font-medium ${state.success ? "text-green-700" : "text-red-700"}`}>
          {state.message}
        </p>
      ) : null}

      <form action={formAction} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
        <label className="text-foreground flex flex-col gap-1 text-xs font-medium">
          İşlem
          <select name="type" defaultValue="PURCHASE_IN" className={inputClassName}>
            {ADMIN_INVENTORY_MOVEMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {ADMIN_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-foreground flex flex-col gap-1 text-xs font-medium">
          Miktar
          <input name="quantity" type="number" placeholder="ör. 20 veya -2" className={inputClassName} />
        </label>
        <label className="text-foreground flex flex-col gap-1 text-xs font-medium">
          Not <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          <input name="reason" type="text" placeholder="ör. hasarlı ürün, sayım düzeltmesi" className={inputClassName} />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand hover:bg-brand-dark min-h-[38px] rounded-lg px-4 text-sm font-bold text-brand-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Kaydediliyor…" : "Uygula"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setHistoryOpen((prev) => !prev)}
        className="text-brand w-fit text-xs font-semibold underline underline-offset-2"
      >
        {historyOpen ? "Hareket geçmişini gizle" : "Hareket geçmişini göster"}
      </button>

      {historyOpen ? (
        variant.movements.length === 0 ? (
          <p className="text-foreground/50 text-xs">Henüz hareket kaydı yok.</p>
        ) : (
          <div className="border-border-muted overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead className="bg-surface-muted text-foreground/60 uppercase">
                <tr>
                  <th className="px-3 py-2 font-semibold">Tarih</th>
                  <th className="px-3 py-2 font-semibold">Tür</th>
                  <th className="px-3 py-2 font-semibold">Miktar</th>
                  <th className="px-3 py-2 font-semibold">Not</th>
                </tr>
              </thead>
              <tbody className="divide-border-muted divide-y">
                {variant.movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-3 py-2">{formatDateTime(movement.createdAt)}</td>
                    <td className="px-3 py-2">{MOVEMENT_TYPE_LABELS[movement.type]}</td>
                    <td className={`px-3 py-2 font-semibold ${movement.quantityDelta < 0 ? "text-red-700" : "text-green-700"}`}>
                      {movement.quantityDelta > 0 ? "+" : ""}
                      {movement.quantityDelta}
                    </td>
                    <td className="px-3 py-2">{movement.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
}

/** Ürün düzenleme sayfasının varyant bazlı stok yönetimi bölümü — her değişiklik `InventoryMovement`+`AuditLog` ile izlenir. */
export function ProductStockManager({
  productId,
  variants,
}: {
  productId: string;
  variants: AdminVariantStockData[];
}) {
  const [confirmAllSoldOut, setConfirmAllSoldOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const hasSellableVariant = variants.some((v) => v.quantityAvailable - v.quantityReserved > 0);

  function handleMarkAllSoldOut() {
    startTransition(async () => {
      const result = await markAllProductVariantsSoldOutAction(productId);
      showToast(
        result.ok ? `${result.affectedCount} varyant tükendi olarak işaretlendi.` : result.message,
        result.ok ? "success" : "error",
      );
      setConfirmAllSoldOut(false);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-foreground text-lg font-semibold">Stok Yönetimi</h2>
        {variants.length > 1 && hasSellableVariant ? (
          <button
            type="button"
            onClick={() => setConfirmAllSoldOut(true)}
            className="border-border-muted hover:border-red-400 hover:text-red-700 min-h-9 rounded-lg border px-3 text-xs font-semibold transition-colors"
          >
            Tüm Varyantları Tükendi Yap
          </button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmAllSoldOut}
        title="Tüm varyantları tükendi yap"
        description="Bu ürünün TÜM varyantlarının mevcut stoğu sıfırlanacak. Emin misiniz?"
        confirmLabel="Tümünü Tükendi Yap"
        danger
        isPending={isPending}
        onConfirm={handleMarkAllSoldOut}
        onCancel={() => setConfirmAllSoldOut(false)}
      />

      {variants.map((variant) => (
        <VariantStockRow key={variant.variantId} productId={productId} variant={variant} />
      ))}
    </div>
  );
}
