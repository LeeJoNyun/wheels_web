import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ListingSearch } from "@/components/listings/ListingSearch";
import { ListingListRow } from "@/components/listings/ListingListRow";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  countFilteredListings,
  fetchFilteredListings,
  parseListingFilters,
  type FilteredListingRow,
  type ListingFilterParams,
} from "@/lib/listing-filters";

export const dynamic = "force-dynamic";

function toURLSearchParams(searchParams: Record<string, string | string[] | undefined>): URLSearchParams {
  const sp = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (typeof v === "string") sp.set(k, v);
    else if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
  });
  return sp;
}

function hasMeaningfulListingFilter(p: ListingFilterParams): boolean {
  for (const [k, v] of Object.entries(p)) {
    if (v == null || String(v).trim() === "") continue;
    if (k === "segment" && String(v).trim() === "all") continue;
    return true;
  }
  return false;
}

function shouldShowListingResults(sp: URLSearchParams): boolean {
  if (sp.get("run") === "1") return true;
  return hasMeaningfulListingFilter(parseListingFilters(sp));
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const sp = toURLSearchParams(searchParams);
  const showResults = shouldShowListingResults(sp);
  const filters = parseListingFilters(sp);
  const supabase = createServiceRoleClient();

  const [{ data: listings }, { count }] = showResults
    ? await Promise.all([
        fetchFilteredListings(supabase, filters, { limit: 120 }),
        countFilteredListings(supabase, filters),
      ])
    : [{ data: [] as FilteredListingRow[] }, { count: 0 }];

  const initialCount = count ?? 0;
  const listReturnPath = sp.toString() ? `/listings?${sp.toString()}` : "/listings";

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-500 bg-white border-b">검색창 로딩…</div>
        }
      >
        <ListingSearch initialCount={initialCount} resultsVisible={showResults} />
      </Suspense>
      <section className="max-w-7xl mx-auto px-4 py-6 pb-36 w-full">
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h1 className="text-xl font-bold text-ink">중고 바이크 매물</h1>
          <p className="mt-1 text-sm text-gray-600">조건을 조합해 원하는 매물을 빠르게 찾아보세요.</p>
        </div>
        {!showResults ? (
          <p className="text-center text-gray-600 py-14 px-4 bg-white rounded-xl border text-[15px] leading-relaxed">
            조건을 설정한 뒤 하단 <strong className="text-ink">검색</strong>을 누르면 결과 목록이 표시됩니다.
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-ink sm:text-lg">
                검색 결과 <span className="text-brand">{listings.length}</span>건
                {count != null && count > listings.length && (
                  <span className="text-sm font-normal text-gray-500"> (표시 최대 120건)</span>
                )}
              </h2>
              <Link
                href="/listings/new"
                className="inline-flex items-center rounded-lg bg-brand-button px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-button-hover"
              >
                매물 등록
              </Link>
            </div>
            <ul className="flex flex-col gap-2 sm:gap-3">
              {listings.map((l) => (
                <li key={l.id}>
                  <ListingListRow listing={l} returnPath={listReturnPath} />
                </li>
              ))}
            </ul>
            {listings.length === 0 && (
              <p className="text-center text-gray-500 py-16 bg-white rounded-xl border">조건에 맞는 매물이 없습니다.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
