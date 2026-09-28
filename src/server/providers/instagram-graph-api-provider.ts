import { normalizeInstagramPostUrl } from "@/lib/instagram-post-schema";
import { serverEnv } from "@/config/env";
import { getSiteSettingJson, setSiteSettingJson } from "@/server/repositories/site-setting-repository";

/**
 * Instagram Graph API ("Instagram API with Instagram Login") istemcisi —
 * yalnızca @ossa.kuruyemis hesabının KENDİ medyasını okur. Scraping/HTML
 * parse YOK; resmi `graph.instagram.com` uç noktaları kullanılır.
 *
 * Kurulum (yalnızca hesap sahibinin Meta tarafında yapması gereken, tek
 * seferlik adımlar — bkz. görev sonu raporu):
 * 1. @ossa.kuruyemis Instagram hesabı Professional (Business/Creator) olmalı.
 * 2. developers.facebook.com'da bir uygulama oluşturulup "Instagram" ürünü
 *    ("Instagram API with Instagram Login") eklenir.
 * 3. Uygulama panelinde Instagram > API setup > hesabın yanındaki
 *    "Generate token" ile UZUN ÖMÜRLÜ (60 gün) bir access token üretilir.
 * 4. Token + hesabın Instagram Business Account ID'si ortam değişkenlerine
 *    (`INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`) yazılır.
 *
 * Token yenileme: `ig_refresh_token` — 24 saatten eski, süresi dolmamış
 * token'lar otomatik yenilenip `SiteSetting`'e cache'lenir (bkz.
 * `resolveAccessToken`). 60 gün hiç yenilenmeden geçerse token kalıcı olarak
 * geçersiz olur, adım 3 elle tekrarlanmalıdır (bkz. rapor #14).
 */

const GRAPH_API_BASE = "https://graph.instagram.com";
const MEDIA_FIELDS = "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp";
// Instagram permalink ile doğrudan arama SUNMAZ — hesabın kendi medya listesi
// sayfalanarak taranır. Üst sınır sonsuz döngü riskini engeller (~250 medya).
const MAX_PAGES = 10;
const MIN_REFRESH_AGE_MS = 24 * 60 * 60 * 1000;
const TOKEN_SETTING_KEY = "integrations.instagramAccessToken";

export type InstagramMediaKind = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export interface InstagramMediaResult {
  id: string;
  mediaType: InstagramMediaKind;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  publishedAt: string;
}

interface IgMediaApiItem {
  id: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

interface IgMediaListResponse {
  data: IgMediaApiItem[];
  paging?: { cursors?: { after?: string }; next?: string };
}

interface CachedTokenState {
  token: string;
  refreshedAt: string;
  /** Env'deki token değişirse (ör. elle rotasyon) stale cache'i fark edip sıfırlamak için. */
  envTokenSuffix: string;
}

function requireEnvConfig(): { accessToken: string; businessAccountId: string } {
  const accessToken = serverEnv.INSTAGRAM_ACCESS_TOKEN;
  const businessAccountId = serverEnv.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!accessToken || !businessAccountId) {
    throw new Error(
      "Instagram API yapılandırılmamış (INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID eksik).",
    );
  }
  return { accessToken, businessAccountId };
}

async function refreshLongLivedToken(currentToken: string): Promise<string> {
  const url = new URL(`${GRAPH_API_BASE}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", currentToken);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Instagram token yenileme başarısız (HTTP ${response.status}).`);
  }
  const data: unknown = await response.json();
  const nextToken = (data as { access_token?: unknown }).access_token;
  if (typeof nextToken !== "string" || nextToken.length === 0) {
    throw new Error("Instagram token yenileme yanıtı beklenmeyen biçimde.");
  }
  return nextToken;
}

/** Kullanılacak access token'ı döner — 24 saatten eskiyse önce yenilemeyi dener, sonucu `SiteSetting`'e cache'ler. Yenileme başarısız olursa (geçici ağ hatası vb.) mevcut token'la devam eder — akış bloklanmaz. */
async function resolveAccessToken(): Promise<string> {
  const { accessToken: envToken } = requireEnvConfig();
  const envTokenSuffix = envToken.slice(-8);

  const cached = await getSiteSettingJson<CachedTokenState>(TOKEN_SETTING_KEY);
  if (!cached || cached.envTokenSuffix !== envTokenSuffix) {
    // İlk çalıştırma VEYA env'deki token elle değiştirilmiş (rotasyon) — cache sıfırlanır.
    await setSiteSettingJson(
      TOKEN_SETTING_KEY,
      { token: envToken, refreshedAt: new Date().toISOString(), envTokenSuffix },
      "Instagram uzun ömürlü access token cache'i (otomatik yenilenir, bkz. instagram-graph-api-provider.ts).",
    );
    return envToken;
  }

  const ageMs = Date.now() - new Date(cached.refreshedAt).getTime();
  if (ageMs < MIN_REFRESH_AGE_MS) {
    return cached.token;
  }

  try {
    const refreshed = await refreshLongLivedToken(cached.token);
    await setSiteSettingJson(TOKEN_SETTING_KEY, {
      token: refreshed,
      refreshedAt: new Date().toISOString(),
      envTokenSuffix,
    });
    return refreshed;
  } catch {
    return cached.token;
  }
}

async function fetchMediaPage(
  accessToken: string,
  businessAccountId: string,
  after: string | undefined,
): Promise<IgMediaListResponse> {
  const url = new URL(`${GRAPH_API_BASE}/${businessAccountId}/media`);
  url.searchParams.set("fields", MEDIA_FIELDS);
  url.searchParams.set("access_token", accessToken);
  if (after) {
    url.searchParams.set("after", after);
  }
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Instagram medya listesi alınamadı (HTTP ${response.status}).`);
  }
  return response.json() as Promise<IgMediaListResponse>;
}

function toMediaResult(item: IgMediaApiItem): InstagramMediaResult {
  const mediaType: InstagramMediaKind =
    item.media_type === "VIDEO" || item.media_type === "CAROUSEL_ALBUM" ? item.media_type : "IMAGE";
  return {
    id: item.id,
    mediaType,
    mediaUrl: item.media_url ?? null,
    thumbnailUrl: item.thumbnail_url ?? null,
    caption: item.caption ?? null,
    publishedAt: item.timestamp,
  };
}

/**
 * Admin'in girdiği (normalize edilmiş) permalink'e sahip medyayı OSSA
 * hesabının kendi medya listesinden bulur. Bulunamazsa (gönderi bu hesaba ait
 * değil, silinmiş vb.) `null` döner — anlamlı hata mesajı çağıran tarafta
 * (`admin-instagram.ts`) üretilir.
 */
export async function findInstagramMediaByPermalink(permalink: string): Promise<InstagramMediaResult | null> {
  const { businessAccountId } = requireEnvConfig();
  const accessToken = await resolveAccessToken();
  const target = normalizeInstagramPostUrl(permalink);
  if (!target) {
    return null;
  }

  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await fetchMediaPage(accessToken, businessAccountId, after);
    const match = result.data.find((item) => normalizeInstagramPostUrl(item.permalink) === target);
    if (match) {
      return toMediaResult(match);
    }
    if (!result.paging?.cursors?.after || !result.paging.next) {
      break;
    }
    after = result.paging.cursors.after;
  }
  return null;
}

/** Instagram API için gerekli ortam değişkenleri tanımlı mı — admin action'da erken/anlamlı hata için. */
export function isInstagramApiConfigured(): boolean {
  return Boolean(serverEnv.INSTAGRAM_ACCESS_TOKEN && serverEnv.INSTAGRAM_BUSINESS_ACCOUNT_ID);
}
