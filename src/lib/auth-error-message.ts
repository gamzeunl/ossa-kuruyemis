import { APIError } from "better-auth";

/**
 * Yalnızca Better Auth'un kendi ürettiği (kullanıcıya gösterilmek üzere
 * tasarlanmış) `APIError` mesajları doğrudan istemciye taşınır. Beklenmeyen
 * hatalar (ör. DB bağlantı sorunu) `.message` üzerinden ham/teknik içerik
 * sızdırmasın diye jenerik `fallback` ile değiştirilir; asıl hata yine de
 * konsola loglanır.
 */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof APIError) {
    return error.message;
  }
  console.error(error);
  return fallback;
}
