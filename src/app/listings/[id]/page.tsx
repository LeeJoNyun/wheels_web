import { notFound } from "next/navigation";
import Image from "next/image";
import { User } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ChatButton } from "@/components/listings/ChatButton";
import { ListingImageGallery } from "@/components/listings/ListingImageGallery";
import { BackToPreviousNav } from "@/components/listings/BackToPreviousNav";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { safeReturnPath } from "@/lib/internal-path";

export const dynamic = "force-dynamic";

type ListingRow = {
  id: string;
  user_id: string;
  status: string;
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

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabaseUser = await createClient();
  const {
    data: { user: sessionUser },
  } = await supabaseUser.auth.getUser();

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
    .maybeSingle();

  if (error || !data) notFound();

  const listing = data as unknown as ListingRow;
  const isOwner = sessionUser?.id === listing.user_id;
  if (listing.status !== "active" && !isOwner) {
    notFound();
  }
  const bike = firstOf(listing.bike);
  const images = (listing.listing_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const consumables = firstOf(listing.listing_consumables);
  let seller: { nickname: string | null; rating: number; trade_count: number } | null = null;
  let sellerAvatarUrl: string | null = null;
  const { data: sellerRow } = await supabase
    .from("profiles")
    .select("nickname,rating,trade_count")
    .eq("id", listing.user_id)
    .maybeSingle();
  if (sellerRow) {
    seller = sellerRow as { nickname: string | null; rating: number; trade_count: number };
  }
  const { data: sellerAuthData } = await supabase.auth.admin.getUserById(listing.user_id);
  sellerAvatarUrl =
    (sellerAuthData.user?.user_metadata?.avatar_url as string | undefined) ??
    (sellerAuthData.user?.user_metadata?.picture as string | undefined) ??
    null;

  const rawReturn = searchParams.returnTo;
  const returnToRaw = Array.isArray(rawReturn) ? rawReturn[0] : rawReturn;
  const backHref = safeReturnPath(returnToRaw, "/listings");
  const backVariant =
    backHref === "/"
      ? ("home" as const)
      : backHref.startsWith("/listings")
        ? ("search" as const)
        : ("default" as const);

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <BackToPreviousNav href={backHref} variant={backVariant} />

        {listing.status !== "active" && isOwner ? (
          <div
            className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p className="font-semibold">판매자 전용 보기</p>
            <p className="mt-1 text-amber-900/90">
              이 매물은 일반 검색에 노출되지 않습니다. (상태:{" "}
              {listing.status === "sold"
                ? "거래완료"
                : listing.status === "reserved"
                  ? "예약중"
                  : listing.status === "hidden"
                    ? "숨김"
                    : listing.status}
              )
            </p>
          </div>
        ) : null}

        <section className="mt-3 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-3">
            <ListingImageGallery images={images} />
            <div className="rounded-xl border bg-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full bg-gray-200">
                  {sellerAvatarUrl ? (
                    <Image src={sellerAvatarUrl} alt="판매자 프로필 이미지" fill sizes="44px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-500">
                      <User className="h-5 w-5" aria-hidden />
                    </div>
                  )}
                </div>
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

