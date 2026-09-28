import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderResultView } from "@/components/checkout/order-result-view";
import { PageContainer } from "@/components/layout/container";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { findOrderByResultAccessToken } from "@/server/repositories/order-repository";

export const metadata: Metadata = { title: "Sipariş Sonucu", robots: { index: false, follow: false } };

/**
 * Misafir + girişli herkes için opak `t` (resultAccessToken) doğrulanmadan
 * erişim verilmez — yalnızca sipariş numarasını bilmek yeterli değildir.
 */
export default async function OrderResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { orderNumber } = await params;
  const { t } = await searchParams;

  if (!t) {
    notFound();
  }

  const order = await findOrderByResultAccessToken(orderNumber, t);

  if (!order) {
    notFound();
  }

  // Yalnızca aksiyon butonlarının içeriğini belirler (bkz. OrderResultView) —
  // siparişin görüntülenmesi `resultAccessToken` doğrulamasına bağlıdır,
  // oturum durumuna değil; misafir de kendi siparişini token ile görebilir.
  const user = await betterAuthProvider.getCurrentUser();

  return (
    <PageContainer maxWidthClassName="max-w-[640px]" className="gap-6">
      <h1 className="text-foreground text-2xl font-bold tracking-tight">Sipariş Durumu</h1>
      <OrderResultView order={order} isLoggedIn={Boolean(user)} />
    </PageContainer>
  );
}
