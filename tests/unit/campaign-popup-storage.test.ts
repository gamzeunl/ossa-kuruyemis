import { describe, expect, it } from "vitest";
import {
  hasCampaignPopupBeenSeenThisSession,
  markCampaignPopupSeenThisSession,
  type CampaignPopupStorage,
} from "@/lib/campaign-popup-storage";

function createFakeStorage(): CampaignPopupStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("campaign-popup-storage — kampanya bazlı sessionStorage sıklık kontrolü", () => {
  it("hiç işaretlenmemiş bir oturumda false döner (popup gösterilebilir)", () => {
    const storage = createFakeStorage();
    expect(hasCampaignPopupBeenSeenThisSession(storage, "campaign-1")).toBe(false);
  });

  it("işaretlendikten sonra AYNI campaignId için true döner (aynı sekmede tekrar gösterilmez)", () => {
    const storage = createFakeStorage();
    markCampaignPopupSeenThisSession(storage, "campaign-1");
    expect(hasCampaignPopupBeenSeenThisSession(storage, "campaign-1")).toBe(true);
  });

  it("yeni bir oturumu (temiz storage) simüle eden ayrı bir örnekte false döner (yeni sekme/ziyarette tekrar gösterilir)", () => {
    const firstSessionStorage = createFakeStorage();
    markCampaignPopupSeenThisSession(firstSessionStorage, "campaign-1");
    expect(hasCampaignPopupBeenSeenThisSession(firstSessionStorage, "campaign-1")).toBe(true);

    const newSessionStorage = createFakeStorage();
    expect(hasCampaignPopupBeenSeenThisSession(newSessionStorage, "campaign-1")).toBe(false);
  });

  it("farklı campaignId farklı bir anahtar kullanır — bir kampanya görülmüş olması diğerini etkilemez", () => {
    const storage = createFakeStorage();
    markCampaignPopupSeenThisSession(storage, "campaign-1");

    expect(hasCampaignPopupBeenSeenThisSession(storage, "campaign-1")).toBe(true);
    expect(hasCampaignPopupBeenSeenThisSession(storage, "campaign-2")).toBe(false);
  });

  it("admin YENİ bir haftalık kampanya başlattığında (farklı campaignId) popup aynı sekmede tekrar gösterilebilir", () => {
    const storage = createFakeStorage();
    markCampaignPopupSeenThisSession(storage, "campaign:old-weekly-id");

    expect(hasCampaignPopupBeenSeenThisSession(storage, "campaign:new-weekly-id")).toBe(false);
  });
});
