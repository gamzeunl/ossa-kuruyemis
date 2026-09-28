import { ChevronDownIcon } from "@/components/ui/icons";
import type { CategoryFaqItem } from "@/lib/category-content";

/**
 * Kategori sayfası SSS bölümü — native `<details>` accordion (PDP'nin
 * ProductInformationSection'ıyla aynı desen). `/sss` sayfası da konu başına
 * bu AYNI component'i (farklı `heading` ile) reuse eder — ayrı bir
 * soru-cevap sistemi yazılmaz.
 */
export function CategoryFaq({
  items,
  heading = "Sıkça Sorulan Sorular",
}: {
  items: CategoryFaqItem[];
  heading?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-foreground text-xl font-bold tracking-tight">{heading}</h2>
      <div className="border-border-muted border-t">
        {items.map((item) => (
          <details key={item.question} className="group border-border-muted border-b py-4">
            <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold">
              {item.question}
              <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="text-foreground/70 pt-3 text-sm leading-6">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
