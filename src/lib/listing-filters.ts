import type { SupabaseClient } from "@supabase/supabase-js";

/** URL 쿼리와 동일한 필터 (만원 단위 price_min/max) */
export type ListingFilterParams = {
  brand?: string;
  model?: string;
  /** 단일 배기량(구 URL 호환). engine_cc_min/max가 있으면 무시됨 */
  engine_cc?: string;
  /** cc 최소 (예: 300) */
  engine_cc_min?: string;
  /** cc 최대 (예: 400) */
  engine_cc_max?: string;
  price_min?: string;
  price_max?: string;
  year_min?: string;
  year_max?: string;
  mileage_min?: string;
  mileage_max?: string;
  accident?: string;
  tuning?: string;
  q?: string;
  /** 구 검색 탭 호환: 구간으로 매핑됨 */
  segment?: string;
};

export function parseListingFilters(sp: URLSearchParams): ListingFilterParams {
  const get = (k: keyof ListingFilterParams) => sp.get(k) || undefined;
  return {
    brand: get("brand"),
    model: get("model"),
    engine_cc: get("engine_cc"),
    engine_cc_min: get("engine_cc_min"),
    engine_cc_max: get("engine_cc_max"),
    price_min: get("price_min"),
    price_max: get("price_max"),
    year_min: get("year_min"),
    year_max: get("year_max"),
    mileage_min: get("mileage_min"),
    mileage_max: get("mileage_max"),
    accident: get("accident"),
    tuning: get("tuning"),
    q: get("q"),
    segment: get("segment"),
  };
}

/** 구 탭 → cc 구간 (배기량 자유 입력 전환 이전 URL 호환) */
function segmentToRange(segment: string | undefined): { min: number; max: number } | null {
  if (!segment || segment === "all") return null;
  const map: Record<string, { min: number; max: number }> = {
    light: { min: 0, max: 150 },
    mid: { min: 151, max: 400 },
    sport: { min: 401, max: 800 },
    liter: { min: 801, max: 10000 },
  };
  return map[segment] ?? null;
}

export type EngineCcBounds =
  | { kind: "exact"; value: number }
  | { kind: "range"; min: number | null; max: number | null };

/** URL 파라미터 → 배기량 필터 (없으면 null = 전체) */
export function parseEngineCcBounds(params: ListingFilterParams): EngineCcBounds | null {
  const minRaw = params.engine_cc_min?.trim();
  const maxRaw = params.engine_cc_max?.trim();
  if (minRaw || maxRaw) {
    const min = minRaw ? Number(minRaw) : null;
    const max = maxRaw ? Number(maxRaw) : null;
    if (min != null && Number.isNaN(min)) return null;
    if (max != null && Number.isNaN(max)) return null;
    return { kind: "range", min: min ?? null, max: max ?? null };
  }
  if (params.engine_cc?.trim()) {
    const n = Number(params.engine_cc.trim());
    if (!Number.isNaN(n)) return { kind: "exact", value: n };
  }
  const seg = segmentToRange(params.segment);
  if (seg) return { kind: "range", min: seg.min, max: seg.max };
  return null;
}

type BikeRow = { brand: string; model: string; year: number; engine_cc: number };

export type FilteredListingRow = {
  id: string;
  price: number;
  mileage: number;
  status: string;
  accident: boolean;
  tuning: boolean;
  description: string | null;
  created_at?: string;
  bike: BikeRow | null;
  listing_images?: { url: string; sort_order: number }[] | null;
};

type Row = FilteredListingRow;

/** Supabase embed가 객체 또는 단일 행 배열로 올 수 있음 */
function coerceBike(b: unknown): BikeRow | null {
  if (b == null) return null;
  if (Array.isArray(b)) {
    const x = b[0];
    return x && typeof x === "object" ? (x as BikeRow) : null;
  }
  return b as BikeRow;
}

function normalizeListingRow(raw: unknown): Row | null {
  const r = raw as Record<string, unknown>;
  const bike = coerceBike(r.bike);
  if (!bike) return null;
  return {
    id: String(r.id),
    price: Number(r.price),
    mileage: Number(r.mileage),
    status: String(r.status),
    accident: Boolean(r.accident),
    tuning: Boolean(r.tuning),
    description: (r.description as string | null) ?? null,
    created_at: r.created_at as string | undefined,
    bike,
    listing_images: (r.listing_images as FilteredListingRow["listing_images"]) ?? null,
  };
}

function matchesEngineCc(bikeCc: number, bounds: EngineCcBounds | null): boolean {
  if (!bounds) return true;
  if (bounds.kind === "exact") return bikeCc === bounds.value;
  if (bounds.min != null && bikeCc < bounds.min) return false;
  if (bounds.max != null && bikeCc > bounds.max) return false;
  return true;
}

function rowMatches(row: Row, params: ListingFilterParams, engineBounds: EngineCcBounds | null): boolean {
  const bike = row.bike;
  if (!bike) return false;
  if (params.brand && bike.brand !== params.brand) return false;
  if (params.model && !bike.model.toLowerCase().includes(params.model.trim().toLowerCase())) return false;
  if (!matchesEngineCc(bike.engine_cc, engineBounds)) return false;
  if (params.year_min && bike.year < Number(params.year_min)) return false;
  if (params.year_max && bike.year > Number(params.year_max)) return false;
  if (params.mileage_min && row.mileage < Number(params.mileage_min)) return false;
  if (params.mileage_max && row.mileage > Number(params.mileage_max)) return false;
  if (params.price_min && row.price < Number(params.price_min) * 10000) return false;
  if (params.price_max && row.price > Number(params.price_max) * 10000) return false;
  if (params.accident === "no" && row.accident) return false;
  if (params.tuning === "yes" && !row.tuning) return false;
  if (params.tuning === "no" && row.tuning) return false;
  if (params.q) {
    const qq = params.q.trim().toLowerCase();
    const desc = (row.description || "").toLowerCase();
    const hit =
      bike.brand.toLowerCase().includes(qq) ||
      bike.model.toLowerCase().includes(qq) ||
      desc.includes(qq);
    if (!hit) return false;
  }
  return true;
}

const FETCH_CAP = 4000;

/** listings + bike + 이미지 조회 (필터 적용) */
export async function fetchFilteredListings(
  supabase: SupabaseClient,
  params: ListingFilterParams,
  opts?: { limit?: number }
) {
  const limit = opts?.limit ?? 120;
  const engineBounds = parseEngineCcBounds(params);

  const { data: rows, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      price,
      mileage,
      status,
      accident,
      tuning,
      description,
      created_at,
      bike:bikes ( brand, model, year, engine_cc ),
      listing_images ( url, sort_order )
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(FETCH_CAP);

  if (error) {
    return { data: [] as Row[], error };
  }

  const normalized = (rows ?? []).map(normalizeListingRow).filter((r): r is Row => r != null);
  const filtered = normalized.filter((row) => rowMatches(row, params, engineBounds));
  return { data: filtered.slice(0, limit), error: null };
}

export async function countFilteredListings(supabase: SupabaseClient, params: ListingFilterParams) {
  const engineBounds = parseEngineCcBounds(params);
  const { data: rows, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      price,
      mileage,
      status,
      accident,
      tuning,
      description,
      bike:bikes ( brand, model, year, engine_cc )
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(FETCH_CAP);

  if (error) return { count: null as number | null, error };
  const normalized = (rows ?? []).map(normalizeListingRow).filter((r): r is Row => r != null);
  const n = normalized.filter((row) => rowMatches(row, params, engineBounds)).length;
  return { count: n, error: null };
}
