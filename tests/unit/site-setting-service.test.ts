import { describe, expect, it } from "vitest";
import { FREE_SHIPPING_THRESHOLD_TRY, STANDARD_SHIPPING_FEE_TRY } from "@/lib/checkout-shipping";
import { getShippingSettings } from "@/server/services/site-setting-service";

describe("getShippingSettings", () => {
  it("sabit kargo iş kuralını döner — checkout (client) ile sipariş oluşturma (server) AYNI değeri kullanır", async () => {
    const settings = await getShippingSettings();
    expect(settings).toEqual({
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD_TRY,
      standardShippingFee: STANDARD_SHIPPING_FEE_TRY,
    });
  });
});
