"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductAction } from "@/actions/admin-products";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast-provider";

/**
 * Ürün düzenleme sayfasının "Danger Zone" bölümü — güvenli silme akışı.
 * Asıl karar (hard-delete vs. arşivle) SUNUCUDA verilir (bkz.
 * `deleteOrArchiveProduct`); bu bileşen yalnızca onay + geri bildirim sağlar.
 */
export function ProductDangerZone({ productId, productName }: { productId: string; productName: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.ok) {
        showToast(result.message, "error");
        setConfirmOpen(false);
        return;
      }
      if (result.mode === "HARD_DELETE") {
        showToast("Ürün kalıcı olarak silindi.");
        router.push("/yonetim/urunler");
        return;
      }
      showToast(result.message, "error");
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-5">
      <div>
        <h2 className="text-base font-bold text-red-900">Danger Zone</h2>
        <p className="text-sm text-red-800/80">
          Bu ürünü mağazadan kaldırın veya (yalnızca hiçbir geçmiş kayıtta kullanılmadıysa) kalıcı olarak silin.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="min-h-10 w-fit rounded-lg bg-red-600 px-5 text-sm font-bold text-white transition-colors hover:bg-red-700"
      >
        Ürünü Sil
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Ürünü kaldır"
        description={`"${productName}" ürününü kaldırmak istediğinize emin misiniz? Geçmiş kayıtlarda kullanılmışsa kalıcı silinmez, mağazadan kaldırılır.`}
        confirmLabel="Kaldır"
        danger
        isPending={isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
