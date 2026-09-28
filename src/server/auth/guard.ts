import { redirect } from "next/navigation";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import type { AuthUser, Role } from "@/types/provider";

/**
 * Sayfa/route seviyesinde yetkilendirme yardımcıları. `AuthProvider`'ın throw eden
 * requireUser/requireRole/requireAnyRole metotlarından farklı olarak burada oturum
 * yoksa `/giris`'e, rol yetersizse `/yetkisiz`'e yönlendirilir — Server Component'lerde
 * (page.tsx) kullanılmak üzere tasarlanmıştır. Her korumalı sayfa kendi yolunu (callbackPath)
 * açıkça belirtir; mevcut path cookie/query'den değil, çağıran sayfadan gelir.
 */

function signInPath(callbackPath: string): string {
  return `/giris?callbackURL=${encodeURIComponent(sanitizeRedirectPath(callbackPath))}`;
}

export async function requireUser(callbackPath: string): Promise<AuthUser> {
  const user = await betterAuthProvider.getCurrentUser();
  if (!user) {
    redirect(signInPath(callbackPath));
  }
  return user;
}

export async function requireRole(role: Role, callbackPath: string): Promise<AuthUser> {
  const user = await requireUser(callbackPath);
  if (user.role !== role) {
    redirect("/yetkisiz");
  }
  return user;
}

export async function requireAnyRole(roles: Role[], callbackPath: string): Promise<AuthUser> {
  const user = await requireUser(callbackPath);
  if (!roles.includes(user.role)) {
    redirect("/yetkisiz");
  }
  return user;
}
