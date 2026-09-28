/** Yorum/blog gibi müşteriye gösterilen tarihler için tek biçimlendirme kaynağı. */
export function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(value);
}

/** "16 Ağustos 23:59" — fırsat bitiş zamanı gibi gün+saat gösterimleri için (countdown DEĞİL, sabit server-render metin). */
export function formatShortDateTime(value: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
