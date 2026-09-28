import type {
  ShipmentInput,
  ShipmentResult,
  ShippingRate,
  ShippingRateInput,
  TrackingStatus,
} from "@/types/provider";

export interface CarrierProvider {
  calculateShipping(input: ShippingRateInput): Promise<ShippingRate>;
  createShipment(input: ShipmentInput): Promise<ShipmentResult>;
  getTrackingStatus(trackingNumber: string): Promise<TrackingStatus>;
}
