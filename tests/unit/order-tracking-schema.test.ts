import { describe, expect, it } from "vitest";
import { orderTrackingSchema } from "@/lib/order-tracking-schema";

describe("orderTrackingSchema", () => {
  it("geçerli girdiyi kabul eder", () => {
    const result = orderTrackingSchema.safeParse({ orderNumber: "OSSA-20260101-ABC123", contact: "musteri@ornek.com" });
    expect(result.success).toBe(true);
  });

  it("boş orderNumber'ı reddeder", () => {
    const result = orderTrackingSchema.safeParse({ orderNumber: "", contact: "musteri@ornek.com" });
    expect(result.success).toBe(false);
  });

  it("boş contact'ı reddeder", () => {
    const result = orderTrackingSchema.safeParse({ orderNumber: "OSSA-20260101-ABC123", contact: "" });
    expect(result.success).toBe(false);
  });

  it("aşırı uzun orderNumber'ı reddeder", () => {
    const result = orderTrackingSchema.safeParse({ orderNumber: "A".repeat(41), contact: "musteri@ornek.com" });
    expect(result.success).toBe(false);
  });

  it("baş/son boşlukları kırpar", () => {
    const result = orderTrackingSchema.safeParse({ orderNumber: "  OSSA-1  ", contact: "  musteri@ornek.com  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orderNumber).toBe("OSSA-1");
      expect(result.data.contact).toBe("musteri@ornek.com");
    }
  });
});
