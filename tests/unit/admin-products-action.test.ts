import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import {
  bulkProductActionAction,
  createProductAction,
  deleteProductAction,
  deleteProductVariantAction,
  markAllProductVariantsSoldOutAction,
  markVariantSoldOutAction,
  updateProductAdminAction,
} from "@/actions/admin-products";
import { findCategoryById } from "@/server/repositories/category-repository";
import { markAllVariantsSoldOut, markVariantSoldOut } from "@/server/repositories/inventory-repository";
import {
  createProduct,
  deleteOrArchiveProduct,
  deleteProductVariant,
  findProductForAdmin,
  updateProductAdminSettings,
  type AdminProductDetailRow,
} from "@/server/repositories/product-repository";
import { recordAuditLog } from "@/server/audit/audit-log";

const { updateMany } = vi.hoisted(() => ({ updateMany: vi.fn() }));

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/server/providers/better-auth-provider", () => ({
  betterAuthProvider: { getCurrentUser },
}));

vi.mock("@/server/repositories/product-repository", () => ({
  createProduct: vi.fn(),
  findProductForAdmin: vi.fn(),
  updateProductAdminSettings: vi.fn(),
  deleteProductVariant: vi.fn(),
  deleteOrArchiveProduct: vi.fn(),
  addProductImage: vi.fn(),
  removeProductImage: vi.fn(),
  setPrimaryProductImage: vi.fn(),
  updateProductImageAlt: vi.fn(),
}));

vi.mock("@/server/repositories/inventory-repository", () => ({
  markVariantSoldOut: vi.fn(),
  markAllVariantsSoldOut: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: { product: { updateMany } },
}));

vi.mock("@/server/repositories/category-repository", () => ({
  findCategoryById: vi.fn(),
}));

vi.mock("@/server/audit/audit-log", () => ({
  recordAuditLog: vi.fn(),
}));

vi.mock("@/server/providers/storage-provider", () => ({
  resolveStorageProvider: vi.fn(() => ({
    upload: vi.fn(),
    delete: vi.fn(),
    deleteByUrl: vi.fn(),
    getPublicUrl: vi.fn(),
    isOwnedUrl: vi.fn(() => true),
  })),
}));

// `revalidatePath` gerçek Next.js istek bağlamı dışında (Vitest'te) çağrılırsa
// "Invariant: static generation store missing" fırlatır — başarı yolunu test
// edebilmek için burada zararsız bir no-op'a indirgenir.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const ADMIN_USER = {
  id: "admin_1",
  email: "admin@ossa-test.local",
  firstName: "Admin",
  lastName: "Kullanıcı",
  role: "ADMIN",
};

const CUSTOMER_USER = {
  id: "user_1",
  email: "musteri@ossa-test.local",
  firstName: "Test",
  lastName: "Müşteri",
  role: "CUSTOMER",
};

const ACTIVE_CATEGORY = {
  id: "cat-old",
  name: "Eski Kategori",
  slug: "eski-kategori",
  description: null,
  imageUrl: null,
  imageAlt: null,
  isActive: true,
  sortOrder: 0,
};

function buildCreateFormData(): FormData {
  const formData = new FormData();
  formData.set("name", "Kavrulmuş İç Fındık");
  formData.set("slug", "kavrulmus-ic-findik");
  formData.set("categoryId", "cat_1");
  formData.set("status", "DRAFT");
  formData.append("variantIndex", "0");
  formData.set("variant-0-name", "500g Paket");
  formData.set("variant-0-sku", "OSSA-TEST-500");
  formData.set("variant-0-price", "150.00");
  return formData;
}

describe("createProductAction — yetkisiz erişim", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(createProduct).mockReset();
  });

  it("oturum yoksa reddedilir ve createProduct hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await createProductAction(buildCreateFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("ADMIN olmayan rol reddedilir ve createProduct hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(CUSTOMER_USER);
    const result = await createProductAction(buildCreateFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(createProduct).not.toHaveBeenCalled();
  });
});

function fakeVariant(overrides: Partial<AdminProductDetailRow["variants"][number]> = {}) {
  return {
    id: "var-1",
    name: "500 g",
    sku: "OSSA-TEST-500",
    weightGram: 500,
    price: new Prisma.Decimal("150.00"),
    isActive: true,
    discountPrice: null,
    discountStartsAt: null,
    discountEndsAt: null,
    isDiscountActive: false,
    ...overrides,
  } as AdminProductDetailRow["variants"][number];
}

function fakeProduct(overrides: Partial<AdminProductDetailRow> = {}): AdminProductDetailRow {
  return {
    id: "prod_1",
    name: "Test Ürün",
    slug: "test-urun",
    status: "ACTIVE",
    isRecommended: false,
    newBadgeOverride: null,
    description: null,
    shortDescription: null,
    ingredients: null,
    storageConditions: null,
    deliveryInfo: null,
    metaTitle: null,
    metaDescription: null,
    _count: { favorites: 0 },
    productCategories: [
      { categoryId: "cat-old", category: { id: "cat-old", slug: "eski-kategori", name: "Eski Kategori" } },
    ],
    variants: [fakeVariant()],
    images: [],
    ...overrides,
  } as AdminProductDetailRow;
}

/** `fakeProduct()`'ın varsayılan hâliyle BİREBİR eşleşen, "hiçbir şey değişmedi" formu — audit/no-op testleri için. */
function buildUnchangedFormData(): FormData {
  const formData = new FormData();
  formData.set("name", "Test Ürün");
  formData.set("slug", "test-urun");
  formData.set("status", "ACTIVE");
  formData.set("categoryId", "cat-old");
  formData.set("existingVariant-var-1-name", "500 g");
  formData.set("existingVariant-var-1-sku", "OSSA-TEST-500");
  formData.set("existingVariant-var-1-weightGram", "500");
  formData.set("existingVariant-var-1-price", "150.00");
  formData.set("existingVariant-var-1-isActive", "on");
  return formData;
}

/** Geçerli ad/slug/durum + yalnızca kategori alanı DEĞİŞTİRİLEBİLEN form — kategori-odaklı erken-red senaryoları için. */
function buildMinimalUpdateFormData(categoryId: string): FormData {
  const formData = buildUnchangedFormData();
  formData.set("categoryId", categoryId);
  return formData;
}

describe("updateProductAdminAction", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(findProductForAdmin).mockReset();
    vi.mocked(updateProductAdminSettings).mockReset();
    vi.mocked(findCategoryById).mockReset();
    vi.mocked(recordAuditLog).mockReset();
  });

  it("oturum yoksa reddedilir, hiçbir repository çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await updateProductAdminAction("prod_1", buildMinimalUpdateFormData("cat-new"));
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findProductForAdmin).not.toHaveBeenCalled();
  });

  it("ADMIN olmayan rol reddedilir", async () => {
    getCurrentUser.mockResolvedValue(CUSTOMER_USER);
    const result = await updateProductAdminAction("prod_1", buildMinimalUpdateFormData("cat-new"));
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findProductForAdmin).not.toHaveBeenCalled();
  });

  it("ürün bulunamazsa reddedilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(null);
    const result = await updateProductAdminAction("prod_1", buildMinimalUpdateFormData("cat-new"));
    expect(result).toEqual({ ok: false, message: "Ürün bulunamadı." });
  });

  it("ürün adı boşsa reddedilir (Zod), updateProductAdminSettings hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    const formData = buildUnchangedFormData();
    formData.set("name", "");

    const result = await updateProductAdminAction("prod_1", formData);
    expect(result.ok).toBe(false);
    expect(updateProductAdminSettings).not.toHaveBeenCalled();
  });

  it("geçersiz slug formatı reddedilir (Zod)", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    const formData = buildUnchangedFormData();
    formData.set("slug", "Geçersiz Slug!");

    const result = await updateProductAdminAction("prod_1", formData);
    expect(result.ok).toBe(false);
    expect(updateProductAdminSettings).not.toHaveBeenCalled();
  });

  it("geçersiz (var olmayan) kategori reddedilir, updateProductAdminSettings hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(null);

    const result = await updateProductAdminAction("prod_1", buildMinimalUpdateFormData("cat-does-not-exist"));
    expect(result).toEqual({ ok: false, message: "Seçilen kategori bulunamadı." });
    expect(updateProductAdminSettings).not.toHaveBeenCalled();
    expect(recordAuditLog).not.toHaveBeenCalled();
  });

  it("pasif kategori reddedilir, updateProductAdminSettings hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue({ ...ACTIVE_CATEGORY, id: "cat-inactive", isActive: false });

    const result = await updateProductAdminAction("prod_1", buildMinimalUpdateFormData("cat-inactive"));
    expect(result).toEqual({
      ok: false,
      message: "Seçilen kategori pasif — ürün pasif bir kategoriye atanamaz.",
    });
    expect(updateProductAdminSettings).not.toHaveBeenCalled();
  });

  it("kategori boş gönderilirse reddedilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());

    const result = await updateProductAdminAction("prod_1", buildMinimalUpdateFormData(""));
    expect(result).toEqual({ ok: false, message: "Kategori seçilmelidir." });
    expect(updateProductAdminSettings).not.toHaveBeenCalled();
  });

  it("varyant fiyatı <= 0 ise reddedilir, updateProductAdminSettings hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    const formData = buildUnchangedFormData();
    formData.set("existingVariant-var-1-price", "0");

    const result = await updateProductAdminAction("prod_1", formData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("pozitif");
    }
    expect(updateProductAdminSettings).not.toHaveBeenCalled();
  });

  it("varyant gramajı <= 0 ise reddedilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    const formData = buildUnchangedFormData();
    formData.set("existingVariant-var-1-weightGram", "-5");

    const result = await updateProductAdminAction("prod_1", formData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("gramaj");
    }
    expect(updateProductAdminSettings).not.toHaveBeenCalled();
  });

  it("boş SKU reddedilir (Zod)", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    const formData = buildUnchangedFormData();
    formData.set("existingVariant-var-1-sku", "");

    const result = await updateProductAdminAction("prod_1", formData);
    expect(result.ok).toBe(false);
    expect(updateProductAdminSettings).not.toHaveBeenCalled();
  });

  it("aynı gönderimde iki varyant AYNI SKU'yu kullanırsa DB'ye gitmeden reddedilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(
      fakeProduct({ variants: [fakeVariant({ id: "var-1" }), fakeVariant({ id: "var-2", name: "1 kg" })] }),
    );
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    const formData = buildUnchangedFormData();
    formData.set("existingVariant-var-2-name", "1 kg");
    formData.set("existingVariant-var-2-sku", "OSSA-TEST-500"); // var-1 ile AYNI SKU
    formData.set("existingVariant-var-2-weightGram", "1000");
    formData.set("existingVariant-var-2-price", "250.00");
    formData.set("existingVariant-var-2-isActive", "on");

    const result = await updateProductAdminAction("prod_1", formData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("OSSA-TEST-500");
    }
    expect(updateProductAdminSettings).not.toHaveBeenCalled();
  });

  it("updateProductAdminSettings DUPLICATE_SLUG döndürürse dostane mesaj verilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    vi.mocked(updateProductAdminSettings).mockResolvedValue({ ok: false, reason: "DUPLICATE_SLUG" });

    const result = await updateProductAdminAction("prod_1", buildUnchangedFormData());
    expect(result).toEqual({ ok: false, message: "Bu slug zaten kullanılıyor." });
  });

  it("updateProductAdminSettings DUPLICATE_SKU döndürürse dostane mesaj verilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    vi.mocked(updateProductAdminSettings).mockResolvedValue({ ok: false, reason: "DUPLICATE_SKU" });

    const result = await updateProductAdminAction("prod_1", buildUnchangedFormData());
    expect(result).toEqual({ ok: false, message: "Bu SKU zaten kullanılıyor." });
  });

  it("hiçbir şey değişmezse hiçbir audit log yazılmaz", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    vi.mocked(updateProductAdminSettings).mockResolvedValue({ ok: true });

    const result = await updateProductAdminAction("prod_1", buildUnchangedFormData());
    expect(result).toEqual({ ok: true });
    expect(recordAuditLog).not.toHaveBeenCalled();
  });

  it("kategori GERÇEKTEN değişirse: updateProductAdminSettings doğru categoryId ile çağrılır ve PRODUCT_CATEGORY_CHANGED before/after ile loglanır", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue({
      ...ACTIVE_CATEGORY,
      id: "cat-new",
      name: "Yeni Kategori",
      slug: "yeni-kategori",
    });
    vi.mocked(updateProductAdminSettings).mockResolvedValue({ ok: true });

    const formData = buildUnchangedFormData();
    formData.set("categoryId", "cat-new");
    const result = await updateProductAdminAction("prod_1", formData);
    expect(result).toEqual({ ok: true });

    expect(updateProductAdminSettings).toHaveBeenCalledWith(
      "prod_1",
      expect.objectContaining({ categoryId: "cat-new" }),
    );
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PRODUCT_CATEGORY_CHANGED",
        entityType: "Product",
        entityId: "prod_1",
        metadata: {
          before: { categoryId: "cat-old", categorySlug: "eski-kategori" },
          after: { categoryId: "cat-new", categorySlug: "yeni-kategori" },
        },
      }),
    );
  });

  it("AYNI kategoriyle kaydedilirse PRODUCT_CATEGORY_CHANGED loglanmaz", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    vi.mocked(updateProductAdminSettings).mockResolvedValue({ ok: true });

    await updateProductAdminAction("prod_1", buildUnchangedFormData());
    const categoryChangeCalls = vi
      .mocked(recordAuditLog)
      .mock.calls.filter(([input]) => input.action === "PRODUCT_CATEGORY_CHANGED");
    expect(categoryChangeCalls).toHaveLength(0);
  });

  it("ad/slug/durum değişirse PRODUCT_BASIC_INFO_CHANGED before/after ile loglanır", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    vi.mocked(updateProductAdminSettings).mockResolvedValue({ ok: true });

    const formData = buildUnchangedFormData();
    formData.set("name", "Yeni Ürün Adı");
    formData.set("slug", "yeni-urun-adi");
    await updateProductAdminAction("prod_1", formData);

    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PRODUCT_BASIC_INFO_CHANGED",
        metadata: {
          before: { name: "Test Ürün", slug: "test-urun", status: "ACTIVE" },
          after: { name: "Yeni Ürün Adı", slug: "yeni-urun-adi", status: "ACTIVE" },
        },
      }),
    );
  });

  it("SEO alanları değişirse PRODUCT_SEO_UPDATED loglanır", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    vi.mocked(updateProductAdminSettings).mockResolvedValue({ ok: true });

    const formData = buildUnchangedFormData();
    formData.set("metaTitle", "Yeni Meta Başlık");
    await updateProductAdminAction("prod_1", formData);

    expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "PRODUCT_SEO_UPDATED" }));
  });

  it("mevcut varyant alanı değişirse PRODUCT_VARIANT_UPDATED değişen id ile loglanır", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    vi.mocked(updateProductAdminSettings).mockResolvedValue({ ok: true });

    const formData = buildUnchangedFormData();
    formData.set("existingVariant-var-1-price", "199.00");
    await updateProductAdminAction("prod_1", formData);

    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PRODUCT_VARIANT_UPDATED", metadata: { variantIds: ["var-1"] } }),
    );
  });

  it("yeni varyant eklenirse PRODUCT_VARIANT_ADDED loglanır ve updateProductAdminSettings newVariants ile çağrılır", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(findCategoryById).mockResolvedValue(ACTIVE_CATEGORY);
    vi.mocked(updateProductAdminSettings).mockResolvedValue({ ok: true });

    const formData = buildUnchangedFormData();
    formData.append("newVariantIndex", "0");
    formData.set("newVariant-0-name", "1 kg");
    formData.set("newVariant-0-sku", "OSSA-TEST-1000");
    formData.set("newVariant-0-weightGram", "1000");
    formData.set("newVariant-0-price", "280.00");
    formData.set("newVariant-0-isActive", "on");

    const result = await updateProductAdminAction("prod_1", formData);
    expect(result).toEqual({ ok: true });

    expect(updateProductAdminSettings).toHaveBeenCalledWith(
      "prod_1",
      expect.objectContaining({
        newVariants: [
          expect.objectContaining({ name: "1 kg", sku: "OSSA-TEST-1000", weightGram: 1000 }),
        ],
      }),
    );
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PRODUCT_VARIANT_ADDED",
        metadata: { count: 1, skus: ["OSSA-TEST-1000"] },
      }),
    );
  });
});

describe("deleteProductVariantAction", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(findProductForAdmin).mockReset();
    vi.mocked(deleteProductVariant).mockReset();
    vi.mocked(recordAuditLog).mockReset();
  });

  it("oturum yoksa reddedilir, deleteProductVariant hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await deleteProductVariantAction("prod_1", "var_1");
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(deleteProductVariant).not.toHaveBeenCalled();
  });

  it("varyant geçmiş sipariş/kampanyada kullanılıyorsa (IN_USE) dostane mesajla reddedilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(deleteProductVariant).mockResolvedValue({ ok: false, reason: "IN_USE" });

    const result = await deleteProductVariantAction("prod_1", "var_1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("pasifleştirin");
    }
  });

  it("ürünün son/tek varyantı silinemez (LAST_VARIANT)", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(deleteProductVariant).mockResolvedValue({ ok: false, reason: "LAST_VARIANT" });

    const result = await deleteProductVariantAction("prod_1", "var_1");
    expect(result.ok).toBe(false);
  });

  it("hiç kullanılmamış varyant başarıyla silinir ve PRODUCT_VARIANT_DELETED loglanır", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(deleteProductVariant).mockResolvedValue({ ok: true, removedImageUrls: [] });

    const result = await deleteProductVariantAction("prod_1", "var_1");
    expect(result).toEqual({ ok: true });
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PRODUCT_VARIANT_DELETED", metadata: { variantId: "var_1" } }),
    );
  });
});

describe("deleteProductAction", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(findProductForAdmin).mockReset();
    vi.mocked(deleteOrArchiveProduct).mockReset();
    vi.mocked(recordAuditLog).mockReset();
  });

  it("oturum yoksa reddedilir, deleteOrArchiveProduct hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await deleteProductAction("prod_1");
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(deleteOrArchiveProduct).not.toHaveBeenCalled();
  });

  it("ADMIN olmayan rol reddedilir", async () => {
    getCurrentUser.mockResolvedValue(CUSTOMER_USER);
    const result = await deleteProductAction("prod_1");
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(deleteOrArchiveProduct).not.toHaveBeenCalled();
  });

  it("geçmiş kaydı olmayan ürün hard-delete edilir ve PRODUCT_HARD_DELETED loglanır", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(deleteOrArchiveProduct).mockResolvedValue({ ok: true, mode: "HARD_DELETE" });

    const result = await deleteProductAction("prod_1");
    expect(result).toEqual({ ok: true, mode: "HARD_DELETE" });
    expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "PRODUCT_HARD_DELETED" }));
  });

  it("geçmiş kaydı olan ürün ARCHIVED yapılır ve anlaşılır mesaj döner", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(findProductForAdmin).mockResolvedValue(fakeProduct());
    vi.mocked(deleteOrArchiveProduct).mockResolvedValue({
      ok: true,
      mode: "ARCHIVED",
      blockingReasons: ["geçmiş siparişlerde kullanılmış"],
    });

    const result = await deleteProductAction("prod_1");
    expect(result.ok).toBe(true);
    if (result.ok && result.mode === "ARCHIVED") {
      expect(result.message).toContain("kalıcı olarak silinemez");
      expect(result.message).toContain("geçmiş siparişlerde kullanılmış");
    }
    expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "PRODUCT_ARCHIVED" }));
  });
});

describe("markVariantSoldOutAction / markAllProductVariantsSoldOutAction", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(markVariantSoldOut).mockReset();
    vi.mocked(markAllVariantsSoldOut).mockReset();
    vi.mocked(recordAuditLog).mockReset();
  });

  it("oturum yoksa markVariantSoldOutAction reddedilir", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await markVariantSoldOutAction("prod_1", "var_1");
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(markVariantSoldOut).not.toHaveBeenCalled();
  });

  it("tek varyant başarıyla tükendi yapılır ve PRODUCT_VARIANT_MARKED_SOLD_OUT loglanır", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(markVariantSoldOut).mockResolvedValue({ ok: true });

    const result = await markVariantSoldOutAction("prod_1", "var_1");
    expect(result).toEqual({ ok: true, affectedCount: 1 });
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PRODUCT_VARIANT_MARKED_SOLD_OUT", entityId: "var_1" }),
    );
  });

  it("zaten tükenmiş varyant için dostane mesaj döner", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(markVariantSoldOut).mockResolvedValue({ ok: false, reason: "ALREADY_SOLD_OUT" });

    const result = await markVariantSoldOutAction("prod_1", "var_1");
    expect(result.ok).toBe(false);
  });

  it("çoklu varyantlı üründe TÜMÜ tükendi yapılır (affectedCount doğru sayılır)", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(markAllVariantsSoldOut).mockResolvedValue({ affected: 3 });

    const result = await markAllProductVariantsSoldOutAction("prod_1");
    expect(result).toEqual({ ok: true, affectedCount: 3 });
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PRODUCT_ALL_VARIANTS_MARKED_SOLD_OUT", metadata: { affected: 3 } }),
    );
  });

  it("oturum yoksa markAllProductVariantsSoldOutAction reddedilir", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await markAllProductVariantsSoldOutAction("prod_1");
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(markAllVariantsSoldOut).not.toHaveBeenCalled();
  });
});

describe("bulkProductActionAction", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    updateMany.mockReset();
    vi.mocked(markAllVariantsSoldOut).mockReset();
    vi.mocked(recordAuditLog).mockReset();
  });

  it("oturum yoksa reddedilir", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await bulkProductActionAction(["prod_1"], "ACTIVATE");
    expect(result.ok).toBe(false);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("boş seçim reddedilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    const result = await bulkProductActionAction([], "ACTIVATE");
    expect(result).toEqual({ ok: false, affectedCount: 0, message: "Hiçbir ürün seçilmedi." });
  });

  it("ACTIVATE: seçili ürünler toplu aktif yapılır", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    updateMany.mockResolvedValue({ count: 2 });

    const result = await bulkProductActionAction(["prod_1", "prod_2"], "ACTIVATE");
    expect(result).toEqual({ ok: true, affectedCount: 2, message: "2 ürün aktif yapıldı." });
    expect(updateMany).toHaveBeenCalledWith({ where: { id: { in: ["prod_1", "prod_2"] } }, data: { status: "ACTIVE" } });
  });

  it("ARCHIVE: seçili ürünler toplu mağazadan kaldırılır (hard-delete DEĞİL)", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    updateMany.mockResolvedValue({ count: 3 });

    const result = await bulkProductActionAction(["prod_1", "prod_2", "prod_3"], "ARCHIVE");
    expect(result).toEqual({ ok: true, affectedCount: 3, message: "3 ürün mağazadan kaldırıldı." });
    expect(updateMany).toHaveBeenCalledWith(
      { where: { id: { in: ["prod_1", "prod_2", "prod_3"] } }, data: { status: "ARCHIVED" } },
    );
  });

  it("MARK_SOLD_OUT: her ürün için tükendi işaretlenir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(markAllVariantsSoldOut).mockResolvedValue({ affected: 1 });

    const result = await bulkProductActionAction(["prod_1", "prod_2"], "MARK_SOLD_OUT");
    expect(result.ok).toBe(true);
    expect(result.affectedCount).toBe(2);
    expect(markAllVariantsSoldOut).toHaveBeenCalledTimes(2);
  });
});
