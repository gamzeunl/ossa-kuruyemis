import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { formatPrice } from "@/lib/format-money";
import { buildLegalMetadata, type LegalSectionContent } from "@/lib/legal-content";
import { preInformationContent } from "@/content/legal/pre-information";
import { getShippingSettings } from "@/server/services/site-setting-service";

export function generateMetadata(): Metadata {
  return buildLegalMetadata(preInformationContent);
}

export default async function OnBilgilendirmeFormuPage() {
  const { freeShippingThreshold, standardShippingFee } = await getShippingSettings();

  // "Ek Masraflar" bölümüne, `kargo-ve-teslimat` sayfasındaki AYNI desenle,
  // gerçek kargo eşiği/ücreti (varsa) eklenir — sabit bir sayı hiç yazılmaz.
  const extraCostLines: string[] = [];
  if (freeShippingThreshold) {
    extraCostLines.push(`${formatPrice(String(freeShippingThreshold))} ve üzeri siparişlerde kargo ücretsizdir.`);
  }
  if (standardShippingFee) {
    extraCostLines.push(`Standart kargo ücreti ${formatPrice(String(standardShippingFee))} olarak uygulanır.`);
  }

  const sections: LegalSectionContent[] =
    extraCostLines.length > 0
      ? preInformationContent.sections.map((section) =>
          section.heading === "Ek Masraflar"
            ? { ...section, paragraphs: [...(section.paragraphs ?? []), ...extraCostLines] }
            : section,
        )
      : preInformationContent.sections;

  return <LegalPageLayout content={{ ...preInformationContent, sections }} />;
}
