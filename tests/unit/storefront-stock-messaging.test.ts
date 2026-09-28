/**
 * Regresyon koruması: müşteri tarafında ("Stokta"/"Az Stok"/"Son X adet" gibi)
 * kıtlık/stok mesajları KULLANILMAZ — yalnızca gerçekten stok bittiğinde
 * "Tükendi" gösterilir (bkz. görev kuralı). Yeni bir render/DOM test
 * kütüphanesi EKLENMEDİ (proje genelinde yok) — bu yüzden gerçek storefront
 * bileşen KAYNAK dosyaları taranır; admin bileşenleri (`components/admin/`)
 * kapsam dışıdır (admin gerçek miktarı görebilir).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const STOREFRONT_COMPONENT_DIRS = ["src/components/catalog", "src/components/home", "src/components/cart"];

const FORBIDDEN_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: '"Az Stok"', pattern: /Az Stok/ },
  { label: '"Stokta" (metin etiketi olarak)', pattern: />\s*Stokta\s*</ },
  { label: "Son X adet / kaldı! kıtlık ifadesi", pattern: /[Ss]on \d+ (adet|ürün)|adet kaldı!|yalnızca \d+ adet/ },
];

function listTsxFilesRecursive(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...listTsxFilesRecursive(fullPath));
    } else if (entry.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("storefront stok mesajlaşması — yasaklı kıtlık ifadeleri yok", () => {
  const projectRoot = path.resolve(__dirname, "../..");
  const files = STOREFRONT_COMPONENT_DIRS.flatMap((dir) => listTsxFilesRecursive(path.join(projectRoot, dir)));

  it("en az bir storefront bileşen dosyası tarandı (test yanlışlıkla no-op olmadı)", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(FORBIDDEN_PATTERNS)("$label hiçbir storefront bileşeninde yok", ({ pattern }) => {
    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      if (pattern.test(content)) {
        offenders.push(path.relative(projectRoot, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("product-purchase-panel.tsx yalnızca OUT_OF_STOCK için etiket render ediyor, LOW_STOCK için ayrı bir etiket YOK", () => {
    const content = readFileSync(
      path.join(projectRoot, "src/components/catalog/product-purchase-panel.tsx"),
      "utf-8",
    );
    expect(content).toContain('stockStatus === "OUT_OF_STOCK"');
    expect(content).not.toContain('stockStatus === "LOW_STOCK"');
  });
});
