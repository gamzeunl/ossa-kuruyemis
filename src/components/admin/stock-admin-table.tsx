"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { markVariantSoldOutAction } from "@/actions/admin-products";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast-provider";
import type { AdminVariantStockRow } from "@/server/repositories/inventory-repository";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export interface StockRowData extends Omit<AdminVariantStockRow, "lastMovementAt"> {
  lastMovementAt: string | null;
}

export function StockAdminTable({ rows }: { rows: StockRowData[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const sellableRows = rows.filter((row) => row.sellable > 0);
  const allSelected = sellableRows.length > 0 && sellableRows.every((row) => selected.has(row.variantId));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(sellableRows.map((row) => row.variantId)));
  }

  function toggleOne(variantId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  }

  function runBulkMarkSoldOut() {
    const ids = Array.from(selected);
    startTransition(async () => {
      const productIdByVariant = new Map(rows.map((row) => [row.variantId, row.productId]));
      let affected = 0;
      for (const variantId of ids) {
        const productId = productIdByVariant.get(variantId);
        if (!productId) continue;
        const result = await markVariantSoldOutAction(productId, variantId);
        if (result.ok) affected += 1;
      }
      showToast(`${affected} varyant tükendi olarak işaretlendi.`, affected > 0 ? "success" : "error");
      setSelected(new Set());
      setConfirmBulk(false);
    });
  }

  if (rows.length === 0) {
    return (
      <div role="status" className="border-border-muted text-foreground/60 rounded-md border p-10 text-center text-sm">
        Tükenen ürün bulunmuyor.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 ? (
        <div className="border-border-muted bg-surface-muted flex flex-wrap items-center gap-3 rounded-xl border p-3">
          <span className="text-foreground text-sm font-semibold">{selected.size} varyant seçildi</span>
          <button
            type="button"
            onClick={() => setConfirmBulk(true)}
            disabled={isPending}
            className="border-border-muted hover:border-red-400 hover:text-red-700 min-h-9 rounded-lg border bg-white px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            Seçilenleri Tükendi Yap
          </button>
        </div>
      ) : null}

      <div className="border-border-muted overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Tüm satılabilir varyantları seç"
                  className="h-4 w-4"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Ürün</th>
              <th className="px-4 py-3 font-semibold">Varyant</th>
              <th className="px-4 py-3 font-semibold">Mevcut</th>
              <th className="px-4 py-3 font-semibold">Rezerve</th>
              <th className="px-4 py-3 font-semibold">Kullanılabilir</th>
              <th className="px-4 py-3 font-semibold">Son Hareket</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-border-muted divide-y">
            {rows.map((row) => (
              <tr
                key={row.variantId}
                className={row.sellable <= 0 ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-surface-muted/50"}
              >
                <td className="px-4 py-3">
                  {row.sellable > 0 ? (
                    <input
                      type="checkbox"
                      checked={selected.has(row.variantId)}
                      onChange={() => toggleOne(row.variantId)}
                      aria-label={`${row.productName} - ${row.variantName} seç`}
                      className="h-4 w-4"
                    />
                  ) : null}
                </td>
                <td className="px-4 py-3 font-medium">{row.productName}</td>
                <td className="px-4 py-3 text-foreground/70">
                  {row.variantName} <span className="text-foreground/40">({row.sku})</span>
                </td>
                <td className="px-4 py-3">{row.quantityAvailable}</td>
                <td className="px-4 py-3">{row.quantityReserved}</td>
                <td className={`px-4 py-3 font-semibold ${row.sellable <= 0 ? "text-red-700" : "text-foreground"}`}>
                  {row.sellable <= 0 ? "Tükendi" : row.sellable}
                </td>
                <td className="px-4 py-3 text-foreground/60 text-xs">{formatDate(row.lastMovementAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/yonetim/urunler/${row.productId}`}
                    className="text-brand text-xs font-semibold underline underline-offset-2"
                  >
                    Ürüne Git
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmBulk}
        title="Seçilenleri tükendi yap"
        description={`${selected.size} varyantın mevcut stoğu sıfırlanacak. Bu işlemi yanlışlıkla geniş bir seçimde çalıştırmadığınızdan emin olun.`}
        confirmLabel="Tükendi Yap"
        danger
        isPending={isPending}
        onConfirm={runBulkMarkSoldOut}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}
