
"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createMarketingCampaignAction,
  updateMarketingCampaignAction,
} from "@/actions/admin-marketing-campaigns";
import { CampaignCountdown } from "@/components/campaign/campaign-countdown";
import {
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_TYPE_OPTIONS,
  computeDefaultEndsAt,
} from "@/lib/campaign-type-preset";
import { toDateTimeLocalValue } from "@/lib/datetime-local";
import type { MarketingCampaignType } from "@/generated/prisma/client";

export interface MarketingCampaignAdminFormValues {
  name: string;
  type: MarketingCampaignType;
  startsAt: string;
  endsAt: string;
  headline: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  showOnHomepage: boolean;
  showPopup: boolean;
  variantIds: string[];
  campaignPrices?: Record<string, string>;
}

interface VariantOption {
  id: string;
  label: string;
  price: string;
}

interface MarketingCampaignAdminFormProps {
  /** campaignId yoksa oluşturma, varsa düzenleme modu. */
  campaignId?: string;
  initialValues: MarketingCampaignAdminFormValues;
  variantOptions: VariantOption[];
}

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = {
  message: null,
  success: false,
};

const labelClassName =
  "text-foreground text-sm font-medium flex flex-col gap-1.5";

const inputClassName =
  "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors";

const sectionHeadingClassName =
  "text-foreground/50 text-xs font-bold tracking-[0.14em] uppercase";

export function MarketingCampaignAdminForm({
  campaignId,
  initialValues,
  variantOptions,
}: MarketingCampaignAdminFormProps) {
  const [type, setType] = useState<MarketingCampaignType>(
    initialValues.type
  );

  const [startsAt, setStartsAt] = useState(initialValues.startsAt);
  const [endsAt, setEndsAt] = useState(initialValues.endsAt);
  const [headline, setHeadline] = useState(initialValues.headline);
  const [description, setDescription] = useState(initialValues.description);
  const [variantSearch, setVariantSearch] = useState("");

  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>(
    initialValues.variantIds
  );

  const [campaignPrices, setCampaignPrices] = useState<
    Record<string, string>
  >(initialValues.campaignPrices ?? {});

  function handleTypeChange(nextType: MarketingCampaignType) {
    setType(nextType);

    // Tür değiştiğinde bitiş tarihi yeniden önerilir.
    const base = startsAt ? new Date(startsAt) : new Date();

    if (!Number.isNaN(base.getTime())) {
      setEndsAt(
        toDateTimeLocalValue(computeDefaultEndsAt(nextType, base))
      );
    }
  }

  function handleVariantSelection(
    variantId: string,
    checked: boolean
  ) {
    setSelectedVariantIds((previous) => {
      if (checked) {
        return previous.includes(variantId)
          ? previous
          : [...previous, variantId];
      }

      return previous.filter((id) => id !== variantId);
    });
  }

  function handleCampaignPriceChange(
    variantId: string,
    value: string
  ) {
    setCampaignPrices((previous) => ({
      ...previous,
      [variantId]: value,
    }));
  }

  async function action(
    _prevState: FormState,
    formData: FormData
  ): Promise<FormState> {
    const result = campaignId
      ? await updateMarketingCampaignAction(campaignId, formData)
      : await createMarketingCampaignAction(formData);

    return result.ok
      ? { message: "Kaydedildi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(
    action,
    initialState
  );

  const filteredVariantOptions = useMemo(() => {
    const term = variantSearch.trim().toLocaleLowerCase("tr-TR");

    if (!term) {
      return variantOptions;
    }

    return variantOptions.filter((option) =>
      option.label.toLocaleLowerCase("tr-TR").includes(term)
    );
  }, [variantOptions, variantSearch]);

  const previewEndsAtIso = useMemo(() => {
    const date = new Date(endsAt);

    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString();
  }, [endsAt]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <form
        action={formAction}
        noValidate
        className="flex flex-col gap-8"
      >
        {/* Seçilen tüm varyantları gönder. */}
        {selectedVariantIds.map((variantId) => (
          <input
            key={`variant-${variantId}`}
            type="hidden"
            name="variantIds"
            value={variantId}
          />
        ))}

        {/* Seçilen varyantların kampanyalı fiyatlarını gönder. */}
        {selectedVariantIds.map((variantId) => (
          <input
            key={`price-${variantId}`}
            type="hidden"
            name={`campaignPrice_${variantId}`}
            value={campaignPrices[variantId] ?? ""}
          />
        ))}

        {state.message ? (
          <div
            role={state.success ? "status" : "alert"}
            className={`rounded-lg border px-4 py-3 text-sm ${
              state.success
                ? "border-green-300 bg-green-50 text-green-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        {/* TEMEL BİLGİLER */}
        <section className="flex flex-col gap-4">
          <h2 className={sectionHeadingClassName}>
            Temel Bilgiler
          </h2>

          <label className={labelClassName}>
            Kampanya Adı
            <input
              name="name"
              type="text"
              required
              maxLength={160}
              defaultValue={initialValues.name}
              placeholder="ör. Ağustos Fırsatları"
              className={inputClassName}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className={labelClassName}>
              Kampanya Türü
              <select
                name="type"
                value={type}
                onChange={(event) =>
                  handleTypeChange(
                    event.target.value as MarketingCampaignType
                  )
                }
                className={inputClassName}
              >
                {CAMPAIGN_TYPE_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              Başlangıç
              <input
                name="startsAt"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(event) =>
                  setStartsAt(event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label className={labelClassName}>
              Bitiş
              <input
                name="endsAt"
                type="datetime-local"
                required
                value={endsAt}
                onChange={(event) =>
                  setEndsAt(event.target.value)
                }
                className={inputClassName}
              />
            </label>
          </div>

          <p className="text-foreground/50 text-xs">
            Tür yalnızca bitiş tarihi önerisi içindir —
            gerçek aktiflik her zaman başlangıç/bitiş
            tarihine göre hesaplanır, tarihleri istediğiniz
            gibi değiştirebilirsiniz.
          </p>
        </section>

        {/* SUNUM */}
        <section className="flex flex-col gap-4">
          <h2 className={sectionHeadingClassName}>
            Sunum
          </h2>

          <label className={labelClassName}>
            Başlık{" "}
            <span className="text-foreground/40 font-normal">
              (isteğe bağlı — boşsa kampanya adı kullanılır)
            </span>
            <input
              name="headline"
              type="text"
              maxLength={200}
              value={headline}
              onChange={(event) =>
                setHeadline(event.target.value)
              }
              className={inputClassName}
            />
          </label>

          <label className={labelClassName}>
            Kısa Açıklama{" "}
            <span className="text-foreground/40 font-normal">
              (isteğe bağlı)
            </span>
            <textarea
              name="description"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              className={inputClassName}
            />
          </label>

          <div className="flex flex-wrap gap-6">
            <label className="text-foreground flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="showOnHomepage"
                defaultChecked={
                  initialValues.showOnHomepage
                }
              />
              Ana Sayfada Göster
            </label>

            <label className="text-foreground flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="showPopup"
                defaultChecked={initialValues.showPopup}
              />
              Popup&apos;ta Göster
            </label>
          </div>
        </section>

        {/* ÜRÜNLER */}
        <section className="flex flex-col gap-3">
          <h2 className={sectionHeadingClassName}>
            Ürünler
          </h2>

          <input
            type="search"
            value={variantSearch}
            onChange={(event) =>
              setVariantSearch(event.target.value)
            }
            placeholder="Ürün/varyant ara…"
            className={inputClassName}
          />

          <p className="text-foreground/60 text-xs">
            {selectedVariantIds.length} ürün/varyant seçildi.
            Seçtiğiniz her varyant için ayrı kampanyalı
            fiyat belirleyebilirsiniz.
          </p>

          <div className="border-border-muted max-h-96 overflow-y-auto rounded-lg border">
            {filteredVariantOptions.length === 0 ? (
              <p className="text-foreground/50 p-4 text-sm">
                Eşleşen ürün/varyant yok.
              </p>
            ) : (
              <ul className="divide-border-muted divide-y">
                {filteredVariantOptions.map((option) => {
                  const isSelected =
                    selectedVariantIds.includes(option.id);

                  return (
                    <li
                      key={option.id}
                      className="px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) =>
                              handleVariantSelection(
                                option.id,
                                event.target.checked
                              )
                            }
                          />
                          <span>{option.label}</span>
                        </label>

                        <span className="text-foreground/50 shrink-0 text-sm">
                          Normal fiyat: ₺{option.price}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="mt-3 rounded-lg bg-surface-muted p-3">
                          <label className="flex flex-col gap-1.5 text-xs font-medium">
                            Kampanyalı Fiyat (₺)
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              inputMode="decimal"
                              placeholder="Örn. 599"
                              value={
                                campaignPrices[option.id] ?? ""
                              }
                              onChange={(event) =>
                                handleCampaignPriceChange(
                                  option.id,
                                  event.target.value
                                )
                              }
                              className={inputClassName}
                            />
                          </label>

                          <p className="text-foreground/50 mt-1 text-xs">
                            Bu fiyat yalnızca ilgili ürün
                            varyantına uygulanacaktır.
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="text-foreground/50 text-xs">
            En az bir ürün/varyant seçilmelidir.
          </p>
        </section>

        {/* YAYIN */}
        <section className="flex flex-col gap-3">
          <h2 className={sectionHeadingClassName}>
            Yayın
          </h2>

          <label className="text-foreground flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialValues.isActive}
            />
            Aktif
          </label>

          <input
            type="hidden"
            name="sortOrder"
            value={initialValues.sortOrder}
          />
        </section>

        <button
          type="submit"
          disabled={isPending}
          className="bg-brand hover:bg-brand-dark w-fit min-h-11 rounded-full px-6 text-sm font-bold text-brand-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>

      {/* CANLI ÖNİZLEME */}
      <aside className="border-border-muted bg-surface-muted flex h-fit flex-col gap-3 rounded-2xl border p-5">
        <span className={sectionHeadingClassName}>
          Önizleme
        </span>

        <div className="rounded-xl bg-gradient-to-br from-[color-mix(in_srgb,var(--gold-light)_70%,transparent)] via-[color-mix(in_srgb,var(--gold-light)_25%,transparent)] to-transparent p-4">
          <span className="text-brand text-xs font-bold tracking-wide uppercase">
            {CAMPAIGN_TYPE_LABELS[type]} Kampanya
          </span>

          <p className="text-foreground mt-1 text-lg font-extrabold tracking-tight">
            {headline ||
              initialValues.name ||
              "Kampanya Adı"}
          </p>

          {description ? (
            <p className="text-foreground/60 mt-1 text-sm">
              {description}
            </p>
          ) : null}

          {previewEndsAtIso ? (
            <CampaignCountdown
              endsAt={previewEndsAtIso}
              className="bg-brand text-brand-foreground mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold"
            />
          ) : null}
        </div>

        <p className="text-foreground/50 text-xs">
          Homepage ve popup gösterimi bu bilgilerle
          oluşturulur — gerçek ürünler/kaydedilmiş
          kampanyada görünür.
        </p>
      </aside>
    </div>
  );
}
