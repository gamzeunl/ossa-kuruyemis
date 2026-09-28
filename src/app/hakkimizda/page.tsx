import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AboutCta } from "@/components/about/about-cta";
import { AboutHero } from "@/components/about/about-hero";
import { AboutStory } from "@/components/about/about-story";
import { AboutValues } from "@/components/about/about-values";
import { publicEnv } from "@/config/env";

export function generateMetadata(): Metadata {
  return {
    title: { absolute: "Hakkımızda | OSSA Kuruyemiş" },
    description:
      "OSSA Kuruyemiş'i yakından tanıyın. Özenle seçilen ürünler, güvenli alışveriş ve kaliteli hizmet anlayışımız hakkında bilgi edinin.",
    alternates: { canonical: `${publicEnv.NEXT_PUBLIC_SITE_URL}/hakkimizda` },
  };
}

export default function HakkimizdaPage() {
  return (
    <PageContainer maxWidthClassName="max-w-[1000px]" className="gap-14">
      <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Hakkımızda" }]} />

      <AboutHero />
      <AboutStory />
      <AboutValues />
      <AboutCta />
    </PageContainer>
  );
}
