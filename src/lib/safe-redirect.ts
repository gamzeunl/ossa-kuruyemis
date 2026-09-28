const SAFE_REDIRECT_DEFAULT = "/";

/**
 * Yalnızca aynı origin'e ait, göreli bir path olup olmadığını kontrol eder.
 * "//evil.com" ve "/\evil.com" gibi protokol-göreli/tarayıcı-normalizasyon
 * açık yönlendirme (open redirect) yöntemlerini reddeder.
 */
export function isSafeRedirectPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/\\")) return false;
  return true;
}

/** Güvensiz veya boş bir değer verilirse site köküne düşer; asla dış domain döndürmez. */
export function sanitizeRedirectPath(path: string | undefined): string {
  if (!path || !isSafeRedirectPath(path)) {
    return SAFE_REDIRECT_DEFAULT;
  }
  return path;
}
