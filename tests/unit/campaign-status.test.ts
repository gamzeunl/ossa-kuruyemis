import { describe, expect, it } from "vitest";
import { isCampaignCurrentlyActive, resolveCampaignStatus } from "@/lib/campaign-status";

const NOW = new Date("2026-06-15T12:00:00.000Z");

function range(startsAt: string, endsAt: string, isActive = true) {
  return { isActive, startsAt: new Date(startsAt), endsAt: new Date(endsAt) };
}

describe("resolveCampaignStatus — 5 durumlu kampanya sınıflandırması", () => {
  it("isActive=false ise tarih ne olursa olsun PASIF döner", () => {
    const campaign = range("2026-06-01T00:00:00.000Z", "2026-06-30T00:00:00.000Z", false);
    expect(resolveCampaignStatus(campaign, NOW)).toBe("PASIF");
  });

  it("başlangıç tarihi gelecekteyse PLANLANDI döner", () => {
    const campaign = range("2026-07-01T00:00:00.000Z", "2026-07-10T00:00:00.000Z");
    expect(resolveCampaignStatus(campaign, NOW)).toBe("PLANLANDI");
  });

  it("bitiş tarihi geçmişse SONA_ERDI döner", () => {
    const campaign = range("2026-06-01T00:00:00.000Z", "2026-06-10T00:00:00.000Z");
    expect(resolveCampaignStatus(campaign, NOW)).toBe("SONA_ERDI");
  });

  it("24 saatten az kaldıysa BUGUN_BITIYOR döner", () => {
    const campaign = range("2026-06-14T00:00:00.000Z", "2026-06-16T00:00:00.000Z");
    expect(resolveCampaignStatus(campaign, NOW)).toBe("BUGUN_BITIYOR");
  });

  it("24 saatten fazla kaldıysa AKTIF döner", () => {
    const campaign = range("2026-06-14T00:00:00.000Z", "2026-06-20T00:00:00.000Z");
    expect(resolveCampaignStatus(campaign, NOW)).toBe("AKTIF");
  });
});

describe("isCampaignCurrentlyActive — storefront'a gösterim kararının TEK kaynağı", () => {
  it("aktif + tarih aralığı içindeyse true döner", () => {
    const campaign = range("2026-06-01T00:00:00.000Z", "2026-06-30T00:00:00.000Z");
    expect(isCampaignCurrentlyActive(campaign, NOW)).toBe(true);
  });

  it("isActive=false ise tarih aralığı içinde bile olsa false döner", () => {
    const campaign = range("2026-06-01T00:00:00.000Z", "2026-06-30T00:00:00.000Z", false);
    expect(isCampaignCurrentlyActive(campaign, NOW)).toBe(false);
  });

  it("planlanmış (henüz başlamamış) kampanyada false döner", () => {
    const campaign = range("2026-07-01T00:00:00.000Z", "2026-07-10T00:00:00.000Z");
    expect(isCampaignCurrentlyActive(campaign, NOW)).toBe(false);
  });

  it("süresi dolmuş kampanyada false döner", () => {
    const campaign = range("2026-06-01T00:00:00.000Z", "2026-06-10T00:00:00.000Z");
    expect(isCampaignCurrentlyActive(campaign, NOW)).toBe(false);
  });

  it("endsAt tam olarak `now` ise false döner (endsAt hariç, exclusive üst sınır)", () => {
    const campaign = range("2026-06-01T00:00:00.000Z", NOW.toISOString());
    expect(isCampaignCurrentlyActive(campaign, NOW)).toBe(false);
  });
});
