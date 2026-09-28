import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { BoxIcon, HeartIcon, MapPinIcon, UserIcon } from "@/components/ui/icons";
import { requireUser } from "@/server/auth/guard";
import { roleLabels } from "@/lib/role-labels";
import { listAddressesForUser } from "@/server/repositories/address-repository";
import { listOrdersForUser } from "@/server/repositories/order-repository";
import { listFavoriteProductIds } from "@/server/repositories/favorite-repository";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Hesabım",
  description: "Hesap bilgilerinizi görüntüleyin.",
};

export default async function HesabimPage() {
  const user = await requireUser("/hesabim");
  const [{ total: orderCount }, favoriteProductIds, addresses] = await Promise.all([
    listOrdersForUser(user.id, { page: 1, pageSize: 1 }),
    listFavoriteProductIds(user.id),
    listAddressesForUser(user.id),
  ]);
  const favoriteCount = favoriteProductIds.length;
  const addressCount = addresses.length;

  return (
    <PageContainer maxWidthClassName="max-w-3xl" className="gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Hesabım</h1>
        <p className="text-foreground/60 text-sm">
          Merhaba {user.firstName}, hesap bilgilerinizi buradan yönetebilirsiniz.
        </p>
      </div>

      <section className="border-border-muted bg-surface flex flex-col gap-4 rounded-2xl border p-6 shadow-sm">
        <h2 className="text-foreground text-base font-bold">Kullanıcı Bilgileri</h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-foreground/50 text-xs font-semibold uppercase">Ad Soyad</dt>
            <dd className="text-foreground font-medium">
              {user.firstName} {user.lastName}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-foreground/50 text-xs font-semibold uppercase">E-posta</dt>
            <dd className="text-foreground font-medium">{user.email}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-foreground/50 text-xs font-semibold uppercase">Hesap Türü</dt>
            <dd className="text-foreground font-medium">{roleLabels[user.role]}</dd>
          </div>
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/hesabim/siparisler"
          className="border-border-muted hover:border-brand bg-surface group flex items-start gap-3.5 rounded-2xl border p-5 shadow-sm transition-colors"
        >
          <span className="bg-brand/10 text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <BoxIcon className="h-5 w-5" />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <h2 className="text-foreground text-base font-semibold">Siparişlerim</h2>
            <p className="text-foreground/60 text-sm">
              {orderCount > 0 ? `${orderCount} sipariş · Son siparişinizi takip edin` : "Henüz siparişiniz yok"}
            </p>
          </div>
          <span aria-hidden="true" className="text-foreground/30 group-hover:text-brand mt-1.5 transition-colors">
            →
          </span>
        </Link>

        <Link
          href="/hesabim/favoriler"
          className="border-border-muted hover:border-brand bg-surface group flex items-start gap-3.5 rounded-2xl border p-5 shadow-sm transition-colors"
        >
          <span className="bg-brand/10 text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <HeartIcon className="h-5 w-5" />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <h2 className="text-foreground text-base font-semibold">Favorilerim</h2>
            <p className="text-foreground/60 text-sm">
              {favoriteCount > 0 ? `${favoriteCount} favori ürün` : "Henüz favori ürününüz yok"}
            </p>
          </div>
          <span aria-hidden="true" className="text-foreground/30 group-hover:text-brand mt-1.5 transition-colors">
            →
          </span>
        </Link>

        <Link
          href="/hesabim/adresler"
          className="border-border-muted hover:border-brand bg-surface group flex items-start gap-3.5 rounded-2xl border p-5 shadow-sm transition-colors"
        >
          <span className="bg-brand/10 text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <MapPinIcon className="h-5 w-5" />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <h2 className="text-foreground text-base font-semibold">Adreslerim</h2>
            <p className="text-foreground/60 text-sm">
              {addressCount > 0
                ? `${addressCount} kayıtlı adres`
                : "Kayıtlı teslimat ve fatura adreslerinizi yönetin."}
            </p>
          </div>
          <span aria-hidden="true" className="text-foreground/30 group-hover:text-brand mt-1.5 transition-colors">
            →
          </span>
        </Link>

        <Link
          href="/hesabim/ayarlar"
          className="border-border-muted hover:border-brand bg-surface group flex items-start gap-3.5 rounded-2xl border p-5 shadow-sm transition-colors"
        >
          <span className="bg-brand/10 text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <UserIcon className="h-5 w-5" />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <h2 className="text-foreground text-base font-semibold">Hesap Ayarları</h2>
            <p className="text-foreground/60 text-sm">Profil ve hesap bilgilerinizi güncelleyin.</p>
          </div>
          <span aria-hidden="true" className="text-foreground/30 group-hover:text-brand mt-1.5 transition-colors">
            →
          </span>
        </Link>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-base font-bold">Güvenli Çıkış</h2>
          <p className="text-foreground/60 text-sm">
            Bu cihazdaki oturumunuzu sonlandırır. Paylaşılan bir cihazdaysanız çıkış yapmanızı öneririz.
          </p>
        </div>
        <SignOutButton />
      </section>
    </PageContainer>
  );
}
