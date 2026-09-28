import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";

// Erişim zaten `requireRole("ADMIN", ...)` ile korunuyor; `noindex` yalnızca
// ek bir savunma katmanı — bir admin URL'i bir şekilde dışarıdan bağlanırsa
// arama motorlarının onu indekslemesini engeller (robots.txt disallow tek
// başına zaten indekslenmiş bir URL'i kaldırmaz).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Tüm `/yonetim/**` sayfalarını saran ORTAK kabuk (sidebar + mobil drawer +
 * üst şerit: sayfa marka alanı, admin adı, çıkış). Yetki kontrolünü
 * TEKRARLAMAZ/DEĞİŞTİRMEZ — her sayfa kendi `requireRole("ADMIN", ...)`
 * çağrısını korur (çift katman güvenlik deseni: sayfa + server action).
 * Buradaki `getCurrentUser()` çağrısı SALT görsel amaçlıdır (üst şeritte
 * admin adını göstermek için), bir yetkilendirme kontrolü DEĞİLDİR.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await betterAuthProvider.getCurrentUser();
  return <AdminShell adminName={user ? `${user.firstName} ${user.lastName}` : null}>{children}</AdminShell>;
}
