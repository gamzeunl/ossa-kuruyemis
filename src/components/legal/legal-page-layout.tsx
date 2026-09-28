import { PageContainer } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LegalNotice } from "@/components/legal/legal-notice";
import { LegalSection } from "@/components/legal/legal-section";
import type { LegalPageContent } from "@/lib/legal-content";

/**
 * Tüm bilgilendirme/hukuki sayfaların (`/teslimat-iade`, `/kvkk` vb.) ortak
 * iskeleti: breadcrumb, tek `<h1>`, opsiyonel uyarı notu, masaüstünde sticky
 * içindekiler navigasyonu ve bölümler. Sayfa dosyaları yalnızca içerik verisini
 * bu bileşene geçirir.
 */
export function LegalPageLayout({ content }: { content: LegalPageContent }) {
  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-8">
      <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: content.title }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          {content.title}
        </h1>
        <p className="text-foreground/60 max-w-2xl text-sm leading-6 sm:text-base">
          {content.description}
        </p>
      </div>

      {content.notice ? <LegalNotice message={content.notice} /> : null}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        {content.sections.length > 1 ? (
          <nav aria-label="İçindekiler" className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-2">
              <p className="text-foreground/50 text-xs font-semibold tracking-wide uppercase">
                İçindekiler
              </p>
              <ul className="flex flex-col gap-1.5">
                {content.sections.map((section, index) => (
                  <li key={section.heading}>
                    <a
                      href={`#bolum-${index}`}
                      className="text-foreground/60 hover:text-brand block text-sm transition-colors"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        ) : null}

        <div className="flex flex-col gap-10">
          {content.sections.map((section, index) => (
            <LegalSection key={section.heading} id={`bolum-${index}`} section={section} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
