/**
 * Sayfa girişi — fotoğraf/hero görseli/büyük dekoratif alan YOK, yalnızca
 * eyebrow + başlık + kısa alt metin. İçerik kadar yer kaplar, 400-500px'lik
 * boş bir hero alanı OLUŞTURULMAZ.
 */
export function AboutHero() {
  return (
    <section className="flex flex-col gap-4">
      <span className="text-brand text-xs font-bold tracking-[0.18em] uppercase">Hakkımızda</span>
      <h1 className="text-foreground max-w-2xl text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
        Lezzeti özenle seçiyor,
        <br />
        güvenle sunuyoruz.
      </h1>
      <p className="text-foreground/70 max-w-xl text-sm leading-7 sm:text-base">
        OSSA Kuruyemiş olarak kuruyemişten lokuma, kahveden baharata kadar farklı lezzetleri bir araya
        getiriyor; ürünlerimizi özenli bir alışveriş deneyimiyle müşterilerimize ulaştırmayı
        amaçlıyoruz.
      </p>
    </section>
  );
}
