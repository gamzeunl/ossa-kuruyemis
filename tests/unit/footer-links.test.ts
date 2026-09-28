import { describe, expect, it } from "vitest";
import { EXCLUDED_FOOTER_CATEGORY_SLUGS, FOOTER_LEGAL_ITEMS, FOOTER_STATIC_SECTIONS } from "@/lib/footer-links";

function findItem(label: string) {
  for (const section of FOOTER_STATIC_SECTIONS) {
    const item = section.items.find((entry) => entry.label === label);
    if (item) return item;
  }
  return undefined;
}

describe("footer-links", () => {
  it("'Özel Paketler' hiçbir statik bölümde YOKTUR", () => {
    expect(findItem("Özel Paketler")).toBeUndefined();
  });

  it("'kampanyali-paketler' kategorisi footer'ın Kategoriler listesinden hariç tutulur", () => {
    expect(EXCLUDED_FOOTER_CATEGORY_SLUGS).toContain("kampanyali-paketler");
  });

  it("'Kariyer' artık statik bölümlerde YOKTUR", () => {
    expect(findItem("Kariyer")).toBeUndefined();
  });

  it("Kurumsal bölümünde KVKK linki var ve /kvkk'ya gider", () => {
    const item = findItem("KVKK");
    expect(item?.href).toBe("/kvkk");
  });

  it("Müşteri Hizmetleri: SSS linki /sss'ye gider", () => {
    const item = findItem("Sıkça Sorulan Sorular");
    expect(item?.href).toBe("/sss");
  });

  it("Müşteri Hizmetleri: Sipariş Takibi linki /siparis-takibi'ye gider", () => {
    const item = findItem("Sipariş Takibi");
    expect(item?.href).toBe("/siparis-takibi");
  });

  it("Müşteri Hizmetleri: Canlı Destek gerçek bir WhatsApp linkine gider (external)", () => {
    const item = findItem("Canlı Destek");
    expect(item?.href).toMatch(/^https:\/\/wa\.me\/905349567879/);
    expect(item?.external).toBe(true);
  });

  it("İletişim: Mağaza Bilgileri gerçek bir çapaya gider", () => {
    const item = findItem("Mağaza Bilgileri");
    expect(item?.href).toBe("/iletisim#magaza");
  });

  it("hiçbir statik bölüm öğesi href'siz (placeholder metin) kalmadı", () => {
    for (const section of FOOTER_STATIC_SECTIONS) {
      for (const item of section.items) {
        expect(item.href, `${section.title} > ${item.label} href'siz kaldı`).toBeTruthy();
      }
    }
  });

  it("hukuki/bilgilendirme linkleri (legalItems) hepsi gerçek rotalara gider", () => {
    for (const item of FOOTER_LEGAL_ITEMS) {
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("Kurumsal bölümünde Gizlilik Politikası linki var ve /gizlilik-politikasi'ye gider", () => {
    const item = findItem("Gizlilik Politikası");
    expect(item?.href).toBe("/gizlilik-politikasi");
  });

  it("Müşteri Hizmetleri: Teslimat ve İade linki /teslimat-iade'a gider", () => {
    const item = findItem("Teslimat ve İade");
    expect(item?.href).toBe("/teslimat-iade");
  });

  it("Müşteri Hizmetleri: Mesafeli Satış Sözleşmesi linki var", () => {
    const item = findItem("Mesafeli Satış Sözleşmesi");
    expect(item?.href).toBe("/mesafeli-satis-sozlesmesi");
  });

  it("eski birleştirilmiş rotalar (/kargo-ve-teslimat, /iade-ve-degisim) artık HİÇBİR yerde yok", () => {
    const allHrefs = [
      ...FOOTER_STATIC_SECTIONS.flatMap((s) => s.items.map((i) => i.href)),
      ...FOOTER_LEGAL_ITEMS.map((i) => i.href),
    ];
    expect(allHrefs).not.toContain("/kargo-ve-teslimat");
    expect(allHrefs).not.toContain("/iade-ve-degisim");
  });

  it("legalItems alt barında /teslimat-iade var, Kullanım Koşulları ve Ön Bilgilendirme Formu yetim kalmadı", () => {
    const hrefs = FOOTER_LEGAL_ITEMS.map((i) => i.href);
    expect(hrefs).toContain("/teslimat-iade");
    expect(hrefs).toContain("/kullanim-kosullari");
    expect(hrefs).toContain("/on-bilgilendirme-formu");
  });
});
