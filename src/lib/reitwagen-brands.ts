import dataset from "../../reitwagen_brands_models.json";

type RawBrand = {
  brandName?: string;
  logoImageUrl?: string;
  models?: string[];
};

type RawDataset = {
  brands?: RawBrand[];
};

const raw = dataset as RawDataset;

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
}

const normalizedBrands = (raw.brands ?? [])
  .map((b) => ({
    brandName: (b.brandName ?? "").trim(),
    logoImageUrl: (b.logoImageUrl ?? "").trim(),
    models: uniqueSorted(b.models ?? []),
  }))
  .filter((b) => b.brandName.length > 0);

export const REITWAGEN_BRANDS = uniqueSorted(normalizedBrands.map((b) => b.brandName));
export const REITWAGEN_BRAND_OPTIONS = normalizedBrands.sort((a, b) =>
  a.brandName.localeCompare(b.brandName, "ko")
);

const modelMap = new Map(normalizedBrands.map((b) => [b.brandName, b.models]));
const logoMap = new Map(normalizedBrands.map((b) => [b.brandName, b.logoImageUrl]));

export function getReitwagenModelsByBrand(brandName: string): string[] {
  return modelMap.get(brandName) ?? [];
}

export function getReitwagenBrandLogo(brandName: string): string | null {
  const url = logoMap.get(brandName);
  return url && url.length > 0 ? url : null;
}

