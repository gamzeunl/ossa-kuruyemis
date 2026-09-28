import { OrderStatus } from "@/generated/prisma/enums";

/**
 * Yönetim "Siparişler" listesindeki 6 sadeleştirilmiş görünüm kovası — TEK
 * kaynak. Hem özet sayaçlar hem filtre sekmeleri hem DB sorgu koşulu (bkz.
 * `order-repository.ts::buildAdminOrderWhere`) buradan okur, tekrar
 * tanımlanmaz. "Yeni" kovası PENDING+CONFIRMED'i birlikte kapsar (ikisi de
 * henüz fiziksel hazırlık aşamasına geçmemiş siparişlerdir); diğer kovalar
 * `OrderStatus`'a birebir karşılık gelir.
 */
export type OrderStatusBucket = "ALL" | "NEW" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export const ORDER_STATUS_BUCKET_LABELS: Record<OrderStatusBucket, string> = {
  ALL: "Tümü",
  NEW: "Yeni",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Tamamlanan",
  CANCELLED: "İptal",
};

export const ORDER_STATUS_BUCKETS: OrderStatusBucket[] = [
  "ALL",
  "NEW",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

/** İlgili kovadaki gerçek `OrderStatus` değerleri — sayaç/filtre sorgusu bunu kullanır. */
export function getOrderStatusesForBucket(bucket: OrderStatusBucket): OrderStatus[] {
  switch (bucket) {
    case "ALL":
      return [];
    case "NEW":
      return [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    case "PROCESSING":
      return [OrderStatus.PROCESSING];
    case "SHIPPED":
      return [OrderStatus.SHIPPED];
    case "DELIVERED":
      return [OrderStatus.DELIVERED];
    case "CANCELLED":
      return [OrderStatus.CANCELLED];
  }
}

export function isOrderStatusBucket(value: string): value is OrderStatusBucket {
  return (ORDER_STATUS_BUCKETS as string[]).includes(value);
}
