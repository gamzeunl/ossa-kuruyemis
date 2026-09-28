import { beforeEach, describe, expect, it } from "vitest";
import { getCartItemLineTotal, useCartStore, type CartItem } from "@/stores/cart-store";

function baseItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "prod-1",
    variantId: "var-1",
    slug: "test-urun",
    name: "Test Ürün",
    image: null,
    variantName: "500 g",
    unitPrice: "100.00",
    quantity: 2,
    ...overrides,
  };
}

describe("getCartItemLineTotal", () => {
  it("geçerli fiyat/adet için doğru satır toplamını döner", () => {
    expect(getCartItemLineTotal(baseItem())).toBe(200);
  });

  it("geçersiz (eksik/bozuk) unitPrice için NaN sızdırmadan 0 döner", () => {
    expect(getCartItemLineTotal(baseItem({ unitPrice: undefined as unknown as string }))).toBe(0);
    expect(getCartItemLineTotal(baseItem({ unitPrice: "" }))).toBe(0);
    expect(getCartItemLineTotal(baseItem({ unitPrice: "abc" }))).toBe(0);
  });

  it("geçersiz (bozuk) quantity için NaN sızdırmadan 0 döner", () => {
    expect(getCartItemLineTotal(baseItem({ quantity: Number.NaN }))).toBe(0);
  });
});

describe("useCartStore getSubtotal", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isDrawerOpen: false });
  });

  it("boş sepette 0 döner", () => {
    expect(useCartStore.getState().getSubtotal()).toBe(0);
  });

  it("birden çok satırın toplamını doğru hesaplar", () => {
    useCartStore.setState({
      items: [baseItem({ variantId: "var-1", unitPrice: "100.00", quantity: 2 }), baseItem({ variantId: "var-2", unitPrice: "49.90", quantity: 3 })],
    });
    expect(useCartStore.getState().getSubtotal()).toBeCloseTo(349.7, 5);
  });

  it("bozuk bir satır sızdırmadan diğer satırların toplamını etkilemez", () => {
    useCartStore.setState({
      items: [
        baseItem({ variantId: "var-1", unitPrice: "100.00", quantity: 2 }),
        baseItem({ variantId: "var-2", unitPrice: "bozuk", quantity: 5 }),
      ],
    });
    expect(useCartStore.getState().getSubtotal()).toBe(200);
  });
});
