import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/container";
import { OrderTrackingForm } from "@/components/order-tracking/order-tracking-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { publicEnv } from "@/config/env";

export function generateMetadata(): Metadata {
  return {
    title: { absolute: "Sipariş Takibi | OSSA Kuruyemiş" },
    description: "Sipariş numaranız ve e-posta veya telefon bilginizle sipariş durumunuzu sorgulayın.",
    alternates: { canonical: `${publicEnv.NEXT_PUBLIC_SITE_URL}/siparis-takibi` },
    robots: { index: false, follow: true },
  };
}

/** Giriş yapmadan sipariş sorgulama — güvenlik: orderNumber TEK BAŞINA yetmez, e-posta/telefon eşleşmesi de gerekir (bkz. `order-tracking-service.ts`). */
export default function SiparisTakibiPage() {
  return (
    <PageContainer maxWidthClassName="max-w-[640px]" className="gap-8">
      <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Sipariş Takibi" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Sipariş Takibi</h1>
        <p className="text-foreground/60 text-sm leading-6 sm:text-base">
          Sipariş numaranızı ve siparişte kullandığınız e-posta veya telefon bilginizi girerek sipariş durumunuzu
          görüntüleyebilirsiniz.
        </p>
      </div>

      <OrderTrackingForm />
    </PageContainer>
  );
}
