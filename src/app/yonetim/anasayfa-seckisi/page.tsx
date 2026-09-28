import type { Metadata } from "next";
import Link from "next/link";
import {
  HomepageSelectionAdminForm,
  type HomepageSelectionAdminFormValues,
} from "@/components/admin/homepage-selection-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { getHomepageSelectionForAdmin } from "@/server/repositories/homepage-selection-repository";
import { listActiveProductOptions } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Anasayfa Seçkisi Yönetimi" };

export default async function AdminHomepageSelectionPage() {
  await requireRole("ADMIN", "/yonetim/anasayfa-seckisi");

  const [selection, productOptions] = await Promise.all([
    getHomepageSelectionForAdmin(),
    listActiveProductOptions(),
  ]);

  const initialValues: HomepageSelectionAdminFormValues = {
    isActive: selection?.isActive ?? false,
    eyebrow: selection?.eyebrow ?? "",
    title: selection?.title ?? "",
    description: selection?.description ?? "",
    ctaLabel: selection?.ctaLabel ?? "Seçkiyi Keşfet",
    ctaHref: selection?.ctaHref ?? "/urunler",
    imageUrl: selection?.imageUrl ?? null,
    imageAlt: selection?.imageAlt ?? "",
    productIds: selection?.productIds ?? [],
  };

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/anasayfa" className="text-brand w-fit text-xs font-semibold">
          ← Anasayfa Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Anasayfa Seçkisi</h1>
        <p className="text-foreground/60 text-sm">
          Ana sayfadaki &ldquo;OSSA&apos;dan Seçtiklerimiz&rdquo; editoryal bölümünü yönetin. Bölüm yalnızca aktif
          VE en az bir ürün seçiliyken ana sayfada görünür.
        </p>
      </div>

      <HomepageSelectionAdminForm initialValues={initialValues} productOptions={productOptions} />
    </PageContainer>
  );
}
