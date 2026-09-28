import { describe, expect, it } from "vitest";
import { businessLegalInfo, getVerifiedBusinessInfoFields } from "@/lib/business-info";

describe("businessLegalInfo", () => {
  it("her zaman doğrulanmış çekirdek alanları içerir", () => {
    expect(businessLegalInfo.displayName).toBe("OSSA Kuruyemiş");
    expect(businessLegalInfo.proprietorName).toBe("Osman Sarı");
    expect(businessLegalInfo.address.length).toBeGreaterThan(0);
    expect(businessLegalInfo.phone.length).toBeGreaterThan(0);
  });

  it("doğrulanmamış alanlar şu an null'dır (uydurulmadı)", () => {
    expect(businessLegalInfo.email).toBeNull();
    expect(businessLegalInfo.kep).toBeNull();
    expect(businessLegalInfo.mersis).toBeNull();
    expect(businessLegalInfo.taxOfficeAndNumber).toBeNull();
    expect(businessLegalInfo.chamberName).toBeNull();
    expect(businessLegalInfo.chamberRulesUrl).toBeNull();
    expect(businessLegalInfo.registeredTrademark).toBeNull();
  });
});

describe("getVerifiedBusinessInfoFields", () => {
  it("yalnızca dolu (doğrulanmış) alanları döner", () => {
    const fields = getVerifiedBusinessInfoFields();
    const labels = fields.map((f) => f.label);

    expect(labels).toContain("İşletme");
    expect(labels).toContain("Yetkili / Mükellef");
    expect(labels).toContain("Adres");
    expect(labels).toContain("Telefon");

    // Şu an null olan alanlar hiç listede olmamalı.
    expect(labels).not.toContain("E-posta");
    expect(labels).not.toContain("KEP");
    expect(labels).not.toContain("MERSİS No");
    expect(labels).not.toContain("Meslek Odası");
    expect(labels).not.toContain("Marka Tescili");
  });

  it("hiçbir alan boş/placeholder metin değeri taşımaz", () => {
    const fields = getVerifiedBusinessInfoFields();
    for (const field of fields) {
      expect(field.value.trim().length).toBeGreaterThan(0);
      expect(field.value).not.toMatch(/^\[.*\]$/); // köşeli parantez placeholder kalıntısı yok
      expect(field.value.toLowerCase()).not.toContain("doğrulan");
      expect(field.value.toLowerCase()).not.toContain("yakında");
      expect(field.value).not.toBe("-");
    }
  });
});
