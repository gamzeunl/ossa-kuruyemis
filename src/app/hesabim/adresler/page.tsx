import type { Metadata } from "next";
import Link from "next/link";
import { AddressCard } from "@/components/account/address-card";
import { PageContainer } from "@/components/layout/container";
import { requireUser } from "@/server/auth/guard";
import { listAddressesForUser } from "@/server/repositories/address-repository";

export const metadata: Metadata = {
  title: "Adreslerim",
  description: "Kayıtlı teslimat ve fatura adreslerinizi yönetin.",
};

export default async function AdreslerimPage() {
  const user = await requireUser("/hesabim/adresler");
  const addresses = await listAddressesForUser(user.id);

  return (
    <PageContainer maxWidthClassName="max-w-3xl" className="gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Adreslerim</h1>
          <p className="text-foreground/60 text-sm">Kayıtlı teslimat ve fatura adreslerinizi yönetin.</p>
        </div>
        <Link
          href="/hesabim/adresler/yeni"
          className="bg-brand hover:bg-brand-dark text-brand-foreground inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition-colors"
        >
          Yeni Adres Ekle
        </Link>
      </div>

      {addresses.length === 0 ? (
        <div className="border-border-muted text-foreground/60 rounded-2xl border border-dashed p-8 text-center text-sm">
          Henüz kayıtlı bir adresiniz yok.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard key={address.id} address={address} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
