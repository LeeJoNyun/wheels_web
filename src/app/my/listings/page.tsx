import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ListingListRow } from "@/components/listings/ListingListRow";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { fetchMyListings } from "@/lib/listing-filters";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login?next=/my/listings");
  }

  const admin = createServiceRoleClient();
  const { data: listings, error } = await fetchMyListings(admin, user.id);
  const listReturnPath = "/my/listings";

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-16">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/my" className="text-sm font-medium text-brand hover:text-brand-dark">
              ← 마이페이지
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-ink">내 매물</h1>
            <p className="mt-1 text-sm text-gray-600">등록한 매물의 상태를 확인하세요.</p>
          </div>
          <Link
            href="/listings/new"
            className="inline-flex items-center justify-center rounded-2xl bg-brand-button px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-button-hover transition-colors"
          >
            매물 등록
          </Link>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            매물 목록을 불러오지 못했습니다.
          </p>
        ) : listings.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-600">
            <p>등록한 매물이 없습니다.</p>
            <Link href="/listings/new" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
              첫 매물 등록하기
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2 sm:gap-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingListRow listing={listing} returnPath={listReturnPath} showStatus />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
