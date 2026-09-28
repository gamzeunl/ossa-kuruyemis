import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { getDeliveryInformationText } from "@/lib/delivery-info";

function AccordionItem({ title, content }: { title: string; content: ReactNode }) {
  return (
    <details className="border-border-muted/80 group border-b py-4 first:pt-0 last:border-b-0">
      <summary
        className="text-foreground hover:text-brand-dark focus-visible:outline-brand -mx-1 flex cursor-pointer list-none items-center justify-between gap-3 rounded px-1 py-0.5 text-sm font-bold tracking-tight transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {title}
        <ChevronDownIcon className="text-foreground/35 group-hover:text-brand h-4 w-4 shrink-0 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="group-open:animate-[accordion-fade-in_260ms_ease-out] pt-3">
        <div className="text-foreground/70 max-w-[65ch] text-sm leading-7 whitespace-pre-line wrap-break-word">
          {content}
        </div>
      </div>
    </details>
  );
}

/** İçindekiler/Alerjen ve Saklama/Menşe gibi tek accordion altında birden fazla alanı ayırmak için küçük etiket. */
function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-foreground/40 mb-1 text-[11px] font-bold tracking-[0.08em] uppercase">{children}</p>;
}

export interface ProductNutritionData {
  energyKcal: number | null;
  energyKj: number | null;
  fat: number | null;
  saturatedFat: number | null;
  carbohydrate: number | null;
  sugars: number | null;
  fiber: number | null;
  protein: number | null;
  salt: number | null;
}

interface NutritionRowProps {
  label: string;
  value: number | null;
  unit: string;
  indent?: boolean;
}

function NutritionRow({ label, value, unit, indent }: NutritionRowProps) {
  if (value === null) {
    return null;
  }
  return (
    <div className={`flex items-baseline justify-between py-2 ${indent ? "pl-4" : ""}`}>
      <span className={`text-sm ${indent ? "text-foreground/55" : "text-foreground font-medium"}`}>{label}</span>
      <span className="text-foreground text-sm font-semibold tabular-nums">
        {value} {unit}
      </span>
    </div>
  );
}

/** Çağıran taraf `hasNutritionData()` ile önce kontrol eder — bölüm hiç veri yoksa hiç render edilmez (accordion başlığı dahil). */
function hasNutritionData(nutrition: ProductNutritionData): boolean {
  return (
    nutrition.energyKcal !== null ||
    nutrition.energyKj !== null ||
    nutrition.fat !== null ||
    nutrition.saturatedFat !== null ||
    nutrition.carbohydrate !== null ||
    nutrition.sugars !== null ||
    nutrition.fiber !== null ||
    nutrition.protein !== null ||
    nutrition.salt !== null
  );
}

function NutritionTable({ nutrition }: { nutrition: ProductNutritionData }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-foreground/45 text-xs">100 g için</p>

      {/* `divide-y` yalnızca gerçekten render edilen (NULL olmayan) satırlar arasına çizgi
          koyar — bu sayede son görünür satırın altında hep gereksiz bir çizgi kalmaz. */}
      <div className="divide-border-muted/60 flex flex-col divide-y">
        {nutrition.energyKcal !== null || nutrition.energyKj !== null ? (
          <div className="flex items-baseline justify-between py-2">
            <span className="text-foreground text-sm font-medium">Enerji</span>
            <span className="text-foreground text-sm font-semibold tabular-nums">
              {nutrition.energyKcal !== null ? `${nutrition.energyKcal} kcal` : null}
              {nutrition.energyKcal !== null && nutrition.energyKj !== null ? " / " : null}
              {nutrition.energyKj !== null ? `${nutrition.energyKj} kJ` : null}
            </span>
          </div>
        ) : null}
        <NutritionRow label="Yağ" value={nutrition.fat} unit="g" />
        <NutritionRow label="Doymuş yağ" value={nutrition.saturatedFat} unit="g" indent />
        <NutritionRow label="Karbonhidrat" value={nutrition.carbohydrate} unit="g" />
        <NutritionRow label="Şekerler" value={nutrition.sugars} unit="g" indent />
        <NutritionRow label="Lif" value={nutrition.fiber} unit="g" />
        <NutritionRow label="Protein" value={nutrition.protein} unit="g" />
        <NutritionRow label="Tuz" value={nutrition.salt} unit="g" />
      </div>

      <p className="text-foreground/45 text-xs leading-5">Besin değerleri 100 g ürün için referans değerlerdir.</p>
    </div>
  );
}

interface ProductInformationSectionProps {
  description: string | null;
  shortDescription: string | null;
  ingredients: string | null;
  storageConditions: string | null;
  /** Ürüne özgü teslimat bilgisi override'ı — `null`/boşsa paylaşılan `getDeliveryInformationText()` kullanılır. */
  deliveryInfo: string | null;
  allergenInfo: string | null;
  originInfo: string | null;
  usageSuggestion: string | null;
  nutrition: ProductNutritionData;
}

/**
 * "Ürün Bilgileri" — Ürün Açıklaması her zaman açık ana blok; altında
 * yalnızca gerçekten dolu olan bölümler accordion olarak render edilir
 * (İçindekiler & Alerjenler / Besin Değerleri / Kullanım Önerisi /
 * Saklama & Menşei / Teslimat Bilgileri). Boş bir bölüm için sahte
 * "bilinmiyor" placeholder'ı ASLA gösterilmez — bölüm o zaman hiç render
 * edilmez.
 */
export function ProductInformationSection({
  description,
  shortDescription,
  ingredients,
  storageConditions,
  deliveryInfo,
  allergenInfo,
  originInfo,
  usageSuggestion,
  nutrition,
}: ProductInformationSectionProps) {
  const descriptionText = description ?? shortDescription;

  const ingredientsAllergensContent =
    ingredients || allergenInfo ? (
      <div className="flex flex-col gap-4">
        {ingredients ? (
          <div>
            <FieldLabel>İçindekiler</FieldLabel>
            <p className="text-foreground/75">{ingredients}</p>
          </div>
        ) : null}
        {allergenInfo ? (
          <div>
            <FieldLabel>Alerjen Bilgisi</FieldLabel>
            <p className="bg-gold-light/40 border-gold/25 text-brand-foreground w-fit rounded-md border px-3 py-2 text-sm font-medium">
              {allergenInfo}
            </p>
          </div>
        ) : null}
      </div>
    ) : null;

  const storageOriginContent =
    storageConditions || originInfo ? (
      <div className="flex flex-col gap-4">
        {storageConditions ? (
          <div>
            <FieldLabel>Saklama Koşulları</FieldLabel>
            <p className="text-foreground/75">{storageConditions}</p>
          </div>
        ) : null}
        {originInfo ? (
          <div>
            <FieldLabel>Menşei</FieldLabel>
            <p className="text-foreground/75">{originInfo}</p>
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-foreground text-xl font-bold tracking-tight">Ürün Bilgileri</h2>

      {descriptionText ? (
        <div className="flex flex-col gap-3">
          <p className="text-foreground/40 text-[11px] font-bold tracking-[0.08em] uppercase">Ürün Açıklaması</p>
          <div className="text-foreground/80 max-w-[65ch] text-base leading-8 whitespace-pre-line wrap-break-word">
            {descriptionText}
          </div>
        </div>
      ) : null}

      <div className="border-border-muted/80 border-t">
        {ingredientsAllergensContent ? (
          <AccordionItem title="İçindekiler & Alerjenler" content={ingredientsAllergensContent} />
        ) : null}
        {hasNutritionData(nutrition) ? (
          <AccordionItem title="Besin Değerleri" content={<NutritionTable nutrition={nutrition} />} />
        ) : null}
        {usageSuggestion ? (
          <AccordionItem
            title="Kullanım Önerisi"
            content={
              <div className="border-brand/50 border-l-2 pl-3">
                <p className="text-foreground/75">{usageSuggestion}</p>
              </div>
            }
          />
        ) : null}
        {storageOriginContent ? <AccordionItem title="Saklama & Menşei" content={storageOriginContent} /> : null}
        <AccordionItem title="Teslimat Bilgileri" content={deliveryInfo ?? getDeliveryInformationText()} />
      </div>
    </section>
  );
}
