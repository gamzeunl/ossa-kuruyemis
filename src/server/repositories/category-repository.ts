import { Prisma, ProductStatus } from "@/generated/prisma/client";
import { violatesUniqueConstraintOn } from "@/lib/prisma-errors";
import { prisma } from "@/server/db/prisma";
import type { CategoryPreviewProduct, CategorySummary } from "@/types/catalog";

/**
 * `listActiveCategoriesWithPreviewProducts`'ın döndüğü, yalnızca mobil accordion
 * için gereken ürün önizlemesini içeren şekil. Masaüstü mega menü paneli artık
 * yalnızca statik "Alt Kategoriler" grup verisini (`@/lib/mega-menu-content`)
 * gösteriyor — bu fonksiyon ürün tabanlı BAŞKA bir alandan sorumlu değildir.
 */
type CategoryWithPreview = CategorySummary & { previewProducts: CategoryPreviewProduct[] };

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  imageAlt: true,
  sortOrder: true,
} as const;

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  sortOrder: number;
};

function toCategorySummary(category: CategoryRow): CategorySummary {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    imageAlt: category.imageAlt,
    sortOrder: category.sortOrder,
  };
}

/** Aktif kategorileri `sortOrder`'a göre sırayla listeler. */
export async function listActiveCategories(): Promise<CategorySummary[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: categorySelect,
  });
  return categories.map(toCategorySummary);
}

/** Slug ile aktif bir kategori bulur; pasif veya bulunamayan kategori için `null` döner. */
export async function findActiveCategoryBySlug(slug: string): Promise<CategorySummary | null> {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: categorySelect,
  });
  return category ? toCategorySummary(category) : null;
}

function categoryWithPreviewArgs(previewLimit: number) {
  return {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      ...categorySelect,
      productCategories: {
        where: { product: { status: ProductStatus.ACTIVE } },
        orderBy: { sortOrder: "asc" },
        take: previewLimit,
        select: {
          product: {
            select: {
              name: true,
              slug: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  } satisfies Prisma.CategoryFindManyArgs;
}

/**
 * Aktif kategorileri, mega menü panelinde göstermek üzere her biri için ilk birkaç
 * (previewLimit) ürün önizlemesiyle birlikte tek sorguda getirir (N+1 oluşturmaz).
 */
export async function listActiveCategoriesWithPreviewProducts(
  previewLimit: number,
): Promise<CategoryWithPreview[]> {
  const categories = await prisma.category.findMany(categoryWithPreviewArgs(previewLimit));

  return categories.map((category) => ({
    ...toCategorySummary(category),
    previewProducts: category.productCategories.map((entry) => ({
      name: entry.product.name,
      slug: entry.product.slug,
      imageUrl: entry.product.images[0]?.url ?? null,
    })),
  }));
}

// ==================== Yönetim ====================

const adminCategoryListSelect = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
  imageAlt: true,
  isActive: true,
  sortOrder: true,
  _count: { select: { productCategories: true } },
} satisfies Prisma.CategorySelect;

export type AdminCategoryListRow = Prisma.CategoryGetPayload<{ select: typeof adminCategoryListSelect }>;

/** Kategori yönetim listesi — pasif kategoriler dahil TÜMÜ, `sortOrder`'a göre, her biri için gerçek ürün sayısı (N+1 yok, `_count`). */
export async function listCategoriesForAdmin(): Promise<AdminCategoryListRow[]> {
  return prisma.category.findMany({ select: adminCategoryListSelect, orderBy: { sortOrder: "asc" } });
}

const adminCategoryDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  imageAlt: true,
  isActive: true,
  sortOrder: true,
} satisfies Prisma.CategorySelect;

export type AdminCategoryDetailRow = Prisma.CategoryGetPayload<{ select: typeof adminCategoryDetailSelect }>;

export async function findCategoryById(id: string): Promise<AdminCategoryDetailRow | null> {
  return prisma.category.findUnique({ where: { id }, select: adminCategoryDetailSelect });
}

export interface CategoryOption {
  id: string;
  name: string;
}

/** Ürün oluşturma formundaki kategori `<select>`'i için hafif seçenek listesi (`listActiveProductOptions` deseniyle aynı). */
export async function listActiveCategoryOptions(): Promise<CategoryOption[]> {
  return prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });
}

export interface CategoryFields {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  isActive: boolean;
  sortOrder: number;
}

export type CreateCategoryResult = { ok: true; categoryId: string } | { ok: false; reason: "DUPLICATE_SLUG" };

export async function createCategory(input: CategoryFields): Promise<CreateCategoryResult> {
  try {
    const category = await prisma.category.create({ data: input });
    return { ok: true, categoryId: category.id };
  } catch (error) {
    if (violatesUniqueConstraintOn(error, "slug")) {
      return { ok: false, reason: "DUPLICATE_SLUG" };
    }
    throw error;
  }
}

export type UpdateCategoryFailureReason = "DUPLICATE_SLUG" | "NOT_FOUND";
export type UpdateCategoryResult = { ok: true } | { ok: false; reason: UpdateCategoryFailureReason };

export async function updateCategory(id: string, input: CategoryFields): Promise<UpdateCategoryResult> {
  try {
    await prisma.category.update({ where: { id }, data: input });
    return { ok: true };
  } catch (error) {
    if (violatesUniqueConstraintOn(error, "slug")) {
      return { ok: false, reason: "DUPLICATE_SLUG" };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, reason: "NOT_FOUND" };
    }
    throw error;
  }
}

export type DeleteCategoryFailureReason = "HAS_PRODUCTS" | "NOT_FOUND";
export type DeleteCategoryResult = { ok: true } | { ok: false; reason: DeleteCategoryFailureReason };

/** Kategoriye bağlı en az bir ürün varsa (`ProductCategory`) silme reddedilir — veri kaybı/kırık referans oluşturulmaz. */
export async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { _count: { select: { productCategories: true } } },
  });
  if (!category) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  if (category._count.productCategories > 0) {
    return { ok: false, reason: "HAS_PRODUCTS" };
  }

  await prisma.category.delete({ where: { id } });
  return { ok: true };
}
