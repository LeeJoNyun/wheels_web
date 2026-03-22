import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingSearch } from "@/components/listings/ListingSearch";

interface SearchParams {
  brand?: string;
  engine_cc?: string;
  price_min?: string;
  price_max?: string;
  year_min?: string;
  year_max?: string;
  mileage_max?: string;
  accident?: string;
  tuning?: string;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const pBrand = params.brand || null;
  const pEngineCc = params.engine_cc ? parseInt(params.engine_cc, 10) : null;
  const pPriceMin = params.price_min ? parseInt(params.price_min, 10) * 10000 : null;
  const pPriceMax = params.price_max ? parseInt(params.price_max, 10) * 10000 : null;
  const pYearMin = params.year_min ? parseInt(params.year_min, 10) : null;
  const pYearMax = params.year_max ? parseInt(params.year_max, 10) : null;
  const pMileageMax = params.mileage_max ? parseInt(params.mileage_max, 10) : null;
  const pAccident = params.accident === "no" ? false : null;
  const pTuning = params.tuning === "yes" ? true : params.tuning === "no" ? false : null;

  const { data: filteredListings } = await supabase.rpc("search_listings", {
    p_brand: pBrand,
    p_engine_cc: pEngineCc,
    p_price_min: pPriceMin,
    p_price_max: pPriceMax,
    p_year_min: pYearMin,
    p_year_max: pYearMax,
    p_mileage_max: pMileageMax,
    p_accident: pAccident,
    p_tuning: pTuning,
  });

  const ids = (filteredListings || []).map((l: { id: string }) => l.id);
  const { data: listings } =
    ids.length > 0
      ? await supabase
          .from("listings")
          .select(
            `
            id, price, mileage, status, created_at,
            bike:bikes(brand, model, year, engine_cc),
            listing_images(url, sort_order)
          `
          )
          .in("id", ids)
          .order("created_at", { ascending: false })
      : { data: [] };

  if (ids.length > 0 && listings) {
    listings.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-secondary-dark mb-4">매물 검색</h1>
        <ListingSearch />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {listings?.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        {(!listings || listings.length === 0) && (
          <p className="text-gray-500 py-8 text-center">조건에 맞는 매물이 없습니다.</p>
        )}
      </main>
    </div>
  );
}
