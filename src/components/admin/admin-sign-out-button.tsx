"use client";

import { useTransition } from "react";
import { signOutAction } from "@/actions/auth";

/**
 * Yönetim header'ının kompakt "Çıkış" butonu — `/hesabim`'deki `SignOutButton`
 * ile AYNI `signOutAction`'ı çağırır (ikinci bir çıkış mekanizması OLUŞTURULMAZ),
 * yalnızca dar bir header şeridine uygun küçük bir görsel varyanttır.
 */
export function AdminSignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => signOutAction())}
      className="border-border-muted hover:border-red-400 hover:text-red-700 min-h-8 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Çıkış yapılıyor…" : "Çıkış yap"}
    </button>
  );
}
