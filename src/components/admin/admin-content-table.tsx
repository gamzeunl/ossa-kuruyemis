import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { ProductImage } from "@/components/catalog/product-image";

export interface AdminContentTableRow {
  id: string;
  imageUrl: string | null;
  imageAlt: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
  editHref: string;
}

/** 4 içerik yönetimi liste ekranının (Hero Banner/Banner/Etkinlik Kartları/Kategori Görselleri) ortak Görsel/Başlık/Durum/Sıra/İşlemler tablosu. */
export function AdminContentTable({ rows, emptyMessage }: { rows: AdminContentTableRow[]; emptyMessage: string }) {
  if (rows.length === 0) {
    return (
      <div role="status" className="border-border-muted text-foreground/60 rounded-md border p-8 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="border-border-muted overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
          <tr>
            <th className="px-4 py-3 font-semibold">Görsel</th>
            <th className="px-4 py-3 font-semibold">Başlık</th>
            <th className="px-4 py-3 font-semibold">Durum</th>
            <th className="px-4 py-3 font-semibold">Sıra</th>
            <th className="px-4 py-3 font-semibold" />
          </tr>
        </thead>
        <tbody className="divide-border-muted divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface-muted/50">
              <td className="px-4 py-3">
                <div className="bg-surface-muted relative h-12 w-12 overflow-hidden rounded-lg">
                  <ProductImage src={row.imageUrl} alt={row.imageAlt} sizes="48px" className="object-cover" />
                </div>
              </td>
              <td className="px-4 py-3 font-medium">{row.title}</td>
              <td className="px-4 py-3">
                <StatusBadge label={row.isActive ? "Aktif" : "Pasif"} tone={row.isActive ? "success" : "neutral"} />
              </td>
              <td className="px-4 py-3">{row.sortOrder}</td>
              <td className="px-4 py-3 text-right">
                <Link href={row.editHref} className="text-brand font-semibold underline underline-offset-2">
                  Düzenle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
