import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { buildLegalMetadata } from "@/lib/legal-content";
import { distanceSalesContent } from "@/content/legal/distance-sales";

export function generateMetadata(): Metadata {
  return buildLegalMetadata(distanceSalesContent);
}

export default function MesafeliSatisSozlesmesiPage() {
  return <LegalPageLayout content={distanceSalesContent} />;
}
