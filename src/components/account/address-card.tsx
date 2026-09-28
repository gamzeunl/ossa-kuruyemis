import Link from "next/link";
import { deleteAddressAction } from "@/actions/addresses";
import { ContentDeleteForm } from "@/components/admin/content-delete-form";
import type { Address } from "@/generated/prisma/client";

const ADDRESS_TYPE_LABELS: Record<Address["type"], string> = {
  SHIPPING: "Teslimat",
  BILLING: "Fatura",
  BOTH: "Teslimat + Fatura",
};

export function AddressCard({ address }: { address: Address }) {
  return (
    <div className="border-border-muted bg-surface flex flex-col gap-3 rounded-2xl border p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-foreground text-base font-bold">{address.title}</h2>
          {address.isDefault ? (
            <span className="bg-brand/10 text-brand-dark rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap">
              Varsayılan
            </span>
          ) : null}
        </div>
        <span className="border-border-muted text-foreground/60 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap">
          {ADDRESS_TYPE_LABELS[address.type]}
        </span>
      </div>

      <div className="text-foreground/70 flex flex-col gap-0.5 text-sm leading-6">
        <p className="text-foreground font-medium">
          {address.firstName} {address.lastName}
        </p>
        <p>{address.phone}</p>
        <p className="wrap-break-word">{address.addressLine}</p>
        <p>
          {address.district} / {address.city}
        </p>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <Link href={`/hesabim/adresler/${address.id}/duzenle`} className="text-brand hover:text-brand-dark text-sm font-semibold">
          Düzenle
        </Link>
        <ContentDeleteForm
          action={deleteAddressAction.bind(null, address.id)}
          confirmMessage="Bu adresi silmek istediğinize emin misiniz?"
        />
      </div>
    </div>
  );
}
