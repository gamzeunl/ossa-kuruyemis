import type { Metadata } from "next";
import Link from "next/link";
import { ProductAdminTable } from "@/components/admin/product-admin-table";
import { PageContainer } from "@/components/layout/container";
import { formatPrice } from "@/lib/format-money";
import { requireRole } from "@/server/auth/guard";
import { listCategoriesForAdmin } from "@/server/repositories/category-repository";
import {
  listProductsForAdmin,
  type AdminProductSort,
  type AdminProductStatusFilter,
} from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Ürün Yönetimi" };

const PAGE_SIZE = 30;

const STATUS_FILTERS: { value: AdminProductStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tümü" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "DRAFT", label: "Taslak" },
  { value: "OUT_OF_STOCK", label: "Tükendi" },
];

const SORT_OPTIONS: { value: AdminProductSort; label: string }[] = [
  { value: "newest", label: "En Yeni" },
  { value: "oldest", label: "En Eski" },
  { value: "name-asc", label: "Ürün Adı (A-Z)" },
  { value: "category", label: "Kategori" },
];

function parsePage(value: string | undefined): number {
  const parsed = value ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function isValidStatus(value: string | undefined): value is AdminProductStatusFilter {
  return STATUS_FILTERS.some((f) => f.value === value);
}

function isValidSort(value: string | undefined): value is AdminProductSort {
  return SORT_OPTIONS.some((s) => s.value === value);
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string; q?: string; durum?: string; kategori?: string; sirala?: string }>;
}) {
  await requireRole("ADMIN", "/yonetim/urunler");
  const { sayfa, q, durum, kategori, sirala } = await searchParams;
  const page = parsePage(sayfa);
  const status = isValidStatus(durum) ? durum : "ALL";
  const sort = isValidSort(sirala) ? sirala : "newest";

  const [{ rows, total }, categories] = await Promise.all([
    listProductsForAdmin({ page, pageSize: PAGE_SIZE, search: q, status, categoryId: kategori, sort }),
    listCategoriesForAdmin(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(overrides: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    const merged = { q, durum, kategori, sirala, sayfa: undefined as string | undefined, ...overrides };
    if (merged.q) params.set("q", merged.q);
    if (merged.durum && merged.durum !== "ALL") params.set("durum", merged.durum);
    if (merged.kategori) params.set("kategori", merged.kategori);
    if (merged.sirala && merged.sirala !== "newest") params.set("sirala", merged.sirala);
    if (merged.sayfa) params.set("sayfa", merged.sayfa);
    const qs = params.toString();
    return qs ? `/yonetim/urunler?${qs}` : "/yonetim/urunler";
  }

  return (
    <PageContainer maxWidthClassName="max-w-[1300px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim" className="text-brand w-fit text-xs font-semibold">
          ← Yönetim
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Ürün Yönetimi</h1>
          <Link
            href="/yonetim/urunler/yeni"
            className="bg-brand hover:bg-brand-dark min-h-10 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
          >
            Yeni Ürün
          </Link>
        </div>
        <p className="text-foreground/60 text-sm">{total} ürün</p>
      </div>

      {/* Arama + filtreler — GET formu, JS gerektirmez */}
      <form className="flex flex-wrap items-end gap-3" action="/yonetim/urunler">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-semibold">
          Ara
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Ürün adı veya slug"
            className="border-border-muted focus:border-brand h-10 rounded-lg border bg-white px-3 text-sm outline-none transition-colors"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Kategori
          <select
            name="kategori"
            defaultValue={kategori ?? ""}
            className="border-border-muted focus:border-brand h-10 rounded-lg border bg-white px-3 text-sm outline-none transition-colors"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Sırala
          <select
            name="sirala"
            defaultValue={sort}
            className="border-border-muted focus:border-brand h-10 rounded-lg border bg-white px-3 text-sm outline-none transition-colors"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="durum" value={status} />
        <button
          type="submit"
          className="border-border-muted hover:border-brand h-10 rounded-lg border px-4 text-sm font-semibold transition-colors"
        >
          Uygula
        </button>
      </form>

      {/* Durum pilleri */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Durum filtresi">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={buildHref({ durum: filter.value === "ALL" ? undefined : filter.value, sayfa: undefined })}
            role="tab"
            aria-selected={status === filter.value}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              status === filter.value
                ? "border-brand bg-brand/10 text-brand"
                : "border-border-muted text-foreground/60 hover:border-brand"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <ProductAdminTable products={rows} />

      {totalPages > 1 ? (
        <nav aria-label="Sayfalama" className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link
              href={buildHref({ sayfa: String(page - 1) })}
              className="border-border-muted hover:border-brand rounded-full border px-4 py-2 text-sm font-medium"
            >
              Önceki
            </Link>
          ) : null}
          <span className="text-foreground/60 text-sm">
            Sayfa {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildHref({ sayfa: String(page + 1) })}
              className="border-border-muted hover:border-brand rounded-full border px-4 py-2 text-sm font-medium"
            >
              Sonraki
            </Link>
          ) : null}
        </nav>
      ) : null}
    </PageContainer>
  );
}

export function formatStartingPrice(value: string | null): string {
  return value ? formatPrice(value) : "—";
}
