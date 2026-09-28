import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderResultView } from "@/components/checkout/order-result-view";
import { PageContainer } from "@/components/layout/container";
import { requireUser } from "@/server/auth/guard";
import { findOrderForUser } from "@/server/repositories/order-repository";

export const metadata: Metadata = { title: "Siparişim" };

/** Yalnızca oturumdaki kullanıcının KENDİ siparişi — DB sorgusunda `userId` ile doğrulanır. */
export default async function MyOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await requireUser(`/hesabim/siparisler/${orderNumber}`);
  const order = await findOrderForUser(orderNumber, user.id);

  if (!order) {
    notFound();
  }

  return (
    <PageContainer maxWidthClassName="max-w-[640px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/hesabim/siparisler" className="text-brand w-fit text-xs font-semibold">
          ← Siparişlerim
        </Link>
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Siparişim</h1>
      </div>
      <OrderResultView order={order} isLoggedIn showStatusTimeline />
    </PageContainer>
  );
}
