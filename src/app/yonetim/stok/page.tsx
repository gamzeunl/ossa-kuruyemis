import type { Metadata } from "next";
import Link from "next/link";
import { StockAdminTable } from "@/components/admin/stock-admin-table";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { listVariantStockForAdmin, type StockPageFilter } from "@/server/repositories/inventory-repository";

export const metadata: Metadata = { title: "Stok Yönetimi" };

function isValidFilter(value: string | undefined): value is StockPageFilter {
  return value === "OUT_OF_STOCK";
}

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  await requireRole("ADMIN", "/yonetim/stok");
  const { durum } = await searchParams;
  const filter: StockPageFilter = isValidFilter(durum) ? durum : "ALL";

  const rows = await listVariantStockForAdmin(filter);
  const outOfStockCount = rows.filter((row) => row.sellable <= 0).length;

  return (
    <PageContainer maxWidthClassName="max-w-[1200px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim" className="text-brand w-fit text-xs font-semibold">
          ← Yönetim
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Stok Yönetimi</h1>
        <p className="text-foreground/60 text-sm">
          {filter === "OUT_OF_STOCK" ? `${rows.length} tükenen varyant` : `${rows.length} varyant, ${outOfStockCount} tükendi`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Stok filtresi">
        <Link
          href="/yonetim/stok"
          role="tab"
          aria-selected={filter === "ALL"}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
            filter === "ALL"
              ? "border-brand bg-brand/10 text-brand"
              : "border-border-muted text-foreground/60 hover:border-brand"
          }`}
        >
          Tüm Ürünler
        </Link>
        <Link
          href="/yonetim/stok?durum=OUT_OF_STOCK"
          role="tab"
          aria-selected={filter === "OUT_OF_STOCK"}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
            filter === "OUT_OF_STOCK"
              ? "border-brand bg-brand/10 text-brand"
              : "border-border-muted text-foreground/60 hover:border-brand"
          }`}
        >
          Yalnızca Tükenenler
        </Link>
      </div>

      <StockAdminTable
        rows={rows.map((row) => ({ ...row, lastMovementAt: row.lastMovementAt?.toISOString() ?? null }))}
      />
    </PageContainer>
  );
}
