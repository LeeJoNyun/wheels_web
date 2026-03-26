import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ChatButton } from "@/components/listings/ChatButton";
import { ListingImageGallery } from "@/components/listings/ListingImageGallery";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type ListingRow = {
  id: string;
  user_id: string;
  price: number;
  mileage: number;
  accident: boolean;
  slip: boolean;
  tuning: boolean;
  document_status: string;
  description: string | null;
  maintenance_history: string | null;
  sell_reason: string | null;
  bike: { brand: string; model: string; year: number; engine_cc: number }[] | { brand: string; model: string; year: number; engine_cc: number } | null;
  listing_images: { url: string; sort_order: number }[] | null;
  listing_consumables: { tire: string | null; brake_pad: string | null; chain: string | null }[] | { tire: string | null; brake_pad: string | null; chain: string | null } | null;
};

function firstOf<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function boolText(v: boolean) {
  return v ? "있음" : "없음";
}

function timeAgo(iso: string | undefined) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      user_id,
      bike_id,
      price,
      mileage,
      accident,
      slip,
      tuning,
      original_parts,
      maintenance_history,
      document_status,
      description,
      sell_reason,
      status,
      created_at,
      updated_at,
      bike:bikes ( brand, model, year, engine_cc ),
      listing_images ( url, sort_order ),
      listing_consumables ( tire, brake_pad, chain )
    `
    )
    .eq("id", params.id)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) notFound();

  const listing = data as unknown as ListingRow;
  const bike = firstOf(listing.bike);
  const images = (listing.listing_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const consumables = firstOf(listing.listing_consumables);
  let seller: { nickname: string | null; rating: number; trade_count: number } | null = null;
  const { data: sellerRow } = await supabase
    .from("profiles")
    .select("nickname,rating,trade_count")
    .eq("id", listing.user_id)
    .maybeSingle();
  if (sellerRow) {
    seller = sellerRow as { nickname: string | null; rating: number; trade_count: number };
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Link href="/listings" className="text-sm text-gray-500 hover:text-gray-700">
          ← 목록으로
        </Link>

        <section className="mt-3 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-3">
            <ListingImageGallery images={images} />
            <div className="rounded-xl border bg-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gray-200" />
                <div>
                  <p className="font-semibold text-gray-900">{seller?.nickname ?? "판매자"}</p>
                  <p className="text-sm text-gray-500">평점 {seller?.rating ?? 0} · 거래 {seller?.trade_count ?? 0}회</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{timeAgo((listing as any).created_at)}</span>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
              {bike ? `${bike.brand} ${bike.model}` : "매물"} {bike ? `(${bike.year})` : ""}
            </h1>
            <p className="mt-1 text-gray-500">스포츠/레저 · {timeAgo((listing as any).created_at)}</p>
            <p className="mt-4 text-4xl font-extrabold text-gray-900">{listing.price.toLocaleString()}원</p>
            <p className="mt-2 text-gray-700">{bike?.engine_cc?.toLocaleString()}cc · {listing.mileage.toLocaleString()}km</p>

            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-gray-50 p-3">사고 여부: <b>{boolText(listing.accident)}</b></div>
              <div className="rounded-lg bg-gray-50 p-3">슬립 여부: <b>{boolText(listing.slip)}</b></div>
              <div className="rounded-lg bg-gray-50 p-3">튜닝 여부: <b>{boolText(listing.tuning)}</b></div>
              <div className="rounded-lg bg-gray-50 p-3">서류 상태: <b>{listing.document_status}</b></div>
            </div>

            <div className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-2">소모품 상태</h2>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>타이어: {consumables?.tire ?? "-"}</li>
                <li>브레이크 패드: {consumables?.brake_pad ?? "-"}</li>
                <li>체인: {consumables?.chain ?? "-"}</li>
              </ul>
            </div>

            <div className="mt-6">
              <ChatButton listingId={listing.id} sellerId={listing.user_id} />
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-xl border bg-white p-5">
          <h2 className="font-semibold text-gray-900 mb-2">상세 설명</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{listing.description || "등록된 설명이 없습니다."}</p>
          {listing.maintenance_history && (
            <>
              <h3 className="font-semibold text-gray-900 mt-5 mb-2">정비 이력</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{listing.maintenance_history}</p>
            </>
          )}
          {listing.sell_reason && (
            <>
              <h3 className="font-semibold text-gray-900 mt-5 mb-2">판매 이유</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{listing.sell_reason}</p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

