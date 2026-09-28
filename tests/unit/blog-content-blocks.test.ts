import { describe, expect, it } from "vitest";
import { parseBlogContentBlocks, splitInlineBold } from "@/lib/blog-content-blocks";

describe("parseBlogContentBlocks", () => {
  it("düz metni paragraf bloğu olarak ayrıştırır", () => {
    const blocks = parseBlogContentBlocks("Bu bir paragraftır.\n\nBu ikinci paragraftır.");
    expect(blocks).toEqual([
      { type: "paragraph", text: "Bu bir paragraftır." },
      { type: "paragraph", text: "Bu ikinci paragraftır." },
    ]);
  });

  it("'## ' ile başlayan bloğu heading2 olarak ayrıştırır", () => {
    const blocks = parseBlogContentBlocks("## Giriş\n\nParagraf.");
    expect(blocks[0]).toEqual({ type: "heading2", text: "Giriş" });
  });

  it("'### ' ile başlayan bloğu heading3 olarak ayrıştırır", () => {
    const blocks = parseBlogContentBlocks("### Alt Başlık\n\nParagraf.");
    expect(blocks[0]).toEqual({ type: "heading3", text: "Alt Başlık" });
  });

  it("her satırı '- ' ile başlayan bloğu liste olarak ayrıştırır", () => {
    const blocks = parseBlogContentBlocks("- Birinci madde\n- İkinci madde\n- Üçüncü madde");
    expect(blocks[0]).toEqual({
      type: "list",
      items: ["Birinci madde", "İkinci madde", "Üçüncü madde"],
    });
  });

  it("bir liste satırı '- ' ile başlamıyorsa bloğu paragraf sayar (yanlış pozitif liste yok)", () => {
    const blocks = parseBlogContentBlocks("- Birinci madde\nİkinci satır normal");
    expect(blocks[0].type).toBe("paragraph");
  });

  it("başlık + ayırıcı satırlı basit tabloyu table olarak ayrıştırır", () => {
    const content = "| Ürün | Fiyat |\n| --- | --- |\n| Premium Hurma | 270 TL |\n| Jumbo Hurma | 337,50 TL |";
    const blocks = parseBlogContentBlocks(content);
    expect(blocks[0]).toEqual({
      type: "table",
      headers: ["Ürün", "Fiyat"],
      rows: [
        ["Premium Hurma", "270 TL"],
        ["Jumbo Hurma", "337,50 TL"],
      ],
    });
  });

  it("tek satırlık [Metin](href) bloğunu cta olarak ayrıştırır", () => {
    const blocks = parseBlogContentBlocks("Paragraf.\n\n[Ürünleri Keşfet](/urunler)");
    expect(blocks[1]).toEqual({ type: "cta", label: "Ürünleri Keşfet", href: "/urunler" });
  });

  it("boş girdi için boş dizi döner", () => {
    expect(parseBlogContentBlocks("")).toEqual([]);
    expect(parseBlogContentBlocks("   \n\n   ")).toEqual([]);
  });

  it("birden fazla ardışık boş satırı tek blok ayırıcı sayar", () => {
    const blocks = parseBlogContentBlocks("Birinci paragraf.\n\n\n\nİkinci paragraf.");
    expect(blocks).toHaveLength(2);
  });
});

describe("splitInlineBold", () => {
  it("işaretleme yoksa tek, kalın olmayan segment döner", () => {
    expect(splitInlineBold("düz metin")).toEqual([{ text: "düz metin", bold: false }]);
  });

  it("**kalın** işaretlemesini ayrı, kalın segment olarak çıkarır", () => {
    const segments = splitInlineBold("Bu **önemli** bir bilgidir.");
    expect(segments).toEqual([
      { text: "Bu ", bold: false },
      { text: "önemli", bold: true },
      { text: " bir bilgidir.", bold: false },
    ]);
  });

  it("birden fazla kalın segmenti destekler", () => {
    const segments = splitInlineBold("**A** ve **B**");
    expect(segments).toEqual([
      { text: "A", bold: true },
      { text: " ve ", bold: false },
      { text: "B", bold: true },
    ]);
  });
});
