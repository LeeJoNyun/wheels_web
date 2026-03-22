"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BRANDS } from "@/types/database";

const ENGINE_CC_OPTIONS = [125, 300, 600, 1000];

export function ListingSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams();
    (["brand", "engine_cc", "price_min", "price_max", "year_min", "year_max", "mileage_max", "accident", "tuning"] as const).forEach((key) => {
      const v = data.get(key);
      if (v && String(v).trim()) params.set(key, String(v).trim());
    });
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제조사</label>
          <select name="brand" className="w-full px-3 py-2 border rounded-lg" defaultValue={searchParams.get("brand") || ""}>
            <option value="">전체</option>
            {BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">배기량</label>
          <select name="engine_cc" className="w-full px-3 py-2 border rounded-lg" defaultValue={searchParams.get("engine_cc") || ""}>
            <option value="">전체</option>
            {ENGINE_CC_OPTIONS.map((cc) => (
              <option key={cc} value={cc}>{cc}cc</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">가격 최소(만원)</label>
          <input type="number" name="price_min" placeholder="0" className="w-full px-3 py-2 border rounded-lg" defaultValue={searchParams.get("price_min") || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">가격 최대(만원)</label>
          <input type="number" name="price_max" placeholder="10000" className="w-full px-3 py-2 border rounded-lg" defaultValue={searchParams.get("price_max") || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">연식 최소</label>
          <input type="number" name="year_min" placeholder="2010" className="w-full px-3 py-2 border rounded-lg" defaultValue={searchParams.get("year_min") || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">연식 최대</label>
          <input type="number" name="year_max" placeholder="2025" className="w-full px-3 py-2 border rounded-lg" defaultValue={searchParams.get("year_max") || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">주행거리 최대(km)</label>
          <input type="number" name="mileage_max" placeholder="50000" className="w-full px-3 py-2 border rounded-lg" defaultValue={searchParams.get("mileage_max") || ""} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">사고</label>
          <select name="accident" className="w-full px-3 py-2 border rounded-lg" defaultValue={searchParams.get("accident") || ""}>
            <option value="">전체</option>
            <option value="no">무사고</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">튜닝</label>
          <select name="tuning" className="w-full px-3 py-2 border rounded-lg" defaultValue={searchParams.get("tuning") || ""}>
            <option value="">전체</option>
            <option value="yes">있음</option>
            <option value="no">없음</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark">
          검색
        </button>
        <button type="button" onClick={() => router.push("/listings")} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
          초기화
        </button>
      </div>
    </form>
  );
}
