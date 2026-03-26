import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ListingCard } from "@/components/listings/ListingCard";
import { BannerCarousel, type BannerSlide } from "@/components/home/BannerCarousel";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { fetchFilteredListings } from "@/lib/listing-filters";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let supabase: SupabaseClient | null = null;
  let configError: string | null = null;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    configError = e instanceof Error ? e.message : "Supabase 서버 설정 오류";
  }

  const listingsResult = supabase
    ? await fetchFilteredListings(supabase, {}, { limit: 6 })
    : { data: [], error: null };
  const latestListings = listingsResult.data;
  const listingsQueryError = listingsResult.error;

  let bannerSlides: BannerSlide[] = [];
  if (supabase) {
    try {
      const { data: banners } = await supabase
        .from("banners")
        .select("id, image_url, link, link_text, title, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(12);

      const rows = (banners ?? []) as Array<{
        id: string;
        image_url?: string | null;
        link?: string | null;
        link_text?: string | null;
        title?: string | null;
        description?: string | null;
      }>;
      bannerSlides = rows.flatMap((b) => {
        const url = b.image_url;
        if (typeof url !== "string" || !url) return [];
        return [
          {
            id: String(b.id),
            imageUrl: url,
            link: b.link ?? null,
            linkText: b.link_text ?? null,
            title: b.title ?? null,
            description: b.description ?? null,
          },
        ];
      });
    } catch {
      // RLS/테이블 없음 → 아래 fallback
    }
  }

  if (bannerSlides.length === 0) {
    const fromListings: BannerSlide[] = [];
    for (const listing of latestListings) {
      const url = listing.listing_images
        ?.sort((a, b) => a.sort_order - b.sort_order)[0]
        ?.url;
      if (!url) continue;
      fromListings.push({
        id: `listing-${listing.id}`,
        imageUrl: url,
        link: `/listings/${listing.id}?${new URLSearchParams({ returnTo: "/" }).toString()}`,
        linkText: "매물 보기",
        title: listing.bike ? `${listing.bike.brand} ${listing.bike.model}` : null,
        description: `${listing.price.toLocaleString()}원 · ${listing.mileage.toLocaleString()}km`,
      });
    }
    bannerSlides = fromListings.slice(0, 8);
  }

  const emptyBanner = (
    <div className="rounded-2xl overflow-hidden border bg-white max-w-6xl mx-auto">
      <div className="flex flex-col items-center justify-center min-h-[280px] sm:min-h-[360px] px-4 py-16 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">BikeMarket</h1>
        <p className="mt-2 text-gray-600 max-w-md">오토바이 중고거래 — 조건에 맞는 매물을 찾아보세요.</p>
      </div>
    </div>
  );

  const showDeployHint = Boolean(configError || listingsQueryError);
  if (listingsQueryError) {
    console.error("[home] listings query:", listingsQueryError.message, listingsQueryError.code);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {showDeployHint ? (
          <div className="max-w-6xl mx-auto px-4 pt-4">
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="status"
            >
              <p className="font-semibold">배포 환경에서 매물·배너 데이터를 불러오지 못했습니다.</p>
              <p className="mt-1 text-amber-900/90">
                Vercel → Project Settings → Environment Variables 에{" "}
                <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
                <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code>,{" "}
                <code className="rounded bg-amber-100/80 px-1">SUPABASE_SERVICE_ROLE_KEY</code> 를 Production(및
                Preview)에 로컬과 동일하게 넣은 뒤 재배포해 주세요.
              </p>
              {process.env.NODE_ENV === "development" && (configError || listingsQueryError?.message) ? (
                <p className="mt-2 font-mono text-xs text-amber-800/80">
                  {configError ?? listingsQueryError?.message}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <section className="w-full px-0 sm:px-4 pt-4 sm:pt-6 pb-2">
          <BannerCarousel slides={bannerSlides} emptyFallback={emptyBanner} />
        </section>

        <section className="max-w-6xl mx-auto px-4 pt-8 pb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">최신 등록 매물</h2>
            <Link href="/listings" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
              전체 보기
            </Link>
          </div>
          {latestListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} returnPath="/" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-white py-16 text-center text-gray-500">
              아직 등록된 매물이 없습니다.
            </div>
          )}
          <div className="mt-8 flex justify-center">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-orange-600 transition"
            >
              매물 검색하기
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
