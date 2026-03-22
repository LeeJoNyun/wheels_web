import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { ChatButton } from "@/components/listings/ChatButton";
import { ReportButton } from "@/components/report/ReportButton";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      `
      id, user_id, price, mileage, accident, slip, tuning, original_parts,
      maintenance_history, document_status, description, sell_reason, status, created_at,
      bike:bikes(brand, model, year, engine_cc),
      listing_consumables(tire, brake_pad, chain),
      listing_images(url, sort_order)
    `
    )
    .eq("id", id)
    .single();

  if (error || !listing) notFound();
  if (listing.status !== "active") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== listing.user_id) notFound();
  }

  const { data: seller } = listing.user_id
    ? await supabase.from("profiles").select("nickname, rating, trade_count").eq("id", listing.user_id).single()
    : { data: null };

  const bike = listing.bike as any;
  const consumables = listing.listing_consumables as any;
  const images = (listing.listing_images as any[])?.sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  ) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* 갤러리 */}
          <div className="aspect-video bg-gray-200 relative">
            {images[0]?.url ? (
              <Image
                src={images[0].url}
                alt={bike ? `${bike.brand} ${bike.model}` : "매물"}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                이미지 없음
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {bike?.brand} {bike?.model} ({bike?.year}년)
                </h1>
                <p className="text-gray-500 mt-1">
                  {bike?.engine_cc}cc · 주행 {listing.mileage?.toLocaleString()}km
                </p>
              </div>
              <p className="text-2xl font-bold text-primary">
                {listing.price?.toLocaleString()}원
              </p>
            </div>

            {/* 기본 정보 */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">기본 정보</h2>
              <ul className="space-y-1 text-gray-700">
                <li>서류 상태: {listing.document_status}</li>
                <li>사고 이력: {listing.accident ? "있음" : "없음"}</li>
                <li>슬립 이력: {listing.slip ? "있음" : "없음"}</li>
                <li>튜닝: {listing.tuning ? "있음" : "없음"}</li>
                {listing.original_parts != null && (
                  <li>순정 부품 보유: {listing.original_parts ? "예" : "아니오"}</li>
                )}
                {listing.maintenance_history && (
                  <li>정비 이력: {listing.maintenance_history}</li>
                )}
              </ul>
            </section>

            {/* 소모품 상태 */}
            {(consumables?.tire || consumables?.brake_pad || consumables?.chain) && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">소모품 상태</h2>
                <ul className="space-y-1 text-gray-700">
                  {consumables.tire && <li>타이어: {consumables.tire}</li>}
                  {consumables.brake_pad && <li>브레이크 패드: {consumables.brake_pad}</li>}
                  {consumables.chain && <li>체인: {consumables.chain}</li>}
                </ul>
              </section>
            )}

            {listing.description && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">설명</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
              </section>
            )}
            {listing.sell_reason && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">판매 이유</h2>
                <p className="text-gray-700">{listing.sell_reason}</p>
              </section>
            )}

            {/* 판매자 */}
            <section className="border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">판매자</h2>
              <p className="text-gray-700">
                {seller?.nickname || "판매자"} · 거래 {seller?.trade_count ?? 0}회
                {seller?.rating != null && ` · 평점 ${seller.rating}`}
              </p>
            </section>

            <div className="flex gap-3 pt-4">
              <ChatButton listingId={listing.id} sellerId={listing.user_id} />
              <ReportButton targetType="listing" targetId={listing.id} />
              <Link
                href="/listings"
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                목록으로
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
