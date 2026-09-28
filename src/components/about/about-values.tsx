const values = [
  {
    title: "Özenli Ürün Seçimi",
    description: "Ürün çeşitlerimizi oluştururken kalite ve ürün deneyimini ön planda tutuyoruz.",
  },
  {
    title: "Özenli Paketleme",
    description:
      "Siparişlerin hazırlanmasından paketlenmesine kadar her aşamada ürünlerin korunmasına dikkat ediyoruz.",
  },
  {
    title: "Güvenli Alışveriş",
    description: "Ürün seçimi, sepet ve ödeme sürecinin sade ve güvenilir olmasını önemsiyoruz.",
  },
  {
    title: "Ulaşılabilir Hizmet",
    description:
      "Sorularınız, özel talepleriniz ve toplu siparişleriniz için bizimle doğrudan iletişim kurabilirsiniz.",
  },
];

/**
 * "Bizim için önemli olan" — 4 büyük kart YERİNE tek geniş, ince ayraçlı dikey
 * liste (numaralı satırlar). "Neden OSSA" bölümünün (yatay kolon/ayraç düzeni)
 * bilinçli olarak farklı bir ritmi var — burada her koşulda dikey liste.
 */
export function AboutValues() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
        Bizim için önemli olan
      </h2>

      <div className="border-border-muted divide-border-muted flex flex-col divide-y rounded-2xl border">
        {values.map((value, index) => (
          <div key={value.title} className="flex flex-col gap-1.5 p-6 sm:flex-row sm:items-baseline sm:gap-6">
            <span className="text-brand w-10 shrink-0 text-sm font-bold" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-foreground text-base font-bold">{value.title}</h3>
              <p className="text-foreground/70 max-w-xl text-sm leading-6">{value.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
