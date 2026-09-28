/**
 * Admin genelindeki TEK durum rozeti render primitive'i — ürün/sipariş/
 * kampanya/yorum/blog/stok durumları hepsi BU component'i kullanır, her
 * ekran kendi renk paletini icat etmez (bkz. görev: "Status renkleri
 * tutarlı olsun"). Anlam → ton eşlemesi sabittir:
 *  - success (yeşil): Aktif, Tamamlandı, Onaylandı
 *  - warning (amber):  Taslak, Bekliyor, Planlandı
 *  - danger (kırmızı): Tükendi, İptal, Reddedildi
 *  - neutral (gri):    Pasif, Kaldırıldı, Sona Erdi
 * Her ekran kendi enum'ına özgü `label` metnini seçer, yalnızca bu 4 ton
 * arasından birini kullanır — rastgele renk dağıtılmaz.
 */
export type StatusTone = "success" | "warning" | "danger" | "neutral";

const TONE_CLASSNAME: Record<StatusTone, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  neutral: "bg-surface-muted text-foreground/60",
};

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${TONE_CLASSNAME[tone]}`}
    >
      {label}
    </span>
  );
}
