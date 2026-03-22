export type DocumentStatus = "폐지 완료" | "사용중 (이전 필요)" | "서류 없음";
export type ConsumableStatus = "좋음" | "교체 필요";
export type ListingStatus = "active" | "sold" | "reserved" | "hidden";

export interface Profile {
  id: string;
  nickname: string | null;
  phone: string | null;
  rating: number;
  trade_count: number;
  created_at: string;
  updated_at: string;
}

export interface Bike {
  id: string;
  brand: string;
  model: string;
  year: number;
  engine_cc: number;
  created_at?: string;
}

export interface Listing {
  id: string;
  user_id: string;
  bike_id: string;
  price: number;
  mileage: number;
  accident: boolean;
  slip: boolean;
  tuning: boolean;
  original_parts: boolean | null;
  maintenance_history: string | null;
  document_status: DocumentStatus;
  description: string | null;
  sell_reason: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  bike?: Bike;
  listing_consumables?: ListingConsumables | null;
  listing_images?: { url: string; sort_order: number }[];
  profiles?: Profile | null;
}

export interface ListingConsumables {
  listing_id: string;
  tire: ConsumableStatus | null;
  brake_pad: ConsumableStatus | null;
  chain: ConsumableStatus | null;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
}

export interface Chat {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  listing?: Listing;
  messages?: Message[];
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: "listing" | "user" | "chat";
  target_id: string;
  reason: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  created_at: string;
}

export const DOCUMENT_STATUS_OPTIONS: DocumentStatus[] = [
  "폐지 완료",
  "사용중 (이전 필요)",
  "서류 없음",
];

export const CONSUMABLE_OPTIONS: ConsumableStatus[] = ["좋음", "교체 필요"];

export const BRANDS = ["혼다", "야마하", "BMW", "카와사키", "KTM", "두카티", "기타"] as const;
