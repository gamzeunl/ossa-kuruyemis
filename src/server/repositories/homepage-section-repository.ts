import { HOMEPAGE_SECTIONS } from "@/lib/homepage-sections";
import { prisma } from "@/server/db/prisma";

export interface HomepageSectionRow {
  key: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * `HOMEPAGE_SECTIONS`'ta tanımlı ama DB'de henüz satırı olmayan `key`'ler için
 * varsayılan (koddaki sırasına göre) satır oluşturur — idempotent, var olan
 * satırlara (admin'in değiştirdiği sıra/görünürlük) DOKUNMAZ. `db:seed` her
 * çalıştığında admin tercihi bozulmasın diye upsert DEĞİL, yalnızca eksik
 * olanı `createMany...skipDuplicates` ile ekler.
 */
export async function ensureHomepageSectionsSeeded(): Promise<void> {
  await prisma.homepageSection.createMany({
    data: HOMEPAGE_SECTIONS.map((section, index) => ({
      key: section.key,
      sortOrder: index,
      isActive: true,
    })),
    skipDuplicates: true,
  });
}

/** Tüm bölümleri `sortOrder`'a göre döner — storefront ve admin AYNI fonksiyonu kullanır. */
export async function listHomepageSections(): Promise<HomepageSectionRow[]> {
  return prisma.homepageSection.findMany({
    orderBy: { sortOrder: "asc" },
    select: { key: true, sortOrder: true, isActive: true },
  });
}

/**
 * Verilen `key` sırasını TEK transaction'da uygular — dizideki index yeni
 * `sortOrder` olur. Bilinmeyen (koddan silinmiş) bir `key` gelirse yok sayılır.
 */
export async function reorderHomepageSections(orderedKeys: string[]): Promise<void> {
  const validKeys = new Set(HOMEPAGE_SECTIONS.map((section) => section.key));
  const filtered = orderedKeys.filter((key) => validKeys.has(key));
  await prisma.$transaction(
    filtered.map((key, index) => prisma.homepageSection.update({ where: { key }, data: { sortOrder: index } })),
  );
}

export async function setHomepageSectionActive(key: string, isActive: boolean): Promise<void> {
  await prisma.homepageSection.update({ where: { key }, data: { isActive } });
}
