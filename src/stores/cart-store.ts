import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  image: string | null;
  variantName: string;
  /** Decimal-güvenli birim fiyat string'i (bkz. `src/lib/format-money.ts`) — bağımsız (bundle'sız) fiyat, yalnızca gösterim/ara toplam içindir. */
  unitPrice: string;
  quantity: number;
  /**
   * "Birlikte Daha Güzel" — yalnızca GÖSTERİM ipucu, otorite DEĞİLDİR. Sipariş
   * oluşturma sunucuya yalnızca `variantId`+`quantity` gönderir (bkz.
   * `delivery-form.tsx`), bu alanlar asla sunucuya taşınmaz/güvenilmez;
   * gerçek bundle uygunluğu/fiyatı `createDraftOrder()` içinde DB'den
   * bağımsız olarak yeniden hesaplanır.
   */
  bundleOfferId?: string;
  /** Bu satırın bundle fiyatından yararlanması için sepette AYNI ZAMANDA bulunması gereken ana varyant. */
  bundlePrimaryVariantId?: string;
  /** Ekleme anında hesaplanmış bundle fiyatı — yalnızca gösterim. */
  bundlePrice?: string;
}

/**
 * Bir kalemin bundle'a uygun olup olmadığını ve GÖSTERİM için kullanılacak
 * birim fiyatı belirler — TEK merkezi yer, component'lerde ayrı hesap YOK.
 * Yalnızca DISPLAY amaçlıdır: ana varyant sepetten çıkarılırsa (`allItems`
 * içinde artık yoksa) bu fonksiyon otomatik olarak bağımsız fiyata döner,
 * ayrı bir "temizleme" kodu gerekmez.
 */
export function resolveCartItemUnitPrice(item: CartItem, allItems: readonly CartItem[] = []): number {
  const independentPrice = Number(item.unitPrice);
  if (!Number.isFinite(independentPrice)) {
    return 0;
  }
  if (item.bundleOfferId && item.bundlePrimaryVariantId && item.bundlePrice) {
    const primaryStillInCart = allItems.some((entry) => entry.variantId === item.bundlePrimaryVariantId);
    if (primaryStillInCart) {
      const bundlePriceNumber = Number(item.bundlePrice);
      if (Number.isFinite(bundlePriceNumber) && bundlePriceNumber > 0 && bundlePriceNumber < independentPrice) {
        return bundlePriceNumber;
      }
    }
  }
  return independentPrice;
}

/**
 * Bir sepet satırının TEK güvenli toplam hesaplama noktası — checkout özeti,
 * sepet sayfası ve mini sepet üçü de bunu kullanır (ayrı ayrı `Number(...)
 * * quantity` YAZMAZLAR). `unitPrice`/`quantity` geçersizse (ör. şema
 * değişiklikleri sonrası `localStorage`'da kalmış eski bir sepet kaydı)
 * `NaN` sızdırmak yerine güvenli şekilde `0` döner — uydurma bir fiyat asla
 * üretilmez. `allItems` verilmezse (varsayılan `[]`) bundle hiç devreye
 * girmez — mevcut tek-parametreli çağrılar davranış değiştirmeden çalışır.
 */
export function getCartItemLineTotal(item: CartItem, allItems: readonly CartItem[] = []): number {
  const quantity = Number(item.quantity);
  if (!Number.isFinite(quantity)) {
    return 0;
  }
  return resolveCartItemUnitPrice(item, allItems) * quantity;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  increaseQuantity: (variantId: string) => void;
  decreaseQuantity: (variantId: string) => void;
  clearCart: () => void;
  /** Yalnızca ürün fiyatları toplamı — kargo/vergi/indirim içermez, sipariş toplamı DEĞİLDİR. */
  getSubtotal: () => number;
  getItemCount: () => number;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      addItem: (item) => {
        const quantityToAdd = item.quantity ?? 1;
        set((state) => {
          const existing = state.items.find((entry) => entry.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((entry) =>
                entry.variantId === item.variantId
                  ? { ...entry, quantity: entry.quantity + quantityToAdd }
                  : entry,
              ),
              isDrawerOpen: true,
            };
          }
          return {
            items: [...state.items, { ...item, quantity: quantityToAdd }],
            isDrawerOpen: true,
          };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((entry) => entry.variantId !== variantId),
        }));
      },

      increaseQuantity: (variantId) => {
        set((state) => ({
          items: state.items.map((entry) =>
            entry.variantId === variantId ? { ...entry, quantity: entry.quantity + 1 } : entry,
          ),
        }));
      },

      decreaseQuantity: (variantId) => {
        set((state) => ({
          items: state.items.map((entry) =>
            entry.variantId === variantId
              ? { ...entry, quantity: Math.max(1, entry.quantity - 1) }
              : entry,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        const items = get().items;
        return items.reduce((sum, entry) => sum + getCartItemLineTotal(entry, items), 0);
      },

      getItemCount: () => get().items.reduce((sum, entry) => sum + entry.quantity, 0),

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: "ossa-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

function subscribeNoop(): () => void {
  return () => {};
}

/**
 * `persist` middleware, tarayıcıda `localStorage`'ı store OLUŞTURULUR
 * OLUŞTURULMAZ senkron olarak okur — yani istemcinin İLK render'ı bile
 * zaten "rehydrate" olmuş sepetle başlar. Sunucu her zaman boş sepetle
 * render ettiğinden (`localStorage` yok), gerçek (dolu) bir sepeti olan
 * geri dönen bir müşteride bu, React hydration mismatch'ine yol açar
 * (bkz. sepet ikonu rozeti / mini sepet). `useSyncExternalStore` bunun için
 * React'in KENDİ önerdiği çözümdür: `getServerSnapshot` sunucuda VE istemcinin
 * hydration render'ında kullanılır (her zaman `false` — sunucuyla eşleşir),
 * `getSnapshot` yalnızca hydration SONRASI client render'larda kullanılır
 * (`true`) — `useEffect` içinde senkron `setState` çağıran eski "mounted"
 * deseninin (cascading render'a yol açtığı için `react-hooks/set-state-in-effect`
 * tarafından reddedilir) lint-temiz, React'in önerdiği yerine geçenidir.
 */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}
