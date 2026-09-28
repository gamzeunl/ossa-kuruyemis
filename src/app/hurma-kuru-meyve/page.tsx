import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoryPageView } from "@/components/category/category-page-view";
import { getCategoryContent } from "@/lib/category-content";
import { publicEnv } from "@/config/env";

const SLUG = "hurma-kuru-meyve";

export function generateMetadata(): Metadata {
  const content = getCategoryContent(SLUG);
  if (!content) {
    return {};
  }

  return {
    title: { absolute: content.seoTitle },
    description: content.seoDescription,
    alternates: { canonical: `${publicEnv.NEXT_PUBLIC_SITE_URL}/${SLUG}` },
  };
}

export default async function HurmaKuruMeyvePage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string; sirala?: string; grup?: string }>;
}) {
  if (!getCategoryContent(SLUG)) {
    notFound();
  }

  const params = await searchParams;
  return <CategoryPageView slug={SLUG} searchParams={params} />;
}
