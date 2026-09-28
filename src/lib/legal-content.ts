import type { Metadata } from "next";
import { publicEnv } from "@/config/env";

/**
 * Bilgilendirme/hukuki sayfaların (`src/content/legal/*.ts`) ortak veri şekli.
 * Ağır metinler bu dosyada değil, her sayfanın kendi içerik dosyasında tutulur —
 * bu dosya yalnızca paylaşılan tip ve yardımcı fonksiyonları barındırır.
 */
export interface LegalSectionContent {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalPageContent {
  /** Rota, ör. "/teslimat-iade" — canonical URL üretimi için. */
  path: string;
  /** Sayfadaki tek `<h1>` ve breadcrumb'daki son öge. */
  title: string;
  /** `<title>` — kök layout şablonunu atlamak için `generateMetadata`'da `absolute` olarak kullanılır. */
  seoTitle: string;
  /** Başlığın altında sayfa içinde gösterilen giriş metni. */
  description: string;
  /**
   * `<meta name="description">` için AYRI bir metin gerekiyorsa (ör. sayfa-içi
   * giriş daha uzun/dokunaklı, arama sonucu özeti daha kısa/öz olmalıysa) —
   * verilmezse `description` her ikisi için de kullanılır (mevcut tüm sayfalar
   * bu varsayılanla değişmeden çalışmaya devam eder).
   */
  metaDescription?: string;
  /**
   * Sayfanın üstünde gösterilen dikkat çekici bilgilendirme notu — resmî işletme
   * bilgileri/nihai hukuki metin henüz tamamlanmadığını açıkça belirtmek için
   * (KVKK, Mesafeli Satış Sözleşmesi, Ön Bilgilendirme Formu gibi sayfalarda kullanılır).
   */
  notice?: string;
  sections: LegalSectionContent[];
}

/** Tüm hukuki/bilgilendirme sayfalarının ortak `generateMetadata` çıktısı. */
export function buildLegalMetadata(content: LegalPageContent): Metadata {
  return {
    title: { absolute: content.seoTitle },
    description: content.metaDescription ?? content.description,
    alternates: { canonical: `${publicEnv.NEXT_PUBLIC_SITE_URL}${content.path}` },
    robots: { index: true, follow: true },
  };
}
