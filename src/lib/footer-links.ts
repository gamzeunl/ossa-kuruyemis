import { WHATSAPP_SUPPORT_HREF } from "@/lib/contact-content";

/**
 * Footer'ın statik link yapılandırması — `footer.tsx`'ten ayrı tutulur ki
 * hem test edilebilir olsun hem de "Kategoriler" (dinamik) dışındaki
 * bölümlerin TÜMÜNÜN artık gerçek hedeflere gittiği tek yerden görülebilsin.
 */
export interface FooterLinkItem {
  label: string;
  href?: string;
  /** `true` ise yeni sekmede, `rel="noopener noreferrer"` ile açılan düz `<a>` (ör. WhatsApp). */
  external?: boolean;
}

export interface FooterSection {
  title: string;
  items: FooterLinkItem[];
}

export const FOOTER_STATIC_SECTIONS: FooterSection[] = [
  {
    title: "Kurumsal",
    items: [
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "Blog", href: "/blog" },
      { label: "KVKK", href: "/kvkk" },
      { label: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
    ],
  },
  {
    title: "Müşteri Hizmetleri",
    items: [
      { label: "Sıkça Sorulan Sorular", href: "/sss" },
      { label: "Sipariş Takibi", href: "/siparis-takibi" },
      { label: "Teslimat ve İade", href: "/teslimat-iade" },
      { label: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis-sozlesmesi" },
      { label: "Canlı Destek", href: WHATSAPP_SUPPORT_HREF, external: true },
    ],
  },
  {
    title: "İletişim",
    items: [
      { label: "Bize Ulaşın", href: "/iletisim" },
      { label: "Mağaza Bilgileri", href: "/iletisim#magaza" },
    ],
  },
];

/**
 * Alt bar — iyzico başvuru incelemesinin genelde ilk baktığı, en görünür
 * hukuki linkler kompakt biçimde burada da TEKRARLANIR (üstteki kolonlarda
 * zaten var olsalar da) + yalnızca alt barda yaşayan iki sayfa
 * (Kullanım Koşulları, Ön Bilgilendirme Formu) yetim kalmasın diye eklenir.
 */
export const FOOTER_LEGAL_ITEMS: { label: string; href: string }[] = [
  { label: "KVKK", href: "/kvkk" },
  { label: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
  { label: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis-sozlesmesi" },
  { label: "Teslimat ve İade", href: "/teslimat-iade" },
  { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
  { label: "Ön Bilgilendirme Formu", href: "/on-bilgilendirme-formu" },
];

/**
 * Footer'ın "Kategoriler" listesinden hariç tutulan kategori slug'ları —
 * `category-menu.tsx`'teki mega menü ile AYNI kural (`kampanyali-paketler`
 * bir kampanya/paket grubu, footer'ın genel kategori keşfine dahil edilmez).
 */
export const EXCLUDED_FOOTER_CATEGORY_SLUGS: readonly string[] = ["kampanyali-paketler"];
