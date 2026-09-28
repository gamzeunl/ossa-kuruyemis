import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { buildLegalMetadata } from "@/lib/legal-content";
import { privacyContent } from "@/content/legal/privacy";

export function generateMetadata(): Metadata {
  return buildLegalMetadata(privacyContent);
}

export default function GizlilikPolitikasiPage() {
  return <LegalPageLayout content={privacyContent} />;
}
