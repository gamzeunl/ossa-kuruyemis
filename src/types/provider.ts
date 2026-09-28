export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface AuthSession {
  user: AuthUser;
  expiresAt: Date;
}

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  redirectTo?: string;
}

export interface SignInInput {
  email: string;
  password: string;
  redirectTo?: string;
}

export interface UploadInput {
  fileName: string;
  contentType: string;
  data: Uint8Array;
}

export interface UploadResult {
  key: string;
  url: string;
}

export interface ShippingAddress {
  city: string;
  district: string;
  postalCode?: string;
}

export interface ShippingRateInput {
  address: ShippingAddress;
  weightGram: number;
  subtotal: number;
}

export interface ShippingRate {
  amount: number;
  currency: string;
  estimatedDays?: number;
}

export interface ShipmentItem {
  sku: string;
  quantity: number;
}

export interface ShipmentInput {
  orderNumber: string;
  address: ShippingAddress;
  items: ShipmentItem[];
}

export interface ShipmentResult {
  trackingNumber: string;
  carrier: string;
}

export type ShipmentStatus = "PREPARING" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "RETURNED";

export interface TrackingStatus {
  status: ShipmentStatus;
  updatedAt: string;
}

export interface ProductSearchDocument {
  id: string;
  name: string;
  slug: string;
  categorySlugs: string[];
}

export interface SearchQuery {
  query: string;
  categorySlug?: string;
  limit?: number;
}

export interface SearchResult {
  items: ProductSearchDocument[];
  total: number;
}
