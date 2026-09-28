/**
 * Admin'in elle girdiği kargo takip linki gibi harici URL'ler için TEK
 * güvenlik kontrolü — yalnızca `http:`/`https:` protokolüne izin verir.
 * `javascript:`/`data:`/`vbscript:` vb. XSS'e açık şemalar reddedilir.
 */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
