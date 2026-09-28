import { contactInfo } from "@/lib/contact-content";

/**
 * OSSA'nın doğrulanmış YASAL/işletme kimlik bilgileri — iyzico Sanal POS
 * başvurusu ve hukuki sayfalar (`distance-sales.ts`, `pre-information.ts`,
 * `/iletisim`) için TEK kaynak. `address`/`phone` `contact-content.ts`'teki
 * gerçek, zaten canlı değerleri REUSE eder (burada tekrar yazılmaz).
 *
 * Doğrulanmamış alanlar (`email, kep, mersis, taxOfficeAndNumber,
 * chamberName, chamberRulesUrl, registeredTrademark`) bilerek `null`
 * bırakılmıştır — UYDURULMAZ ve hiçbir yerde placeholder/"doğrulanıyor"
 * metniyle de gösterilmez; yalnızca işletme bu bilgileri paylaştığında
 * ilgili alan doldurulur, tüketen kod (`getVerifiedBusinessInfoFields`)
 * otomatik olarak göstermeye başlar.
 */
export interface BusinessLegalInfo {
  displayName: string;
  proprietorName: string;
  address: string;
  phone: string;
  email: string | null;
  kep: string | null;
  mersis: string | null;
  taxOfficeAndNumber: string | null;
  chamberName: string | null;
  chamberRulesUrl: string | null;
  registeredTrademark: string | null;
}

export const businessLegalInfo: BusinessLegalInfo = {
  displayName: "OSSA Kuruyemiş",
  proprietorName: "Osman Sarı",
  address: contactInfo.address?.value ?? "",
  phone: contactInfo.phone?.value ?? "",
  email: null,
  kep: null,
  mersis: null,
  taxOfficeAndNumber: null,
  chamberName: null,
  chamberRulesUrl: null,
  registeredTrademark: null,
};

export interface BusinessInfoField {
  label: string;
  value: string;
  href?: string;
}

/**
 * Yalnızca DOLU alanları döner — `/iletisim`'in "İşletme Bilgileri" bölümü
 * bunu doğrudan render eder. Doğrulanmamış bir alan eklendiğinde (ör. KEP
 * netleştiğinde) yalnızca `businessLegalInfo`'yu güncellemek yeterlidir,
 * gösterim otomatik güncellenir.
 */
export function getVerifiedBusinessInfoFields(): BusinessInfoField[] {
  const fields: BusinessInfoField[] = [
    { label: "İşletme", value: businessLegalInfo.displayName },
    { label: "Yetkili / Mükellef", value: businessLegalInfo.proprietorName },
    { label: "Adres", value: businessLegalInfo.address },
    { label: "Telefon", value: businessLegalInfo.phone },
  ];
  if (businessLegalInfo.email) {
    fields.push({ label: "E-posta", value: businessLegalInfo.email });
  }
  if (businessLegalInfo.kep) {
    fields.push({ label: "KEP", value: businessLegalInfo.kep });
  }
  if (businessLegalInfo.mersis) {
    fields.push({ label: "MERSİS No", value: businessLegalInfo.mersis });
  }
  if (businessLegalInfo.chamberName) {
    fields.push({
      label: "Meslek Odası",
      value: businessLegalInfo.chamberName,
      href: businessLegalInfo.chamberRulesUrl ?? undefined,
    });
  }
  if (businessLegalInfo.registeredTrademark) {
    fields.push({ label: "Marka Tescili", value: businessLegalInfo.registeredTrademark });
  }
  return fields;
}
