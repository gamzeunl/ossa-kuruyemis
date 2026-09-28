import type { ProductSearchDocument, SearchQuery, SearchResult } from "@/types/provider";

export interface SearchProvider {
  searchProducts(query: SearchQuery): Promise<SearchResult>;
  indexProduct(document: ProductSearchDocument): Promise<void>;
  removeProduct(productId: string): Promise<void>;
}
