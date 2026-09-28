import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { formatPrice } from "@/lib/format-money";
import { buildLegalMetadata, type LegalSectionContent } from "@/lib/legal-content";
import { teslimatIadeContent } from "@/content/legal/teslimat-iade";
import { getShippingSettings } from "@/server/services/site-setting-service";

export function generateMetadata(): Metadata {
  return buildLegalMetadata(teslimatIadeContent);
}

export default async function TeslimatIadePage() {
  const { freeShippingThreshold, standardShippingFee } = await getShippingSettings();

  // Ücretsiz kargo eşiği ve standart kargo ücreti yalnızca `SiteSetting`de
  // gerçek bir değer olarak tanımlıysa gösterilir; tanımlı değilse bu
  // bölümler hiç eklenmez (eski `/kargo-ve-teslimat` sayfasındaki AYNI desen).
  const dynamicSections: LegalSectionContent[] = [];

  if (freeShippingThreshold) {
    dynamicSections.push({
      heading: "Ücretsiz Kargo",
      paragraphs: [`${formatPrice(String(freeShippingThreshold))} ve üzeri siparişlerde kargo ücretsizdir.`],
    });
  }

  if (standardShippingFee) {
    dynamicSections.push({
      heading: "Standart Kargo Ücreti",
      paragraphs: [`Standart kargo ücreti ${formatPrice(String(standardShippingFee))} olarak uygulanır.`],
    });
  }

  // "İletişim" bölümünün hemen ÖNÜNE eklenir — sayfanın en sonu her zaman
  // iletişim bilgisiyle kapanır, kargo ücreti bilgisi ondan sonra kalmaz.
  const contactIndex = teslimatIadeContent.sections.findIndex((section) => section.heading === "İletişim");
  const sections =
    dynamicSections.length > 0 && contactIndex !== -1
      ? [
          ...teslimatIadeContent.sections.slice(0, contactIndex),
          ...dynamicSections,
          ...teslimatIadeContent.sections.slice(contactIndex),
        ]
      : teslimatIadeContent.sections;

  return <LegalPageLayout content={{ ...teslimatIadeContent, sections }} />;
}
