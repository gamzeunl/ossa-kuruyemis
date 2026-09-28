"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { bulkProductActionAction, deleteProductAction, type BulkProductAction } from "@/actions/admin-products";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StatusBadge, type StatusTone } from "@/components/admin/status-badge";
import { useToast } from "@/components/admin/toast-provider";
import { formatPrice } from "@/lib/format-money";
import type { AdminProductListRow } from "@/server/repositories/product-repository";

const STATUS_BADGE: Record<string, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: "Aktif", tone: "success" },
  DRAFT: { label: "Taslak", tone: "warning" },
  ARCHIVED: { label: "Kaldırıldı", tone: "neutral" },
};

const BULK_ACTION_CONFIG: Record<BulkProductAction, { label: string; confirm: string }> = {
  ACTIVATE: { label: "Aktif Yap", confirm: "Seçili ürünleri aktif yapmak istediğinize emin misiniz?" },
  ARCHIVE: { label: "Mağazadan Kaldır", confirm: "Seçili ürünleri mağazadan kaldırmak istediğinize emin misiniz?" },
  MARK_SOLD_OUT: { label: "Tükendi Yap", confirm: "Seçili ürünlerin tüm varyantlarını tükendi yapmak istediğinize emin misiniz?" },
};

export function ProductAdminTable({ products }: { products: AdminProductListRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<BulkProductAction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  const allSelected = products.length > 0 && selected.size === products.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function runBulkAction() {
    if (!pendingAction) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      const result = await bulkProductActionAction(ids, pendingAction);
      showToast(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        setSelected(new Set());
      }
      setPendingAction(null);
    });
  }

  function runDelete() {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const result = await deleteProductAction(deleteTarget.id);
      if (!result.ok) {
        showToast(result.message, "error");
        setDeleteTarget(null);
        return;
      }
      showToast(
        result.mode === "HARD_DELETE" ? "Ürün kalıcı olarak silindi." : result.message,
        result.mode === "HARD_DELETE" ? "success" : "error",
      );
      setDeleteTarget(null);
      router.refresh();
    });
  }

  if (products.length === 0) {
    return (
      <div role="status" className="border-border-muted text-foreground/60 rounded-md border p-10 text-center text-sm">
        Bu filtrelerle eşleşen ürün bulunmuyor.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 ? (
        <div className="border-border-muted bg-surface-muted flex flex-wrap items-center gap-3 rounded-xl border p-3">
          <span className="text-foreground text-sm font-semibold">{selected.size} ürün seçildi</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(BULK_ACTION_CONFIG) as BulkProductAction[]).map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setPendingAction(action)}
                disabled={isPending}
                className="border-border-muted hover:border-brand min-h-9 rounded-lg border bg-white px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {BULK_ACTION_CONFIG[action].label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-border-muted overflow-x-auto rounded-xl border">
        <table className="w-full min-w-225 text-left text-sm">
          <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Tüm ürünleri seç"
                  className="h-4 w-4"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Ürün</th>
              <th className="px-4 py-3 font-semibold">Kategori</th>
              <th className="px-4 py-3 font-semibold">Fiyat</th>
              <th className="px-4 py-3 font-semibold">Durum</th>
              <th className="px-4 py-3 font-semibold">Stok</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-border-muted divide-y">
            {products.map((product) => {
              const statusConfig = STATUS_BADGE[product.status] ?? STATUS_BADGE.ARCHIVED;
              return (
                <tr key={product.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleOne(product.id)}
                      aria-label={`${product.name} ürününü seç`}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="border-border-muted bg-surface-muted relative block h-11 w-11 shrink-0 overflow-hidden rounded-lg border">
                        {product.primaryImageUrl ? (
                          <Image
                            src={product.primaryImageUrl}
                            alt={product.primaryImageAlt ?? product.name}
                            fill
                            unoptimized
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <div className="min-w-0">
                        <p className="text-foreground truncate font-medium">{product.name}</p>
                        <p className="text-foreground/40 truncate text-xs">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{product.categoryName ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground/70">
                    {product.startingPrice ? formatPrice(product.startingPrice) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={statusConfig.label} tone={statusConfig.tone} />
                  </td>
                  <td className="px-4 py-3">
                    {product.isOutOfStock ? (
                      <StatusBadge label="Tükendi" tone="danger" />
                    ) : (
                      <StatusBadge label="Satışta" tone="success" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/yonetim/urunler/${product.id}`}
                        className="text-brand font-semibold underline underline-offset-2"
                      >
                        Düzenle
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                        className="font-semibold text-red-700 underline underline-offset-2"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        title="Toplu işlemi onayla"
        description={pendingAction ? BULK_ACTION_CONFIG[pendingAction].confirm : undefined}
        confirmLabel="Onayla"
        danger={pendingAction === "ARCHIVE"}
        isPending={isPending}
        onConfirm={runBulkAction}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Bu ürünü silmek istediğinize emin misiniz?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" — geçmiş kayıtlarda kullanılmışsa kalıcı silinmez, mağazadan kaldırılır.`
            : undefined
        }
        confirmLabel="Sil"
        danger
        isPending={isDeleting}
        onConfirm={runDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
