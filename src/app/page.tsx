import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">BikeMarket</h1>
        <p className="mt-2 text-gray-600 max-w-md">오토바이 중고거래 — 조건에 맞는 매물을 찾아보세요.</p>
        <Link
          href="/listings"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-orange-500 px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-orange-600 transition"
        >
          매물 검색하기
        </Link>
      </main>
    </div>
  );
}
