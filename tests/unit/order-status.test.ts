import { describe, expect, it } from "vitest";
import { OrderStatus } from "@/generated/prisma/client";
import { canTransitionOrderStatus, getAvailableOrderStatusTransitions } from "@/lib/order-status";

describe("canTransitionOrderStatus", () => {
  it("senaryo 17: izin verilen geçişler çalışır", () => {
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.CONFIRMED, OrderStatus.PROCESSING)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.CONFIRMED, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.PROCESSING, OrderStatus.SHIPPED)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.PROCESSING, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(true);
  });

  it("senaryo 16: geçersiz durum geçişleri reddedilir", () => {
    expect(canTransitionOrderStatus(OrderStatus.CANCELLED, OrderStatus.PROCESSING)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.DELIVERED, OrderStatus.PENDING)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.DELIVERED)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.SHIPPED)).toBe(false);
  });

  it("yönetici bir siparişi asla elle PAID yapamaz (ödeme-güdümlü durumlara geçiş her zaman boş)", () => {
    for (const from of Object.values(OrderStatus)) {
      expect(canTransitionOrderStatus(from, OrderStatus.PAID)).toBe(false);
    }
  });

  it("ödeme-güdümlü durumlardan hiçbir yere manuel geçiş yok (bu fazda boş liste)", () => {
    expect(getAvailableOrderStatusTransitions(OrderStatus.PAYMENT_PROCESSING)).toEqual([]);
    expect(getAvailableOrderStatusTransitions(OrderStatus.PAID)).toEqual([]);
    expect(getAvailableOrderStatusTransitions(OrderStatus.PAYMENT_FAILED)).toEqual([]);
  });

  it("terminal durumlardan (DELIVERED/CANCELLED) hiçbir yere geçiş yok", () => {
    expect(getAvailableOrderStatusTransitions(OrderStatus.DELIVERED)).toEqual([]);
    expect(getAvailableOrderStatusTransitions(OrderStatus.CANCELLED)).toEqual([]);
  });

  it("tüm OrderStatus değerleri için bir geçiş listesi tanımlı (eksik/undefined yok)", () => {
    for (const status of Object.values(OrderStatus)) {
      expect(getAvailableOrderStatusTransitions(status)).toBeInstanceOf(Array);
    }
  });
});
