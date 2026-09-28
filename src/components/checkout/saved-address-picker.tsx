"use client";

import type { Address } from "@/generated/prisma/client";

export type AddressSelection = "new" | string;

interface SavedAddressPickerProps {
  addresses: Address[];
  selected: AddressSelection;
  onSelect: (selection: AddressSelection) => void;
  /** Aynı sayfada birden fazla seçici (teslimat + fatura) olabileceğinden radio `name` çakışmasın diye. */
  groupName: string;
}

/**
 * Kompakt, premium radio-kart seçici — checkout'ta büyük adres kartları/modal
 * editör YOK, yalnızca seçim + `/hesabim/adresler/{id}/duzenle`'a (yeni
 * sekmede) giden küçük bir "Düzenle" linki. Seçim, formun input değerlerini
 * DOLDURMAK dışında hiçbir şey yapmaz — sunucuya `addressId` gönderilmez.
 */
export function SavedAddressPicker({ addresses, selected, onSelect, groupName }: SavedAddressPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-foreground/50 text-xs font-semibold tracking-wide uppercase">Kayıtlı Adreslerim</span>
      <div className="flex flex-col gap-2">
        {addresses.map((address) => {
          const isSelected = selected === address.id;
          return (
            <label
              key={address.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                isSelected ? "border-brand bg-brand/5" : "border-border-muted hover:border-brand/40"
              }`}
            >
              <input
                type="radio"
                name={groupName}
                value={address.id}
                checked={isSelected}
                onChange={() => onSelect(address.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                  isSelected ? "border-brand bg-brand text-brand-foreground" : "border-border-muted text-transparent"
                }`}
              >
                ✓
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground text-sm font-bold">{address.title}</span>
                  <a
                    href={`/hesabim/adresler/${address.id}/duzenle`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="text-brand hover:text-brand-dark text-xs font-semibold"
                  >
                    Düzenle
                  </a>
                </span>
                <span className="text-foreground/60 block text-xs leading-5 wrap-break-word">
                  {address.firstName} {address.lastName} · {address.addressLine}
                </span>
                <span className="text-foreground/50 block text-xs">
                  {address.district} / {address.city}
                </span>
              </span>
            </label>
          );
        })}

        <label
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
            selected === "new" ? "border-brand bg-brand/5" : "border-border-muted hover:border-brand/40"
          }`}
        >
          <input
            type="radio"
            name={groupName}
            value="new"
            checked={selected === "new"}
            onChange={() => onSelect("new")}
            className="sr-only"
          />
          <span aria-hidden="true" className="text-foreground/60 text-base font-bold">
            +
          </span>
          <span className="text-foreground text-sm font-semibold">Farklı bir adres kullan</span>
        </label>
      </div>
    </div>
  );
}
