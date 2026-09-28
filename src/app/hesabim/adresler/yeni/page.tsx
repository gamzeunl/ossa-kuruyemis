import type { Metadata } from "next";
import Link from "next/link";
import { AddressForm } from "@/components/account/address-form";
import { PageContainer } from "@/components/layout/container";
import { emptyAddressFormValues } from "@/lib/address-form-values";
import { requireUser } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Yeni Adres" };

export default async function YeniAdresPage() {
  await requireUser("/hesabim/adresler/yeni");

  return (
    <PageContainer maxWidthClassName="max-w-2xl" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/hesabim/adresler" className="text-brand w-fit text-xs font-semibold">
          ← Adreslerim
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Adres Ekle</h1>
      </div>

      <AddressForm initialValues={emptyAddressFormValues} />
    </PageContainer>
  );
}
