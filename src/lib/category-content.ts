/**
 * Kategori sayfalarının (kısa açıklama, SEO) düzenlenebilir içeriği.
 * Şimdilik kod içinde sabit — alanlar bilerek düz/serileştirilebilir tutuldu
 * (fonksiyon değil, sade obje) ki ileride bir yönetim paneli/CMS kaynağına
 * kolayca taşınabilsin. Gerçek DB kategori adı/slug'ı burada tekrar edilmez;
 * yalnızca ek içerik alanları barındırılır.
 *
 * `longDescription`/`faq` alanları kategori sayfası daha ürün-odaklı hâle
 * getirilirken (kategori mimarisi görevi) bilinçli olarak kaldırıldı —
 * "Kategori Hakkında"/"Sıkça Sorulan Sorular" bölümleri artık render
 * edilmiyor. `CategoryFaq` component'i silinmedi, `/sss` sayfası ayrı
 * içerikle kullanmaya devam ediyor.
 */

/** `CategoryContent`'ten bağımsızlaştı — `/sss` sayfası (`site-faq.ts`) ve
 * `CategoryFaq` component'i hâlâ bu tipi kullanıyor. */
export interface CategoryFaqItem {
  question: string;
  answer: string;
}

export interface CategoryContent {
  slug: string;
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  /** Üst başlık bloğu için çok hafif, mevcut renk token'larıyla sınırlı arka
   * plan farkı — kategoriye küçük bir karakter katar, yeni renk EKLEMEZ. */
  sectionToneClassName?: string;
}

const categoryContentBySlug: Record<string, CategoryContent> = {
  cerez: {
    slug: "cerez",
    shortDescription: "Kavrulmuş, çiğ ve tuzlu çerez çeşitlerinden oluşan geniş bir seçki.",
    seoTitle: "Çerez Çeşitleri | OSSA Kuruyemiş",
    seoDescription:
      "Kavrulmuş, çiğ ve tuzlu çerez çeşitlerini OSSA Kuruyemiş güvencesiyle inceleyin.",
    sectionToneClassName: "bg-brand/5",
  },
  lokum: {
    slug: "lokum",
    shortDescription: "Geleneksel tariflerle hazırlanan lokum ve OSSA'ya özel çeşitler.",
    seoTitle: "Lokum Çeşitleri | OSSA Kuruyemiş",
    seoDescription: "Geleneksel ve OSSA'ya özel lokum çeşitlerini keşfedin.",
    sectionToneClassName: "bg-surface-muted",
  },
  "kurabiye-sekerleme": {
    slug: "kurabiye-sekerleme",
    shortDescription: "Kurabiye, çikolata ve şekerleme çeşitlerinden oluşan tatlı bir seçki.",
    seoTitle: "Kurabiye & Şekerleme Çeşitleri | OSSA Kuruyemiş",
    seoDescription: "Kurabiye, çikolata ve şekerleme çeşitlerini OSSA Kuruyemiş'te inceleyin.",
    sectionToneClassName: "bg-gold-light/30",
  },
  "cay-kahve": {
    slug: "cay-kahve",
    shortDescription: "Türk kahvesi, filtre kahve ve çay çeşitleriyle sohbetlere eşlik edin.",
    seoTitle: "Çay & Kahve Çeşitleri | OSSA Kuruyemiş",
    seoDescription: "Türk kahvesi, filtre kahve ve çay çeşitlerini OSSA Kuruyemiş'te keşfedin.",
    sectionToneClassName: "bg-brown/5",
  },
  baharat: {
    slug: "baharat",
    shortDescription: "Günlük mutfak kullanımı için temel baharat çeşitleri.",
    seoTitle: "Baharat Çeşitleri | OSSA Kuruyemiş",
    seoDescription: "Günlük mutfak kullanımı için temel baharat çeşitlerini inceleyin.",
    sectionToneClassName: "bg-brown-dark/5",
  },
  "hurma-kuru-meyve": {
    slug: "hurma-kuru-meyve",
    shortDescription: "Hurma ve kuru meyve çeşitleriyle doğal atıştırmalık seçenekleri.",
    seoTitle: "Hurma & Kuru Meyve Çeşitleri | OSSA Kuruyemiş",
    seoDescription: "Hurma ve kuru meyve çeşitlerini OSSA Kuruyemiş'te keşfedin.",
    sectionToneClassName: "bg-cream",
  },
};

export function getCategoryContent(slug: string): CategoryContent | null {
  return categoryContentBySlug[slug] ?? null;
}
