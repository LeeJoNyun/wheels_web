"use client";

import Link from "next/link";
import Image from "next/image";

import type { FilteredListingRow } from "@/lib/listing-filters";

function listingStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "판매중";
    case "sold":
      return "거래완료";
    case "reserved":
      return "예약중";
    case "hidden":
      return "숨김";
    default:
      return status;
  }
}

interface ListingListRowProps {
  listing: FilteredListingRow;
  returnPath?: string;
  /** 판매자 화면에서 거래 상태 배지 */
  showStatus?: boolean;
}

export function ListingListRow({ listing, returnPath, showStatus }: ListingListRowProps) {
  const imageUrl = listing.listing_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const bike = listing.bike;
  const title = bike ? `${bike.brand} ${bike.model}` : "바이크 정보 없음";
  const meta = bike ? `${bike.year}년식 · ${bike.engine_cc.toLocaleString()}cc` : "-";

  const href =
    returnPath != null && returnPath !== ""
      ? `/listings/${listing.id}?${new URLSearchParams({ returnTo: returnPath }).toString()}`
      : `/listings/${listing.id}`;

  return (
    <Link href={href} className="block">
      <article className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-brand/30 hover:shadow-md sm:gap-4 sm:p-4">
        <div className="relative h-[5.2rem] w-[7.6rem] shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-[6.2rem] sm:w-[9rem]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={bike ? `${bike.brand} ${bike.model}` : "매물"}
              fill
              className="object-cover"
              sizes="144px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-400">이미지 없음</div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 min-w-0 text-[15px] font-semibold leading-snug text-ink sm:text-base">
              {title}
            </h3>
            {showStatus ? (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {listingStatusLabel(listing.status)}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-gray-500">{meta}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-0.5">{listing.mileage.toLocaleString()}km</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">진단완료</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5">당일상담</span>
          </div>
          <p className="text-base font-extrabold text-primary sm:text-lg">
            {listing.price.toLocaleString()}원
          </p>
        </div>
      </article>
    </Link>
  );
}
