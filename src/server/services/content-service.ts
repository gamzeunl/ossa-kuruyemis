import { BannerType, type InstagramMediaKind } from "@/generated/prisma/client";
import { findActiveBannerByType, listActiveBannersByType } from "@/server/repositories/banner-repository";
import { listActiveEventCards } from "@/server/repositories/event-card-repository";
import { listActiveInstagramPosts } from "@/server/repositories/instagram-post-repository";

export interface BannerSummary {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string | null;
  primaryButtonLabel: string;
  primaryButtonHref: string;
  secondaryButtonLabel: string | null;
  secondaryButtonHref: string | null;
}

export interface EventCardSummary {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string | null;
  buttonLabel: string;
  buttonHref: string;
}

/** Ana sayfa Hero slider'ı için aktif Hero banner'lar, `sortOrder`'a göre ilk `limit` kadarı (eksikse sabit yedek içerikle tamamlanır). */
export async function getActiveHeroBanners(limit: number): Promise<BannerSummary[]> {
  return listActiveBannersByType(BannerType.HERO, limit);
}

/** Ana sayfa tam genişlik banner bölümü için aktif Full-width banner; yoksa `null`. */
export async function getActiveFullWidthBanner(): Promise<BannerSummary | null> {
  return findActiveBannerByType(BannerType.FULL_WIDTH);
}

/** Ana sayfa "Kına ve Düğün Çerezleri" bölümü için aktif etkinlik kartları, `sortOrder`'a göre ilk `limit` kadarı. */
export async function getActiveEventCards(limit: number): Promise<EventCardSummary[]> {
  return listActiveEventCards(limit);
}

export interface InstagramPostSummary {
  id: string;
  postUrl: string;
  caption: string | null;
  mediaType: InstagramMediaKind | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  captionCached: string | null;
}

/** Ana sayfa Instagram vitrini için aktif VE Instagram API'den başarıyla senkronize olmuş gönderiler, `sortOrder`'a göre ilk `limit` kadarı. */
export async function getActiveInstagramPosts(limit: number): Promise<InstagramPostSummary[]> {
  return listActiveInstagramPosts(limit);
}
