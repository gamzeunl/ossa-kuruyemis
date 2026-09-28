import { describe, expect, it } from "vitest";
import { HOMEPAGE_SECTIONS, HOMEPAGE_SECTION_KEYS, resolveHomepageSectionOrder } from "@/lib/homepage-sections";

describe("HOMEPAGE_SECTIONS — statik yapı doğruluğu", () => {
  it("tüm key'ler tekil", () => {
    expect(new Set(HOMEPAGE_SECTION_KEYS).size).toBe(HOMEPAGE_SECTION_KEYS.length);
  });

  it("hero ve main-categories gibi temel bölümler toggleable:false", () => {
    const hero = HOMEPAGE_SECTIONS.find((s) => s.key === "hero");
    const mainCategories = HOMEPAGE_SECTIONS.find((s) => s.key === "main-categories");
    expect(hero?.toggleable).toBe(false);
    expect(mainCategories?.toggleable).toBe(false);
  });

  it("editoryal bölümler (ör. blog, instagram, why-ossa) toggleable:true", () => {
    for (const key of ["blog", "instagram", "why-ossa", "monthly-favorites", "better-together"]) {
      const section = HOMEPAGE_SECTIONS.find((s) => s.key === key);
      expect(section?.toggleable, key).toBe(true);
    }
  });
});

describe("resolveHomepageSectionOrder", () => {
  it("DB satırı hiç yoksa (fresh/seed edilmemiş DB) koddaki varsayılan sırayı ve isActive:true'yu kullanır", () => {
    const resolved = resolveHomepageSectionOrder([]);
    expect(resolved.map((s) => s.key)).toEqual(HOMEPAGE_SECTION_KEYS);
    expect(resolved.every((s) => s.isActive)).toBe(true);
  });

  it("DB'de admin'in değiştirdiği sıra/görünürlük varsa ONU kullanır, kod sırasını EZMEZ", () => {
    const dbRows = [
      { key: "blog", sortOrder: 0, isActive: false },
      { key: "hero", sortOrder: 1, isActive: true },
    ];
    const resolved = resolveHomepageSectionOrder(dbRows);
    expect(resolved[0]).toEqual({ key: "blog", sortOrder: 0, isActive: false });
    expect(resolved[1]).toEqual({ key: "hero", sortOrder: 1, isActive: true });
  });

  it("koddan silinmiş (artık HOMEPAGE_SECTIONS'ta olmayan) bir DB satırı yok sayılır", () => {
    const dbRows = [{ key: "eski-kaldirilmis-bolum", sortOrder: 0, isActive: true }];
    const resolved = resolveHomepageSectionOrder(dbRows);
    expect(resolved.some((s) => s.key === "eski-kaldirilmis-bolum")).toBe(false);
    expect(resolved).toHaveLength(HOMEPAGE_SECTION_KEYS.length);
  });

  it("sonuç her zaman sortOrder'a göre artan sıralı döner", () => {
    const dbRows = [
      { key: "final-cta", sortOrder: 0, isActive: true },
      { key: "hero", sortOrder: 5, isActive: true },
    ];
    const resolved = resolveHomepageSectionOrder(dbRows);
    for (let i = 1; i < resolved.length; i++) {
      expect(resolved[i].sortOrder).toBeGreaterThanOrEqual(resolved[i - 1].sortOrder);
    }
  });
});
