"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BANNERS = [
  {
    id: 1,
    image: "/banner_1.png",
    title: "당신의 다음 라이딩을\nwheels에서 시작하세요",
    description: "오토바이 전문 거래 플랫폼. 투명한 상태 정보와 안전한 채팅 시스템.",
    link: "/listings",
    linkText: "매물 보러가기"
  },
  {
    id: 2,
    image: "/banner_2.png",
    title: "클래식의 가치를\n한눈에 확인하세요",
    description: "관리가 잘 된 빈티지 바이크부터 카페 레이서까지 전문적인 매물 관리.",
    link: "/listings?category=classic",
    linkText: "클래식 바이크 보기"
  },
  {
    id: 3,
    image: "/banner_3.png",
    title: "미래형 라이딩,\n가장 먼저 만나보세요",
    description: "전기 오토바이 및 최신 테크가 집약된 신규 모델 매물 다수 보유.",
    link: "/listings?category=electric",
    linkText: "전기 바이크 보기"
  }
];

export function Banner() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % BANNERS.length);
  const prev = () => setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[500px] w-full overflow-hidden bg-gray-900">
      {BANNERS.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <img
            src={banner.image}
            alt={banner.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary-dark/80 to-transparent" />
          
          <div className="container mx-auto px-4 h-full flex flex-col justify-center text-white relative z-20">
            <div className="max-w-2xl animate-fade-in-up">
              <h1 className="text-5xl font-extrabold mb-4 whitespace-pre-line leading-tight">
                {banner.title.split('\n').map((line, i) => (
                  <span key={i}>
                    {line.includes("wheels") ? (
                      <span className="text-primary">{line}</span>
                    ) : line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </h1>
              <p className="text-xl text-white/90 mb-8 font-light">
                {banner.description}
              </p>
              <div className="flex gap-4">
                <Link
                  href={banner.link}
                  className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition shadow-lg shadow-primary/20"
                >
                  {banner.linkText}
                </Link>
                <Link
                  href="/listings/new"
                  className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition"
                >
                  내 바이크 팔기
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition backdrop-blur-sm"
      >
        <ChevronLeft size={32} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition backdrop-blur-sm"
      >
        <ChevronRight size={32} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === current ? "bg-primary w-8" : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
