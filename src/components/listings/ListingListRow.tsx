"use client";

import Link from "next/link";
import Image from "next/image";

import type { FilteredListingRow } from "@/lib/listing-filters";

interface ListingListRowProps {
  listing: FilteredListingRow;
  returnPath?: string;
}

export function ListingListRow({ listing, returnPath }: ListingListRowProps) {
  const imageUrl = listing.listing_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const bike = listing.bike;

  const href =
    returnPath != null && returnPath !== ""
      ? `/listings/${listing.id}?${new URLSearchParams({ returnTo: returnPath }).toString()}`
      : `/listings/${listing.id}`;

  return (
    <Link href={href} className="block">
      <article className="flex gap-3 sm:gap-4 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 transition-shadow hover:border-orange-200 hover:shadow-md">
        <div className="relative h-[4.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-[5.5rem] sm:w-[7.75rem]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={bike ? `${bike.brand} ${bike.model}` : "매물"}
              fill
              className="object-cover"
              sizes="124px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-400">이미지 없음</div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900 sm:text-base">
            {bike ? `${bike.brand} ${bike.model}` : "-"} {bike ? `(${bike.year}년)` : ""}
          </h3>
          <p className="text-sm text-gray-500">
            {bike?.engine_cc != null ? `${bike.engine_cc.toLocaleString()}cc` : "-"} ·{" "}
            {listing.mileage.toLocaleString()}km
          </p>
          <p className="text-base font-bold text-primary sm:text-lg">{listing.price.toLocaleString()}원</p>
        </div>
      </article>
    </Link>
  );
}
