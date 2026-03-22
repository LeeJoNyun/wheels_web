import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { ListingCard } from "@/components/listings/ListingCard";
import { Banner } from "@/components/home/Banner";

const MOCK_LISTINGS = [
// ... (rest of mock listings)
  {
    id: "mock-1",
    price: 9500000,
    mileage: 5200,
    bike: { brand: "Honda", model: "CB650R", year: 2023, engine_cc: 650 },
    listing_images: [{ url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800", sort_order: 1 }]
  },
  {
    id: "mock-2",
    price: 11200000,
    mileage: 2100,
    bike: { brand: "Yamaha", model: "YZF-R7", year: 2022, engine_cc: 689 },
    listing_images: [{ url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800", sort_order: 1 }]
  },
  {
    id: "mock-3",
    price: 24500000,
    mileage: 1500,
    bike: { brand: "BMW", model: "S1000RR", year: 2024, engine_cc: 999 },
    listing_images: [{ url: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&q=80&w=800", sort_order: 1 }]
  }
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: dbListings } = await supabase
    .from("listings")
    .select(`
      id, price, mileage, status, created_at,
      bike:bikes(brand, model, year, engine_cc),
      listing_images(url, sort_order)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12);

  const listings = (dbListings && dbListings.length > 0) ? dbListings : MOCK_LISTINGS;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <Banner />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-secondary-dark">최신 매물</h2>
            <p className="text-gray-500 mt-1">방금 등록된 따끈따끈한 매물을 확인하세요.</p>
          </div>
          <Link href="/listings" className="text-primary font-semibold hover:underline">
            전체 보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </main>

      <footer className="bg-gray-50 border-t py-12 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© 2026 wheels. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

