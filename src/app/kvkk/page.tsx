import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { buildLegalMetadata } from "@/lib/legal-content";
import { kvkkContent } from "@/content/legal/kvkk";

export function generateMetadata(): Metadata {
  return buildLegalMetadata(kvkkContent);
}

export default function KvkkPage() {
  return <LegalPageLayout content={kvkkContent} />;
}
