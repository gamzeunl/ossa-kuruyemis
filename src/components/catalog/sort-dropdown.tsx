"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";

const sortOptions = [
  { value: "", label: "Önerilen" },
  { value: "fiyat-artan", label: "Fiyat Artan" },
  { value: "fiyat-azalan", label: "Fiyat Azalan" },
  { value: "a-z", label: "A-Z" },
  { value: "z-a", label: "Z-A" },
  { value: "en-yeniler", label: "En Yeniler" },
];

/** Mevcut `kategori`/`ara` parametrelerini koruyarak `sirala`'yı günceller, sayfayı 1'e döndürür. */
export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get("sirala") ?? "";

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value) {
      params.set("sirala", event.target.value);
    } else {
      params.delete("sirala");
    }
    params.delete("sayfa");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <label
        htmlFor="sort-select"
        className="text-foreground/60 text-sm font-medium whitespace-nowrap"
      >
        Sırala
      </label>
      <select
        id="sort-select"
        value={currentValue}
        onChange={handleChange}
        className="border-border-muted focus:border-gold w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium outline-none sm:w-auto"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
