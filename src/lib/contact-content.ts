/**
 * `/iletisim` sayfasının tek merkezi içerik kaynağı: talep türü seçenekleri
 * (etiket, `?talep=` URL değeri, etkinlik alanlarının gösterilip
 * gösterilmeyeceği) ve iletişim kanalları.
 * Component'ler bu değerleri tekrar hardcode etmez.
 */

export const CONTACT_REQUEST_TYPE_VALUES = [
  "GENERAL_INFO",
  "HENNA_SNACKS",
  "WEDDING_SNACKS",
  "ENGAGEMENT_INVITATION",
  "CORPORATE_BULK_ORDER",
  "OTHER",
] as const;

export type ContactRequestTypeValue = (typeof CONTACT_REQUEST_TYPE_VALUES)[number];

export interface ContactRequestTypeOption {
  value: ContactRequestTypeValue;
  label: string;
  /** Ana sayfa vb. yerlerden `/iletisim?talep=...` ile önceden seçim için kullanılan URL değeri. */
  querySlug: string;
  /** Bu talep türü seçiliyken etkinlik tarihi/tahmini kişi sayısı alanları gösterilsin mi? */
  isEventRelated: boolean;
}

export const CONTACT_REQUEST_TYPE_OPTIONS: ContactRequestTypeOption[] = [
  { value: "GENERAL_INFO", label: "Genel Bilgi", querySlug: "genel-bilgi", isEventRelated: false },
  {
    value: "HENNA_SNACKS",
    label: "Kına Çerezleri",
    querySlug: "kina-cerezleri",
    isEventRelated: true,
  },
  {
    value: "WEDDING_SNACKS",
    label: "Düğün Çerezleri",
    querySlug: "dugun-cerezleri",
    isEventRelated: true,
  },
  {
    value: "ENGAGEMENT_INVITATION",
    label: "Nişan / Davet",
    querySlug: "nisan-davet",
    isEventRelated: true,
  },
  {
    value: "CORPORATE_BULK_ORDER",
    label: "Kurumsal Toplu Sipariş",
    querySlug: "kurumsal-toplu-siparis",
    isEventRelated: true,
  },
  { value: "OTHER", label: "Diğer", querySlug: "diger", isEventRelated: false },
];

/** `?talep=` URL değerinden talep türünü çözer; tanınmayan/eksik değerde `null` döner. */
export function getContactRequestTypeByQuerySlug(
  querySlug: string | undefined,
): ContactRequestTypeValue | null {
  if (!querySlug) {
    return null;
  }
  return (
    CONTACT_REQUEST_TYPE_OPTIONS.find((option) => option.querySlug === querySlug)?.value ?? null
  );
}

export function getContactRequestTypeOption(
  value: ContactRequestTypeValue,
): ContactRequestTypeOption | undefined {
  return CONTACT_REQUEST_TYPE_OPTIONS.find((option) => option.value === value);
}

export interface ContactChannel {
  label: string;
  value: string;
  /** `tel:`/`mailto:`/`https://wa.me/...` gibi tıklanabilir hedef; yoksa düz metin gösterilir. */
  href?: string;
}

export interface ContactInfoData {
  phone: ContactChannel | null;
  whatsapp: ContactChannel | null;
  email: ContactChannel | null;
  address: ContactChannel | null;
  workingHours: ContactChannel | null;
}

const WHATSAPP_PHONE_E164 = "+905349567879";
const WHATSAPP_PREFILLED_MESSAGE = "Merhaba, OSSA Kuruyemiş ürünleri hakkında bilgi almak istiyorum.";

/** WhatsApp'a giden TÜM CTA'ların (iletişim kanalı + toplu sipariş bölümü) paylaştığı TEK bağlantı. */
export const WHATSAPP_CONTACT_HREF = `https://wa.me/905349567879?text=${encodeURIComponent(WHATSAPP_PREFILLED_MESSAGE)}`;

const WHATSAPP_SUPPORT_MESSAGE = "Merhaba, OSSA Kuruyemiş hakkında destek almak istiyorum.";
/** Footer "Canlı Destek" gibi destek-odaklı CTA'lar için — AYNI telefon numarası, farklı ön-dolu mesaj. */
export const WHATSAPP_SUPPORT_HREF = `https://wa.me/905349567879?text=${encodeURIComponent(WHATSAPP_SUPPORT_MESSAGE)}`;

/** Gerçek mağaza konumu — kullanıcı tarafından verilen paylaşım linki; TAHMİN EDİLEREK değiştirilmez. */
export const STORE_MAP_HREF = "https://share.google/jpTaKwO0KKLl41HLW";

/**
 * Gerçek işletme iletişim bilgileri (bkz. `docs/OPEN_QUESTIONS.md` #6/#12 —
 * artık netleşti). E-posta ve çalışma saatleri henüz paylaşılmadığından
 * `null` bırakıldı; sahte değer üretilmez.
 */
export const contactInfo: ContactInfoData = {
  phone: { label: "Telefon", value: "0534 956 78 79", href: `tel:${WHATSAPP_PHONE_E164}` },
  whatsapp: { label: "WhatsApp", value: "+90 534 956 78 79", href: WHATSAPP_CONTACT_HREF },
  email: null,
  address: {
    label: "Adres",
    value: "Karşıyaka Mah. Seyran Sk. No:2 A, 33600 Mut/Mersin",
    href: STORE_MAP_HREF,
  },
  workingHours: null,
};
