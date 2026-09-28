import type { Metadata } from "next";
import { AttentionPanel } from "@/components/admin/dashboard/attention-panel";
import { RecentOrdersCard } from "@/components/admin/dashboard/recent-orders-card";
import { StatCard } from "@/components/admin/dashboard/stat-card";
import { PageContainer } from "@/components/layout/container";
import { BagIcon, BoxIcon, ClockIcon, DocumentTextIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format-money";
import { roleLabels } from "@/lib/role-labels";
import { requireRole } from "@/server/auth/guard";
import { getDashboardData } from "@/server/services/dashboard-service";

export const metadata: Metadata = {
  title: "Yönetim",
  description: "Yönetim paneli.",
};

export default async function YonetimPage() {
  const [user, dashboard] = await Promise.all([requireRole("ADMIN", "/yonetim"), getDashboardData()]);

  return (
    <PageContainer maxWidthClassName="max-w-[1300px]" className="gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Yönetim Alanı</h1>
        <p className="text-foreground/60 text-sm">
          Erişim doğrulandı: {user.firstName} {user.lastName} ({roleLabels[user.role]}).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={BagIcon} value={dashboard.kpis.todayOrders} label="Bugünkü Sipariş" description="Bugün oluşturulan siparişler" />
        <StatCard icon={ClockIcon} value={dashboard.kpis.pendingOrders} label="Bekleyen Sipariş" description="Beklemede durumundaki siparişler" />
        <StatCard icon={BagIcon} value={dashboard.kpis.totalOrders} label="Toplam Sipariş" description="Bugüne kadar alınan tüm siparişler" />
        <StatCard
          icon={BagIcon}
          value={formatPrice(dashboard.kpis.totalRevenue)}
          label="Toplam Satış"
          description="İptal/iade hariç, kesinleşmiş sipariş tutarları"
        />
        <StatCard icon={BoxIcon} value={dashboard.kpis.outOfStockProducts} label="Tükenen Ürün" description="Stoğu tükenmiş aktif ürünler" />
        <StatCard
          icon={DocumentTextIcon}
          value={dashboard.kpis.newContactRequests}
          label="Yeni İletişim Talebi"
          description="Henüz incelenmemiş yeni talepler"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentOrdersCard orders={dashboard.recentOrders} />
        <AttentionPanel
          outOfStockProductCount={dashboard.kpis.outOfStockProducts}
          pendingOrderCount={dashboard.kpis.pendingOrders}
          newContactRequestCount={dashboard.kpis.newContactRequests}
        />
      </div>
    </PageContainer>
  );
}
