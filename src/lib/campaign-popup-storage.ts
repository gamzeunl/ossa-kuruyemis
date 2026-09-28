/** `sessionStorage`'ın gerçek kullandığımız minimal kısmı — testlerde sahte bir bellek nesnesiyle değiştirilebilir. */
export interface CampaignPopupStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const SESSION_KEY_PREFIX = "ossa_campaign_popup_seen_";

function buildSessionKey(campaignId: string): string {
  return `${SESSION_KEY_PREFIX}${campaignId}`;
}

/**
 * Bu tarayıcı sekmesi/oturumu içinde BU KAMPANYA (`campaignId`) zaten
 * gösterildiyse `true` döner. Anahtar kampanya kimliğine özgüdür — aynı
 * sekmede aynı kampanya tekrar açılmaz, ama admin YENİ bir kampanya
 * başlattığında (farklı `campaignId`) popup tekrar gösterilebilir.
 * `sessionStorage` kullanıldığından sekme kapanınca tarayıcı kendisi
 * temizler, bu yüzden ayrı bir süre/zaman damgası mantığı GEREKMEZ.
 */
export function hasCampaignPopupBeenSeenThisSession(storage: CampaignPopupStorage, campaignId: string): boolean {
  return storage.getItem(buildSessionKey(campaignId)) !== null;
}

/** Popup'ın az önce gösterildiğini işaretler — gösterme kararı anında çağrılır. */
export function markCampaignPopupSeenThisSession(storage: CampaignPopupStorage, campaignId: string): void {
  storage.setItem(buildSessionKey(campaignId), "1");
}
