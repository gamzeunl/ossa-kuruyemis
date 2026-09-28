import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { buildLegalMetadata } from "@/lib/legal-content";
import { termsContent } from "@/content/legal/terms";

export function generateMetadata(): Metadata {
  return buildLegalMetadata(termsContent);
}

export default function KullanimKosullariPage() {
  return <LegalPageLayout content={termsContent} />;
}
