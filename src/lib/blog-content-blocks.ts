/**
 * `BlogPost.content` (düz metin) için MİNİMAL, bağımlılıksız bir bloklara-ayırma
 * kuralı — tam bir markdown kütüphanesi DEĞİL, yalnızca blog yazılarının
 * ihtiyaç duyduğu 6 blok türünü tanır: `## `/`### ` başlıkları, `- ` madde
 * listeleri, `|` ile ayrılmış basit tablolar, tek satırlık `[Metin](href)`
 * CTA bağlantısı, ve düz paragraflar (paragraf içinde `**kalın**` desteklenir).
 * Bloklar boş satırla ayrılır — mevcut `content.split(/\n{2,}/)` sınırıyla AYNI.
 */

export type BlogContentBlock =
  | { type: "heading2"; text: string }
  | { type: "heading3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "cta"; label: string; href: string };

const CTA_LINE_PATTERN = /^\[([^\]]+)\]\(([^)]+)\)$/;

function parseTableBlock(lines: string[]): BlogContentBlock | null {
  if (lines.length < 2) {
    return null;
  }
  const isTableRow = (line: string) => line.trim().startsWith("|") || line.includes("|");
  if (!lines.every(isTableRow)) {
    return null;
  }
  const isSeparatorRow = (line: string) => /^\|?[\s:|-]+\|?$/.test(line.trim());
  if (!isSeparatorRow(lines[1])) {
    return null;
  }

  const splitRow = (line: string): string[] =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  const headers = splitRow(lines[0]);
  const rows = lines.slice(2).map(splitRow);
  return { type: "table", headers, rows };
}

function parseListBlock(lines: string[]): BlogContentBlock | null {
  if (!lines.every((line) => line.trim().startsWith("- "))) {
    return null;
  }
  return { type: "list", items: lines.map((line) => line.trim().slice(2).trim()) };
}

/** Saf metin bloklarını render edilebilir yapılara çevirir — DOM/React'a bağımlı değildir. */
export function parseBlogContentBlocks(content: string): BlogContentBlock[] {
  const rawBlocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return rawBlocks.map((block): BlogContentBlock => {
    if (block.startsWith("### ")) {
      return { type: "heading3", text: block.slice(4).trim() };
    }
    if (block.startsWith("## ")) {
      return { type: "heading2", text: block.slice(3).trim() };
    }

    const ctaMatch = CTA_LINE_PATTERN.exec(block);
    if (ctaMatch) {
      return { type: "cta", label: ctaMatch[1].trim(), href: ctaMatch[2].trim() };
    }

    const lines = block.split("\n").filter((line) => line.trim().length > 0);

    const table = parseTableBlock(lines);
    if (table) {
      return table;
    }

    const list = parseListBlock(lines);
    if (list) {
      return list;
    }

    return { type: "paragraph", text: block };
  });
}

export interface InlineTextSegment {
  text: string;
  bold: boolean;
}

/** `**kalın**` işaretlemesini React'a bağımlı olmadan segmentlere ayırır — sayfa bileşeni bunu `<strong>`'a çevirir. */
export function splitInlineBold(text: string): InlineTextSegment[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return { text: part.slice(2, -2), bold: true };
    }
    return { text: part, bold: false };
  });
}
