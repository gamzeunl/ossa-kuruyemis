"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PaymentReturnPage() {
  const [message, setMessage] = useState("Sipariş durumunuz açılıyor...");

  useEffect(() => {
    const url = sessionStorage.getItem("ossa_pending_order_result");

    if (url && /^\/siparis-sonucu\/[^/?#]+\?t=[^&#]+$/.test(url)) {
      sessionStorage.removeItem("ossa_pending_order_result");
      window.location.replace(url);
      return;
    }

    setMessage(
      "Sipariş bağlantısı bulunamadı. Ödeme yaptıysanız yeniden sipariş oluşturmayın; sipariş durumunuz için bizimle iletişime geçin."
    );
  }, []);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-2xl font-bold">Ödeme Sonucu</h1>
      <p role="status">{message}</p>
      <Link href="/iletisim" className="underline">
        İletişime Geç
      </Link>
    </main>
  );
}
