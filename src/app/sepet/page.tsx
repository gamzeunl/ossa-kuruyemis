import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CartPageContent } from "@/components/cart/cart-page-content";
import { getShippingSettings } from "@/server/services/site-setting-service";

export const metadata: Metadata = {
  title: "Sepetim",
  description: "Sepetinizdeki ürünleri gözden geçirin.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  // Checkout ile aynı desen: kargo ayarları burada, sunucu tarafında TEK sefer
  // okunur ve prop olarak geçirilir — 1500/120 değerleri component içinde
  // tekrar yazılmaz.
  const shippingSettings = await getShippingSettings();

  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-6">
      <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Sepetim" }]} />

      <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Sepetim</h1>

      <CartPageContent shippingSettings={shippingSettings} />
    </PageContainer>
  );
}
