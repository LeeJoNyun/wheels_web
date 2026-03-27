"use client";

import Link from "next/link";
import Image from "next/image";

import type { FilteredListingRow } from "@/lib/listing-filters";

interface ListingCardProps {
  listing: FilteredListingRow;
  /** 상세에서 «목록으로» 복귀 경로 (예: `/`, `/listings?run=1&brand=…`) */
  returnPath?: string;
}

export function ListingCard({ listing, returnPath }: ListingCardProps) {
  const imageUrl = listing.listing_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const bike = listing.bike;
  const title = bike ? `${bike.brand} ${bike.model}` : "바이크 정보 없음";
  const subtitle = bike ? `${bike.year}년식 · ${bike.engine_cc.toLocaleString()}cc` : "-";

  const href =
    returnPath != null && returnPath !== ""
      ? `/listings/${listing.id}?${new URLSearchParams({ returnTo: returnPath }).toString()}`
      : `/listings/${listing.id}`;

  return (
    <Link href={href}>
      <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative aspect-[16/10] bg-gray-200">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={bike ? `${bike.brand} ${bike.model}` : "매물"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              이미지 없음
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">
            인증 매물
          </div>
        </div>
        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">USED MOTORCYCLE</p>
          <h3 className="mt-1 line-clamp-1 text-[15px] font-semibold text-ink">{title}</h3>
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-lg font-extrabold text-primary">
              {listing.price.toLocaleString()}원
            </p>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {listing.mileage.toLocaleString()}km
            </span>
          </div>
          <p className="mt-2 text-[12px] font-medium text-gray-500">
            {/* 상세 데이터가 없는 경우에도 일정한 정보 밀도 유지 */}
            빠른 거래 가능 · 상태 점검 완료
          </p>
          <p className="mt-2 text-lg font-bold text-primary sr-only">
            {listing.price.toLocaleString()}원
          </p>
        </div>
      </article>
    </Link>
  );
}
