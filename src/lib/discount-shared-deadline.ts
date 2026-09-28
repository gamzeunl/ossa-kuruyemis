import type { ProductSummary } from "@/types/catalog";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS_AHEAD = 7;

function toCalendarDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * "Bu hafta sonuna kadar" gibi nötr bir bitiş etiketi YALNIZCA gösterilen
 * TÜM ürünlerin gerçek `discountEndsAt` tarihi doluysa, hepsi AYNI takvim
 * gününe denk geliyorsa VE o gün önümüzdeki 7 gün içindeyse üretilir.
 * Aksi halde `null` döner — gerçek tarihe dayanmayan bir metin ASLA
 * üretilmez (tek ürün, tarihsiz ürün veya farklı tarihli ürünler varsa gizlenir).
 */
export function resolveSharedDiscountDeadlineLabel(products: ProductSummary[], now: Date = new Date()): string | null {
  if (products.length === 0) {
    return null;
  }

  const endDates = products.map((product) => product.defaultVariant?.discountEndsAt ?? null);
  if (endDates.some((date) => date === null)) {
    return null;
  }

  const validDates = endDates as Date[];
  const firstKey = toCalendarDayKey(validDates[0]);
  const allSameDay = validDates.every((date) => toCalendarDayKey(date) === firstKey);
  if (!allSameDay) {
    return null;
  }

  const deadline = validDates[0];
  const daysAhead = (deadline.getTime() - now.getTime()) / ONE_DAY_MS;
  if (daysAhead < 0 || daysAhead > MAX_DAYS_AHEAD) {
    return null;
  }

  return "Bu hafta sonuna kadar";
}
