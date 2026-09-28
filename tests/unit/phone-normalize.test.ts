import { describe, expect, it } from "vitest";
import { normalizePhoneForCompare } from "@/lib/phone-normalize";

describe("normalizePhoneForCompare", () => {
  it("boşluk/tire içeren numarayı sade rakamlara indirger", () => {
    expect(normalizePhoneForCompare("0534 956 78 79")).toBe("5349567879");
  });

  it("baştaki 0 önekini kırpar", () => {
    expect(normalizePhoneForCompare("05349567879")).toBe("5349567879");
  });

  it("baştaki +90 önekini kırpar", () => {
    expect(normalizePhoneForCompare("+905349567879")).toBe("5349567879");
  });

  it("baştaki 90 önekini (ülke kodu, önek olmadan) kırpar", () => {
    expect(normalizePhoneForCompare("905349567879")).toBe("5349567879");
  });

  it("önek yoksa (10 hane) olduğu gibi döner", () => {
    expect(normalizePhoneForCompare("5349567879")).toBe("5349567879");
  });

  it("farklı yazımlar aynı normalize edilmiş değere ulaşır", () => {
    const variants = ["0534 956 78 79", "0534-956-78-79", "+90 534 956 78 79", "5349567879"];
    const normalized = variants.map(normalizePhoneForCompare);
    expect(new Set(normalized).size).toBe(1);
  });
});
