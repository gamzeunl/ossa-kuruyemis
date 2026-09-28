"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { ToastProvider } from "@/components/admin/toast-provider";

/**
 * Yönetim paneli kabuğu — masaüstünde kalıcı sol sidebar, mobilde hamburger +
 * drawer. Drawer iskeleti `mini-cart.tsx`'teki (fixed inset-0 + backdrop +
 * ESC/backdrop kapatma + `translate-x` geçişi) AYNI kanıtlanmış deseni
 * kullanır — dış sarmalayıcıda BİLEREK `overflow-hidden` var: kapalı
 * durumdaki `-translate-x-full` panel, önceki bir oturumda mini-cart'ta
 * tespit edilip düzeltilen yatay-taşma hatasının AYNISINI burada baştan önler.
 * Üst şerit TÜM genişliklerde görünür (önceden yalnızca mobilde vardı) —
 * marka alanı + (varsa) admin adı + çıkış; sayfa başlığı her sayfanın kendi
 * `<h1>`'inde kalır, burada tekrarlanmaz.
 */
export function AdminShell({ children, adminName }: { children: ReactNode; adminName: string | null }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        {/* Üst şerit — tüm genişliklerde: marka + (mobilde) hamburger + admin adı + çıkış */}
        <header className="border-border-muted bg-surface flex items-center justify-between gap-3 border-b px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Menüyü aç"
              aria-expanded={isDrawerOpen}
              className="border-border-muted hover:border-brand flex h-9 w-9 items-center justify-center rounded-lg border transition-colors lg:hidden"
            >
              <svg
                viewBox="0 0 20 20"
                className="text-foreground h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
            <span className="text-foreground text-sm font-bold">OSSA Yönetim</span>
          </div>
          <div className="flex items-center gap-3">
            {adminName ? <span className="text-foreground/60 hidden text-xs sm:inline">{adminName}</span> : null}
            <AdminSignOutButton />
          </div>
        </header>

        <div className="flex flex-1 flex-col lg:flex-row">
          {/* Masaüstü: kalıcı sol sidebar */}
          <aside className="border-border-muted bg-surface hidden w-64 shrink-0 border-r p-5 lg:block">
            <AdminSidebar />
          </aside>

          {/* Mobil: hamburger ile açılan drawer */}
          <div
            aria-hidden={!isDrawerOpen}
            className={`fixed inset-0 z-100 overflow-hidden lg:hidden ${isDrawerOpen ? "" : "pointer-events-none"}`}
          >
            <div
              onClick={() => setIsDrawerOpen(false)}
              className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                isDrawerOpen ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Yönetim navigasyonu"
              className={`bg-surface absolute top-0 left-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto p-5 shadow-2xl transition-transform duration-300 ${
                isDrawerOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-foreground text-sm font-bold">Menü</span>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Menüyü kapat"
                  className="text-foreground/60 hover:text-foreground text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <AdminSidebar onNavigate={() => setIsDrawerOpen(false)} />
            </div>
          </div>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
