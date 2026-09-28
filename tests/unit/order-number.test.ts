import { describe, expect, it } from "vitest";
import { generateOrderNumber } from "@/lib/order-number";

describe("generateOrderNumber", () => {
  it("OSSA-YYYYMMDD-XXXXXX biçimini üretir", () => {
    const orderNumber = generateOrderNumber(new Date("2026-07-29T12:00:00Z"));
    expect(orderNumber).toMatch(/^OSSA-20260729-[A-Z0-9]{6}$/);
  });

  it("karışabilecek karakterleri (0, O, 1, I) içermez", () => {
    const orderNumber = generateOrderNumber();
    const suffix = orderNumber.split("-")[2];
    expect(suffix).not.toMatch(/[01OI]/);
  });

  it("ardışık çağrılarda farklı sipariş numaraları üretir (tahmin edilemezlik)", () => {
    const numbers = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
    expect(numbers.size).toBe(50);
  });

  it("Prisma id'sinin aksine tahmin edilemez rastgele bir sonek kullanır (sıralı değil)", () => {
    const first = generateOrderNumber().split("-")[2];
    const second = generateOrderNumber().split("-")[2];
    expect(first).not.toBe(second);
  });
});
