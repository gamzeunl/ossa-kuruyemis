import { randomInt } from "node:crypto";

/**
 * Müşteriye gösterilecek sipariş numarasının TEK üretim kaynağı. Prisma `id`
 * (cuid) doğrudan müşteriye gösterilmez — tahmin edilemez ama okunabilir bir
 * biçim üretir: `OSSA-YYYYMMDD-XXXXXX`. Karışabilecek karakterler (0/O, 1/I)
 * alfabeden çıkarılmıştır. Rastgelelik `node:crypto`'nun kriptografik
 * `randomInt`'i ile sağlanır — `Math.random()` KULLANILMAZ.
 */
const SUFFIX_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SUFFIX_LENGTH = 6;

function randomSuffix(): string {
  let suffix = "";
  for (let i = 0; i < SUFFIX_LENGTH; i += 1) {
    suffix += SUFFIX_ALPHABET[randomInt(SUFFIX_ALPHABET.length)];
  }
  return suffix;
}

export function generateOrderNumber(now: Date = new Date()): string {
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  return `OSSA-${datePart}-${randomSuffix()}`;
}
