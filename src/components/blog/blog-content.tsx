import Link from "next/link";
import { parseBlogContentBlocks, splitInlineBold } from "@/lib/blog-content-blocks";

/** Bir paragraf metnini `**kalın**` desteğiyle render eder — TEK inline metin render noktası. */
function InlineText({ text }: { text: string }) {
  return (
    <>
      {splitInlineBold(text).map((segment, index) =>
        segment.bold ? <strong key={index}>{segment.text}</strong> : <span key={index}>{segment.text}</span>,
      )}
    </>
  );
}

/**
 * `BlogPost.content`'in TEK render noktası — `parseBlogContentBlocks`
 * (`@/lib/blog-content-blocks`) ile ayrıştırılan blokları H2/H3/paragraf/
 * liste/tablo olarak semantik HTML'e çevirir. `/blog/[slug]` dışında ikinci
 * bir içerik render sistemi OLUŞTURULMAZ.
 */
export function BlogContent({ content }: { content: string }) {
  const blocks = parseBlogContentBlocks(content);

  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading2":
            return (
              <h2 key={index} className="text-foreground mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                {block.text}
              </h2>
            );
          case "heading3":
            return (
              <h3 key={index} className="text-foreground text-lg font-bold tracking-tight">
                {block.text}
              </h3>
            );
          case "list":
            return (
              <ul key={index} className="flex flex-col gap-2 pl-1">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-foreground/80 flex items-start gap-2 text-[15px] leading-7">
                    <span aria-hidden="true" className="text-brand mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span>
                      <InlineText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "table":
            return (
              <div key={index} className="border-border-muted overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-surface-muted">
                      {block.headers.map((header, headerIndex) => (
                        <th
                          key={headerIndex}
                          className="text-foreground border-border-muted border-b px-4 py-2.5 font-bold whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="odd:bg-background even:bg-surface-muted/50">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="text-foreground/80 border-border-muted border-b px-4 py-2.5">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "cta":
            return (
              <Link
                key={index}
                href={block.href}
                className="bg-brand text-brand-foreground hover:bg-brand-dark mt-1 inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-colors"
              >
                {block.label}
                <span aria-hidden="true">→</span>
              </Link>
            );
          case "paragraph":
          default:
            return (
              <p key={index} className="text-foreground/80 text-[15px] leading-7">
                <InlineText text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
