"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export type BannerSlide = {
  id: string;
  imageUrl: string;
  link?: string | null;
  linkText?: string | null;
  title?: string | null;
  description?: string | null;
};

const AUTO_MS = 5500;

type Props = {
  slides: BannerSlide[];
  emptyFallback?: React.ReactNode;
};

export function BannerCarousel({ slides, emptyFallback }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // hover pause
  const [manualPaused, setManualPaused] = useState(false); // user pause button

  const n = slides.length;
  const go = useCallback(
    (dir: -1 | 1) => {
      if (n <= 0) return;
      setIndex((i) => (i + dir + n) % n);
    },
    [n]
  );

  useEffect(() => {
    if (n <= 1 || paused || manualPaused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), AUTO_MS);
    return () => clearInterval(t);
  }, [n, paused, manualPaused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (n === 0) {
    return emptyFallback ?? null;
  }

  return (
    <div
      className="relative w-full max-w-6xl mx-auto rounded-2xl overflow-hidden border border-gray-200 bg-black shadow-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative w-full h-[min(58vw,520px)] min-h-[280px] sm:min-h-[340px] md:min-h-[420px]">
        <div
          className="flex h-full transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, slideIdx) => (
            <div key={slide.id} className="min-w-full shrink-0 relative h-full">
              <Image
                src={slide.imageUrl}
                alt={slide.title || "배너"}
                fill
                className="object-cover"
                sizes="100vw"
                priority={slideIdx === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
              <div className="absolute inset-x-0 bottom-14 sm:bottom-16 z-[3] px-4 sm:px-8">
                <div className="max-w-[620px] rounded-xl border border-white/25 bg-black/45 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-[1px]">
                  <p className="inline-block rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/90">
                    WHEELS PICK
                  </p>
                  <h2 className="mt-2 text-2xl leading-tight sm:text-4xl font-extrabold text-white drop-shadow">
                    {slide.title || "새로운 시즌을 위한 합리적인 바이크"}
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-white/90">
                    {slide.description || "검증된 매물을 비교하고 안전하게 거래하세요."}
                  </p>
                  {slide.link && (
                    <Link
                      href={slide.link}
                      className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-100"
                    >
                      {slide.linkText || "자세히 보기"}
                    </Link>
                  )}
                </div>
              </div>
              {slide.link && (
                <Link
                  href={slide.link}
                  className="absolute inset-0 z-[1]"
                  aria-label={slide.linkText || slide.title || "배너 링크"}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {n > 1 && (
        <>
          <div className="absolute left-0 right-0 bottom-0 z-20 flex items-center justify-between border-t border-white/15 bg-black/55 px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-3 text-white">
              <button
                type="button"
                onClick={() => go(-1)}
                className="rounded-md border border-white/30 p-1.5 hover:bg-white/10"
                aria-label="이전 배너"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold tabular-nums">
                {index + 1} / {n}
              </span>
              <button
                type="button"
                onClick={() => setManualPaused((v) => !v)}
                className="rounded-md border border-white/30 p-1.5 hover:bg-white/10"
                aria-label={manualPaused ? "자동재생 시작" : "자동재생 정지"}
              >
                {manualPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="rounded-md border border-white/30 p-1.5 hover:bg-white/10"
                aria-label="다음 배너"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-8 bg-white" : "w-2 bg-white/45 hover:bg-white/80"
                  }`}
                  aria-label={`배너 ${i + 1}번 보기`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
