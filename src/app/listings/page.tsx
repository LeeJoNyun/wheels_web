import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ListingSearch } from "@/components/listings/ListingSearch";
import { ListingCard } from "@/components/listings/ListingCard";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { countFilteredListings, fetchFilteredListings, parseListingFilters } from "@/lib/listing-filters";

export const dynamic = "force-dynamic";

function toURLSearchParams(searchParams: Record<string, string | string[] | undefined>): URLSearchParams {
  const sp = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (typeof v === "string") sp.set(k, v);
    else if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
  });
  return sp;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const sp = toURLSearchParams(searchParams);
  const filters = parseListingFilters(sp);
  const supabase = createServiceRoleClient();
  const [{ data: listings }, { count }] = await Promise.all([
    fetchFilteredListings(supabase, filters, { limit: 120 }),
    countFilteredListings(supabase, filters),
  ]);
  const initialCount = count ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Header />
      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-500 bg-white border-b">검색창 로딩…</div>
        }
      >
        <ListingSearch initialCount={initialCount} />
      </Suspense>
      <section className="max-w-6xl mx-auto px-4 py-6 pb-36 w-full">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-900">
            검색 결과 <span className="text-orange-600">{listings.length}</span>건
            {count != null && count > listings.length && (
              <span className="text-sm font-normal text-gray-500"> (표시 최대 120건)</span>
            )}
          </h2>
          <Link
            href="/listings/new"
            className="inline-flex items-center rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            매물 등록
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
        {listings.length === 0 && (
          <p className="text-center text-gray-500 py-16 bg-white rounded-xl border">조건에 맞는 매물이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
