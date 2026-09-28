import type { LegalSectionContent } from "@/lib/legal-content";

export function LegalSection({ id, section }: { id: string; section: LegalSectionContent }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-foreground text-lg font-bold tracking-tight sm:text-xl">
        {section.heading}
      </h2>

      <div className="mt-3 flex flex-col gap-3">
        {section.paragraphs?.map((paragraph, index) => (
          <p key={index} className="text-foreground/70 text-sm leading-7 sm:text-base">
            {paragraph}
          </p>
        ))}

        {section.list && section.list.length > 0 ? (
          <ul className="text-foreground/70 flex list-disc flex-col gap-2 pl-5 text-sm leading-7 sm:text-base">
            {section.list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
