"use client";

import Link from "next/link";
import Image from "next/image";

interface ListingCardProps {
  listing: {
    id: string;
    price: number;
    mileage: number;
    bike: { brand: string; model: string; year: number; engine_cc: number } | null;
    listing_images?: { url: string; sort_order: number }[] | null;
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = listing.listing_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const bike = listing.bike;

  return (
    <Link href={`/listings/${listing.id}`}>
      <article className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-video bg-gray-200 relative">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={bike ? `${bike.brand} ${bike.model}` : "매물"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              이미지 없음
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900">
            {bike ? `${bike.brand} ${bike.model}` : "-"} ({bike?.year}년)
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {bike?.engine_cc}cc · {listing.mileage.toLocaleString()}km
          </p>
          <p className="text-lg font-bold text-primary mt-2">
            {listing.price.toLocaleString()}원
          </p>
        </div>
      </article>
    </Link>
  );
}
