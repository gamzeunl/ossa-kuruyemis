import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddressForm } from "@/components/account/address-form";
import { PageContainer } from "@/components/layout/container";
import { addressToFormValues } from "@/lib/address-form-values";
import { requireUser } from "@/server/auth/guard";
import { findAddressForUser } from "@/server/repositories/address-repository";

export const metadata: Metadata = { title: "Adresi Düzenle" };

export default async function AdresDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/hesabim/adresler/${id}/duzenle`);

  const address = await findAddressForUser(id, user.id);
  if (!address) {
    notFound();
  }

  return (
    <PageContainer maxWidthClassName="max-w-2xl" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/hesabim/adresler" className="text-brand w-fit text-xs font-semibold">
          ← Adreslerim
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{address.title}</h1>
      </div>

      <AddressForm addressId={address.id} initialValues={addressToFormValues(address)} />
    </PageContainer>
  );
}
