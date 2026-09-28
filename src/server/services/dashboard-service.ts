import { OrderStatus } from "@/generated/prisma/client";
import { parseOrderAddressSnapshot } from "@/lib/order-address-snapshot";
import { countNewContactRequests } from "@/server/repositories/contact-repository";
import {
  countOrdersByStatus,
  countOrdersCreatedToday,
  listOrdersForAdmin,
  sumOrderGrandTotal,
} from "@/server/repositories/order-repository";
import { countOutOfStockProducts } from "@/server/repositories/product-repository";

const RECENT_ORDERS_LIMIT = 5;

export interface DashboardKpis {
  todayOrders: number;
  pendingOrders: number;
  totalOrders: number;
  totalRevenue: string;
  outOfStockProducts: number;
  newContactRequests: number;
}

export interface DashboardOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  createdAt: Date;
  status: OrderStatus;
  grandTotal: string | null;
}

export interface DashboardData {
  kpis: DashboardKpis;
  recentOrders: DashboardOrderRow[];
}

/**
 * Yönetim dashboard'unun TÜM verisini TEK bir yerden, tek `Promise.all` içinde
 * toplar. Sadeleştirilmiş dashboard yalnızca işletme sahibinin ihtiyacı olan
 * 6 KPI + son siparişler listesini taşır — içerik/sistem durumu, pazarlama
 * özeti, stok hareket geçmişi gibi teknik/geliştirici ağırlıklı kartlar
 * BİLEREK kaldırıldı (bkz. görev: "Dashboard'da developer/debug bilgisi
 * doldurma"); bu bilgilere artık kendi ekranlarından ("Ana Sayfa Yönetimi",
 * "Stok Yönetimi" vb.) ulaşılıyor. N+1 yok — sabit sayıda bağımsız sorgu.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const [recentOrdersResult, pendingOrders, newContactRequestCount, outOfStockProducts, todayOrders, totalRevenue] =
    await Promise.all([
      listOrdersForAdmin({ page: 1, pageSize: RECENT_ORDERS_LIMIT }),
      countOrdersByStatus(OrderStatus.PENDING),
      countNewContactRequests(),
      countOutOfStockProducts(),
      countOrdersCreatedToday(),
      sumOrderGrandTotal(),
    ]);

  const recentOrders: DashboardOrderRow[] = recentOrdersResult.rows.map((order) => {
    const address = parseOrderAddressSnapshot(order.shippingAddressSnapshot);
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: address ? `${address.firstName} ${address.lastName}` : "—",
      createdAt: order.createdAt,
      status: order.status,
      grandTotal: order.totalStatus === "FINAL" ? order.grandTotal.toString() : null,
    };
  });

  return {
    kpis: {
      todayOrders,
      pendingOrders,
      totalOrders: recentOrdersResult.total,
      totalRevenue,
      outOfStockProducts,
      newContactRequests: newContactRequestCount,
    },
    recentOrders,
  };
}
