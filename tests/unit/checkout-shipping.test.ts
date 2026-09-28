import { describe, expect, it } from "vitest";
import {
  computeOrderTotal,
  FREE_SHIPPING_THRESHOLD_TRY,
  resolveShippingFee,
  STANDARD_SHIPPING_FEE_TRY,
} from "@/lib/checkout-shipping";

describe("resolveShippingFee", () => {
  it("eşik tanımlı ve karşılanmışsa ücretsiz döner", () => {
    const result = resolveShippingFee(
      { freeShippingThreshold: 500, standardShippingFee: 50 },
      600,
    );
    expect(result).toEqual({ status: "free" });
  });

  it("eşik karşılanmamışsa standart ücreti döner", () => {
    const result = resolveShippingFee(
      { freeShippingThreshold: 500, standardShippingFee: 50 },
      100,
    );
    expect(result).toEqual({ status: "fee", amount: 50 });
  });

  it("hiçbir ayar tanımlı değilse 'unknown' döner (uydurma 0/ücretsiz gösterilmez)", () => {
    const result = resolveShippingFee(
      { freeShippingThreshold: null, standardShippingFee: null },
      100,
    );
    expect(result).toEqual({ status: "unknown" });
  });
});

describe("computeOrderTotal", () => {
  it("kargo ücreti bilinmiyorsa null döner (bilinçli olarak kesin toplam gösterilmez)", () => {
    expect(computeOrderTotal(100, { status: "unknown" })).toBeNull();
  });

  it("ücretsiz kargoda toplam yalnızca ara toplamdır", () => {
    expect(computeOrderTotal(100, { status: "free" })).toBe(100);
  });

  it("ücretli kargoda toplam ara toplam + kargo ücretidir", () => {
    expect(computeOrderTotal(100, { status: "fee", amount: 25 })).toBe(125);
  });
});

describe("sabit kargo iş kuralı (1.500 TL üzeri ücretsiz, altı 120 TL)", () => {
  const FIXED_SETTINGS = {
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD_TRY,
    standardShippingFee: STANDARD_SHIPPING_FEE_TRY,
  };

  it("sabitler 1500/120 olarak tanımlıdır", () => {
    expect(FREE_SHIPPING_THRESHOLD_TRY).toBe(1500);
    expect(STANDARD_SHIPPING_FEE_TRY).toBe(120);
  });

  it("tam eşik tutarında (1500) kargo ücretsizdir", () => {
    expect(resolveShippingFee(FIXED_SETTINGS, 1500)).toEqual({ status: "free" });
  });

  it("eşik üzerinde kargo ücretsizdir", () => {
    expect(resolveShippingFee(FIXED_SETTINGS, 2000)).toEqual({ status: "free" });
  });

  it("eşik altında sabit 120 TL kargo ücreti uygulanır", () => {
    expect(resolveShippingFee(FIXED_SETTINGS, 1499.99)).toEqual({ status: "fee", amount: 120 });
    expect(resolveShippingFee(FIXED_SETTINGS, 0)).toEqual({ status: "fee", amount: 120 });
  });

  it("hiçbir durumda 'unknown' dönmez — toplam her zaman kesin hesaplanır", () => {
    for (const subtotal of [0, 500, 1499.99, 1500, 5000]) {
      const shipping = resolveShippingFee(FIXED_SETTINGS, subtotal);
      expect(shipping.status).not.toBe("unknown");
      expect(computeOrderTotal(subtotal, shipping)).not.toBeNull();
    }
  });
});
