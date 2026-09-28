/** Varyant gramajı için TEK gösterim kaynağı — ürün kartı ve satın alma paneli aynı fonksiyonu kullanır. */
export function formatVariantWeight(weightGram: number | null): string | null {
  if (weightGram === null) {
    return null;
  }
  return weightGram >= 1000 ? `${weightGram / 1000} kg` : `${weightGram} g`;
}
