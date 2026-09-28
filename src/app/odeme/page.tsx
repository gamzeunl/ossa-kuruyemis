import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/container";
import { CheckoutPageContent } from "@/components/checkout/checkout-page-content";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { isIyzicoConfigured } from "@/lib/payment-provider-status";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { listAddressesForUser } from "@/server/repositories/address-repository";
import { getShippingSettings } from "@/server/services/site-setting-service";

export const metadata: Metadata = {
  title: "Teslimat ve Sipariş Bilgileri",
  description: "Teslimat bilgilerinizi girin, kargo yönteminizi ve sipariş özetinizi görün.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  // Kargo ayarları ve (girişliyse) kayıtlı adresler burada, sunucu tarafında TEK
  // sefer okunur ve alt component'lere prop olarak geçirilir — client-side fetch
  // eklenmez. `listAddressesForUser` zaten `userId` scope'ludur (IDOR'a kapalı);
  // checkout'a yeni bir "addressId al" endpoint'i EKLENMEZ.
  const user = await betterAuthProvider.getCurrentUser();
  const [shippingSettings, savedAddresses] = await Promise.all([
    getShippingSettings(),
    user ? listAddressesForUser(user.id) : Promise.resolve([]),
  ]);

  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-6">
      <Breadcrumb
        items={[{ label: "Ana Sayfa", href: "/" }, { label: "Sepetim", href: "/sepet" }, { label: "Ödeme" }]}
      />

      <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
        Teslimat ve Sipariş Bilgileri
      </h1>

      <CheckoutPageContent
        shippingSettings={shippingSettings}
        savedAddresses={savedAddresses}
        isLoggedIn={Boolean(user)}
        isIyzicoConfigured={isIyzicoConfigured()}
      />
    </PageContainer>
  );
}
