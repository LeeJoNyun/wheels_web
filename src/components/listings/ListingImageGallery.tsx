"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type Img = { url: string; sort_order: number };

export function ListingImageGallery({ images }: { images: Img[] }) {
  const ordered = useMemo(
    () => (images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
    [images]
  );
  const [selected, setSelected] = useState(0);
  const current = ordered[selected];

  if (!ordered.length) {
    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="h-[420px] flex items-center justify-center text-gray-400">이미지 없음</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="relative h-[420px] bg-gray-100">
        <Image src={current.url} alt="매물 이미지" fill className="object-contain" sizes="(max-width: 1024px) 100vw, 55vw" />
      </div>
      {ordered.length > 1 && (
        <div className="grid grid-cols-5 gap-2 p-2 bg-white border-t">
          {ordered.slice(0, 10).map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => setSelected(idx)}
              className={`relative aspect-video overflow-hidden rounded-md border ${
                idx === selected ? "ring-2 ring-orange-500 border-orange-500" : "border-gray-200"
              }`}
            >
              <Image src={img.url} alt={`썸네일 ${idx + 1}`} fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

