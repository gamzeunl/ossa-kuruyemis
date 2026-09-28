import { describe, expect, it } from "vitest";
import { isAdminPathname } from "@/lib/admin-route";

describe("isAdminPathname", () => {
  it("/yonetim kökünü admin olarak tanır", () => {
    expect(isAdminPathname("/yonetim")).toBe(true);
  });

  it("/yonetim altındaki alt rotaları admin olarak tanır", () => {
    expect(isAdminPathname("/yonetim/kampanyalar")).toBe(true);
    expect(isAdminPathname("/yonetim/kampanyalar/yeni")).toBe(true);
    expect(isAdminPathname("/yonetim/kampanyalar/abc123")).toBe(true);
  });

  it("storefront rotalarını admin olarak tanımaz", () => {
    expect(isAdminPathname("/")).toBe(false);
    expect(isAdminPathname("/urunler")).toBe(false);
    expect(isAdminPathname("/urunler/kavrulmus-ic-findik")).toBe(false);
  });

  it("/yonetim önekli ama farklı bir storefront rotasını YANLIŞLIKLA admin saymaz", () => {
    expect(isAdminPathname("/yonetim-hakkinda")).toBe(false);
  });
});
