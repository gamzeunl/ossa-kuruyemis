import { describe, expect, it } from "vitest";
import type { OrderEmailType } from "@/generated/prisma/client";
import { renderOrderEmail, type OrderEmailData } from "@/emails/order-emails";

const ALL_TYPES: OrderEmailType[] = [
  "ORDER_RECEIVED",
  "STATUS_CONFIRMED",
  "STATUS_PROCESSING",
  "STATUS_SHIPPED",
  "STATUS_DELIVERED",
  "STATUS_CANCELLED",
];

function baseData(overrides: Partial<OrderEmailData> = {}): OrderEmailData {
  return {
    orderNumber: "OSSA-20260730-ABC123",
    createdAt: new Date("2026-07-30T10:00:00.000Z"),
    customerName: "Ayşe Yılmaz",
    status: "PENDING",
    items: [
      { productName: "Kavrulmuş İç Fındık", quantity: 2 },
      { productName: "Antep Fıstığı", quantity: 1 },
    ],
    subtotal: "250.00",
    shippingTotal: "50.00",
    shippingPriceStatus: "FIXED",
    grandTotal: "300.00",
    totalStatus: "FINAL",
    ...overrides,
  };
}

describe("renderOrderEmail — doğru şablon seçimi", () => {
  it.each(ALL_TYPES)("her tip (%s) için farklı ve türe özgü bir başlık/subject üretir", (type) => {
    const rendered = renderOrderEmail(type, baseData());
    expect(rendered.subject).toContain(baseData().orderNumber);

    const otherTypes = ALL_TYPES.filter((t) => t !== type);
    const otherSubjects = otherTypes.map((t) => renderOrderEmail(t, baseData()).subject);
    expect(otherSubjects).not.toContain(rendered.subject);
  });

  it("ORDER_RECEIVED: ödeme tamamlandığını İMA ETMEZ", () => {
    const rendered = renderOrderEmail("ORDER_RECEIVED", baseData());
    expect(rendered.text).toContain("onayınızı bekliyor");
    expect(rendered.text.toLowerCase()).not.toContain("ödeme tamamlandı");
    expect(rendered.text.toLowerCase()).not.toContain("ödeme başarılı");
  });

  it("STATUS_CANCELLED: iptal edildiğini belirtir", () => {
    const rendered = renderOrderEmail("STATUS_CANCELLED", baseData());
    expect(rendered.text).toContain("iptal edildi");
  });

  it("hiçbir şablonda 'ödeme tamamlandı'/'ödeme başarılı' gibi yanlış ifade geçmez", () => {
    for (const type of ALL_TYPES) {
      const rendered = renderOrderEmail(type, baseData());
      const lower = (rendered.text + rendered.html).toLowerCase();
      expect(lower).not.toContain("ödeme tamamlandı");
      expect(lower).not.toContain("ödeme başarılı");
    }
  });
});

describe("renderOrderEmail — kargo/toplam durumu", () => {
  it("totalStatus=PENDING iken kesin tutar YERİNE 'Henüz belirlenmedi' gösterir", () => {
    const rendered = renderOrderEmail(
      "ORDER_RECEIVED",
      baseData({ totalStatus: "PENDING", shippingTotal: null, shippingPriceStatus: "PENDING" }),
    );
    expect(rendered.text).toContain("Henüz belirlenmedi");
    // Ara toplam formatlanmış olabilir ama TOPLAM satırı kesin bir TL tutarı TAŞIMAZ.
    expect(rendered.text).not.toMatch(/Toplam:.*₺/);
  });

  it("totalStatus=FINAL iken kesin (formatlanmış) tutar gösterir", () => {
    const rendered = renderOrderEmail("ORDER_RECEIVED", baseData({ totalStatus: "FINAL" }));
    expect(rendered.text).toMatch(/Toplam:.*300/);
    expect(rendered.text).not.toContain("Henüz belirlenmedi");
  });
});

describe("renderOrderEmail — içerik gereksinimleri", () => {
  it("sipariş no, tarih, ürün özeti, sipariş durumu, kargo/toplam durumu, müşteri adı içerir", () => {
    const data = baseData({ status: "CONFIRMED" });
    const rendered = renderOrderEmail("STATUS_CONFIRMED", data);
    expect(rendered.text).toContain(data.orderNumber);
    expect(rendered.text).toContain("30 Temmuz 2026");
    expect(rendered.text).toContain("Ayşe Yılmaz");
    expect(rendered.text).toContain("Kavrulmuş İç Fındık ×2");
    expect(rendered.text).toContain("Antep Fıstığı ×1");
    expect(rendered.text).toContain("Onaylandı");
    expect(rendered.text).toContain("₺50,00");
    expect(rendered.text).toContain("₺300,00");
  });

  it("render edilmiş içerikte token/fingerprint/idempotencyKey ASLA geçmez", () => {
    for (const type of ALL_TYPES) {
      const rendered = renderOrderEmail(type, baseData());
      const combined = (rendered.subject + rendered.text + rendered.html).toLowerCase();
      expect(combined).not.toContain("token");
      expect(combined).not.toContain("fingerprint");
      expect(combined).not.toContain("idempotencykey");
    }
  });
});

describe("renderOrderEmail — HTML injection koruması (kullanıcı girdisi customerName/ürün adı)", () => {
  it("customerName içindeki HTML etiketleri html gövdesinde KAÇIRILIR (ham <script>/<img> olarak geçmez)", () => {
    const rendered = renderOrderEmail(
      "ORDER_RECEIVED",
      baseData({ customerName: '<img src=x onerror="alert(1)">Kötü Ad' }),
    );
    expect(rendered.html).not.toContain("<img src=x onerror=");
    expect(rendered.html).toContain("&lt;img src=x onerror=");
    // Düz metin gövdesi (e-posta istemcisinde markup olarak yorumlanmaz) kaçırma GEREKMEZ.
    expect(rendered.text).toContain('<img src=x onerror="alert(1)">Kötü Ad');
  });

  it("ürün adındaki HTML özel karakterleri html gövdesinde kaçırılır", () => {
    const rendered = renderOrderEmail(
      "ORDER_RECEIVED",
      baseData({ items: [{ productName: "<b>Sahte</b> & Ürün", quantity: 1 }] }),
    );
    expect(rendered.html).not.toContain("<b>Sahte</b>");
    expect(rendered.html).toContain("&lt;b&gt;Sahte&lt;/b&gt; &amp; Ürün");
  });

  it("normal (özel karakter içermeyen) bir ad/ürün adı görünürde DEĞİŞMEDEN kalır", () => {
    const rendered = renderOrderEmail("ORDER_RECEIVED", baseData({ customerName: "Ayşe Yılmaz" }));
    expect(rendered.html).toContain("Ayşe Yılmaz");
  });
});
