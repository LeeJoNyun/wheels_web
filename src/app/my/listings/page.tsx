import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { ListingCard } from "@/components/listings/ListingCard";

export default async function MyListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/my/listings");

  const { data: listings } = await supabase
    .from("listings")
    .select(
      `
      id, price, mileage, status, created_at,
      bike:bikes(brand, model, year, engine_cc),
      listing_images(url, sort_order)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-secondary-dark">내 매물</h1>
          <Link
            href="/listings/new"
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
          >
            매물 등록
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings?.map((listing: any) => (
            <div key={listing.id} className="relative">
              <ListingCard listing={listing} />
              <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                {listing.status === "active" ? "판매중" : listing.status}
              </span>
            </div>
          ))}
        </div>
        {(!listings || listings.length === 0) && (
          <p className="text-gray-500 py-8 text-center">등록한 매물이 없습니다.</p>
        )}
      </main>
    </div>
  );
}
