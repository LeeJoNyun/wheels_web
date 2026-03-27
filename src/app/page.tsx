import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
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
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">BikeMarket</h1>
        <p className="mt-2 text-gray-600 max-w-md">오토바이 중고거래 — 조건에 맞는 매물을 찾아보세요.</p>
      </div>
    </div>
  );

  const showDeployHint = Boolean(configError || listingsQueryError);
  if (listingsQueryError) {
    console.error("[home] listings query:", listingsQueryError.message, listingsQueryError.code);
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
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

        <section className="max-w-7xl mx-auto px-4 pt-7 pb-16">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand-charcoal">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                검증 매물 중심
              </span>
              <Link href="/listings?segment=mid&run=1" className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 hover:bg-gray-200">
                입문형
              </Link>
              <Link href="/listings?segment=sport&run=1" className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 hover:bg-gray-200">
                스포츠
              </Link>
              <Link href="/listings?segment=liter&run=1" className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 hover:bg-gray-200">
                리터급
              </Link>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink sm:text-2xl">실매물 기반 중고 바이크</h2>
                <p className="mt-1 text-sm text-gray-600">가격·주행거리·배기량을 바로 비교해 보고 문의까지 이어가세요.</p>
              </div>
              <Link href="/listings" className="hidden items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark sm:inline-flex">
                전체 보기
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink">최신 등록 매물</h3>
            <Link href="/listings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark sm:hidden">
              더보기
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          {latestListings.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {latestListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} returnPath="/" />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border bg-white py-16 text-center text-gray-500">
              아직 등록된 매물이 없습니다.
            </div>
          )}
          <div className="mt-8 flex justify-center">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center rounded-lg bg-brand-button px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-brand-button-hover transition"
            >
              매물 검색하기
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
