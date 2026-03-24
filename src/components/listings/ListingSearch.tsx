"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRANDS } from "@/types/database";
import { DualRangeSlider } from "@/components/listings/DualRangeSlider";
import { countFilteredListings, parseListingFilters, type ListingFilterParams } from "@/lib/listing-filters";

const CC_PRESETS = [125, 155, 250, 321, 400, 600, 1000] as const;

const PRICE_CAP = 10000; // 만원
const MILEAGE_CAP = 200000; // km

function paramsToQuery(p: ListingFilterParams): string {
  const u = new URLSearchParams();
  (Object.entries(p) as [string, string | undefined][]).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== "") u.set(k, String(v).trim());
  });
  return u.toString();
}

function readParamsFromUrl(sp: URLSearchParams): ListingFilterParams {
  return parseListingFilters(sp);
}

/** 구 ?segment= URL → 입력칸에 표시 */
function segmentToCcInputs(segment: string | undefined): { min: string; max: string } {
  switch (segment) {
    case "light":
      return { min: "0", max: "150" };
    case "mid":
      return { min: "151", max: "400" };
    case "sport":
      return { min: "401", max: "800" };
    case "liter":
      return { min: "801", max: "10000" };
    default:
      return { min: "", max: "" };
  }
}

export function ListingSearch({ initialCount }: { initialCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [q, setQ] = useState("");
  const [engineCcMin, setEngineCcMin] = useState("");
  const [engineCcMax, setEngineCcMax] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const yNow = new Date().getFullYear();
  const [yearMin, setYearMin] = useState<number>(1990);
  const [yearMax, setYearMax] = useState<number>(yNow);
  const [mileageMin, setMileageMin] = useState(0);
  const [mileageMax, setMileageMax] = useState(MILEAGE_CAP);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(PRICE_CAP);
  const [accident, setAccident] = useState("");
  const [tuning, setTuning] = useState("");
  const [count, setCount] = useState(initialCount);
  const [showMileageInput, setShowMileageInput] = useState(false);
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [mileageMinIn, setMileageMinIn] = useState("");
  const [mileageMaxIn, setMileageMaxIn] = useState("");
  const [priceMinIn, setPriceMinIn] = useState("");
  const [priceMaxIn, setPriceMaxIn] = useState("");

  const syncFromUrl = useCallback(() => {
    const p = readParamsFromUrl(searchParams);
    setQ(p.q || "");
    if (p.engine_cc_min || p.engine_cc_max) {
      setEngineCcMin(p.engine_cc_min || "");
      setEngineCcMax(p.engine_cc_max || "");
    } else if (p.segment && p.segment !== "all") {
      const { min, max } = segmentToCcInputs(p.segment);
      setEngineCcMin(min);
      setEngineCcMax(max);
    } else {
      setEngineCcMin("");
      setEngineCcMax("");
    }
    setBrand(p.brand || "");
    setModel(p.model || "");
    if (p.year_min) setYearMin(Number(p.year_min));
    else setYearMin(1990);
    if (p.year_max) setYearMax(Number(p.year_max));
    else setYearMax(new Date().getFullYear());
    if (p.mileage_min) setMileageMin(Number(p.mileage_min));
    else setMileageMin(0);
    if (p.mileage_max) setMileageMax(Number(p.mileage_max));
    else setMileageMax(MILEAGE_CAP);
    if (p.price_min) setPriceMin(Number(p.price_min));
    else setPriceMin(0);
    if (p.price_max) setPriceMax(Number(p.price_max));
    else setPriceMax(PRICE_CAP);
    setAccident(p.accident || "");
    setTuning(p.tuning || "");
  }, [searchParams]);

  useEffect(() => {
    syncFromUrl();
  }, [syncFromUrl]);

  const buildFilters = useCallback((): ListingFilterParams => {
    const f: ListingFilterParams = {};
    if (q.trim()) f.q = q.trim();
    const emin = engineCcMin.trim();
    const emax = engineCcMax.trim();
    if (emin || emax) {
      const nMin = emin ? Number(emin) : NaN;
      const nMax = emax ? Number(emax) : NaN;
      if (emin && !Number.isNaN(nMin)) f.engine_cc_min = String(Math.round(nMin));
      if (emax && !Number.isNaN(nMax)) f.engine_cc_max = String(Math.round(nMax));
      if (
        f.engine_cc_min &&
        f.engine_cc_max &&
        Number(f.engine_cc_min) > Number(f.engine_cc_max)
      ) {
        const t = f.engine_cc_min;
        f.engine_cc_min = f.engine_cc_max;
        f.engine_cc_max = t;
      }
    }
    if (brand) f.brand = brand;
    if (model.trim()) f.model = model.trim();
    if (yearMin > 1990) f.year_min = String(yearMin);
    if (yearMax < yNow) f.year_max = String(yearMax);
    if (mileageMin > 0) f.mileage_min = String(mileageMin);
    if (mileageMax < MILEAGE_CAP) f.mileage_max = String(mileageMax);
    if (priceMin > 0) f.price_min = String(priceMin);
    if (priceMax < PRICE_CAP) f.price_max = String(priceMax);
    if (accident) f.accident = accident;
    if (tuning) f.tuning = tuning;
    return f;
  }, [q, engineCcMin, engineCcMax, brand, model, yearMin, yearMax, yNow, mileageMin, mileageMax, priceMin, priceMax, accident, tuning]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const { count: c } = await countFilteredListings(supabase, buildFilters());
      if (!cancelled && c != null) setCount(c);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [supabase, buildFilters]);

  const onSearch = () => {
    const qs = paramsToQuery(buildFilters());
    router.push(qs ? `/listings?${qs}` : "/listings");
  };

  const onReset = () => {
    setQ("");
    setEngineCcMin("");
    setEngineCcMax("");
    setBrand("");
    setModel("");
    const y = new Date().getFullYear();
    setYearMin(1990);
    setYearMax(y);
    setMileageMin(0);
    setMileageMax(MILEAGE_CAP);
    setPriceMin(0);
    setPriceMax(PRICE_CAP);
    setAccident("");
    setTuning("");
    router.push("/listings");
  };

  const mileageIsFull = mileageMin <= 0 && mileageMax >= MILEAGE_CAP;
  const priceIsFull = priceMin <= 0 && priceMax >= PRICE_CAP;
  const yearCenterLabel = `${yearMin}년~${yearMax}년`;
  const mileageCenterLabel = mileageIsFull
    ? "전체"
    : `${mileageMin.toLocaleString()}km~${mileageMax.toLocaleString()}km`;
  const priceCenterLabel = priceIsFull
    ? "전체"
    : `${priceMin.toLocaleString()}만원~${priceMax.toLocaleString()}만원`;

  const applyMileageDirect = () => {
    const a = mileageMinIn === "" ? 0 : Number(mileageMinIn);
    const b = mileageMaxIn === "" ? MILEAGE_CAP : Number(mileageMaxIn);
    if (!Number.isNaN(a) && !Number.isNaN(b) && a <= b) {
      setMileageMin(Math.max(0, a));
      setMileageMax(Math.min(MILEAGE_CAP, b));
    }
    setShowMileageInput(false);
  };

  const applyPriceDirect = () => {
    const a = priceMinIn === "" ? 0 : Number(priceMinIn);
    const b = priceMaxIn === "" ? PRICE_CAP : Number(priceMaxIn);
    if (!Number.isNaN(a) && !Number.isNaN(b) && a <= b) {
      setPriceMin(Math.max(0, a));
      setPriceMax(Math.min(PRICE_CAP, b));
    }
    setShowPriceInput(false);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-28 md:pb-8">
        <h1 className="text-center text-lg font-bold text-gray-900 mb-3">매물 검색</h1>

        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="예: 닌자 400 찾으세요?"
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>

        <div className="border-t border-gray-100 pt-3 pb-2">
          <p className="text-[15px] font-medium text-gray-800 mb-2">배기량 (cc)</p>
          <p className="text-xs text-gray-500 mb-2">숫자만 입력 (예: 321, 또는 300~400 구간)</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={10000}
              placeholder="최소"
              value={engineCcMin}
              onChange={(e) => setEngineCcMin(e.target.value)}
              className="w-[calc(50%-4px)] min-w-[100px] rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
            <span className="text-gray-400">~</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={10000}
              placeholder="최대"
              value={engineCcMax}
              onChange={(e) => setEngineCcMax(e.target.value)}
              className="w-[calc(50%-4px)] min-w-[100px] rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {CC_PRESETS.map((cc) => (
              <button
                key={cc}
                type="button"
                onClick={() => {
                  setEngineCcMin(String(cc));
                  setEngineCcMax(String(cc));
                }}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50"
              >
                {cc}cc
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100 border-t border-gray-100 mt-2">
          <div className="flex items-center justify-between py-3.5 text-[15px] gap-3">
            <span className="text-gray-800 shrink-0">제조사</span>
            <select
              aria-label="제조사"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-[60%]"
            >
              <option value="">전체</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between py-3.5 text-[15px] gap-3">
            <span className="text-gray-800 shrink-0">모델</span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="예: CB650R"
              className="flex-1 text-right text-sm rounded-lg border border-gray-200 px-3 py-2 text-gray-800 placeholder:text-gray-400"
            />
          </div>
          <div className="py-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
              <span className="text-[15px] font-medium text-gray-800">연식</span>
              <span className="text-xl font-bold text-orange-600 tabular-nums tracking-tight">{yearCenterLabel}</span>
            </div>
            <DualRangeSlider
              min={1990}
              max={yNow}
              step={1}
              low={yearMin}
              high={yearMax}
              fillClassName="bg-red-400"
              label={yearCenterLabel}
              onChange={(lo, hi) => {
                setYearMin(lo);
                setYearMax(hi);
              }}
            />
            <div className="flex justify-between text-sm font-semibold text-gray-800 tabular-nums mt-1">
              <span>{yearMin}년</span>
              <span>{yearMax}년</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-2 pt-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-[15px] font-medium text-gray-800">주행거리</span>
              <button
                type="button"
                onClick={() => {
                  setMileageMinIn(mileageMin ? String(mileageMin) : "");
                  setMileageMaxIn(mileageMax < MILEAGE_CAP ? String(mileageMax) : "");
                  setShowMileageInput(true);
                }}
                className="text-sm text-orange-600 font-medium shrink-0"
              >
                직접 입력
              </button>
            </div>
            <DualRangeSlider
              min={0}
              max={MILEAGE_CAP}
              step={1000}
              low={mileageMin}
              high={mileageMax}
              fillClassName="bg-red-400"
              label={mileageCenterLabel}
              onChange={(lo, hi) => {
                setMileageMin(lo);
                setMileageMax(hi);
              }}
            />
            <div className="flex justify-between text-sm font-semibold text-gray-800 tabular-nums mt-1">
              <span>{mileageMin.toLocaleString()}km</span>
              <span>{mileageMax.toLocaleString()}km</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] font-medium text-gray-800">가격 (만원)</span>
              <button
                type="button"
                onClick={() => {
                  setPriceMinIn(priceMin ? String(priceMin) : "");
                  setPriceMaxIn(priceMax < PRICE_CAP ? String(priceMax) : "");
                  setShowPriceInput(true);
                }}
                className="text-sm text-orange-600 font-medium"
              >
                직접 입력
              </button>
            </div>
            <DualRangeSlider
              min={0}
              max={PRICE_CAP}
              step={50}
              low={priceMin}
              high={priceMax}
              fillClassName="bg-red-400"
              label={priceCenterLabel}
              onChange={(lo, hi) => {
                setPriceMin(lo);
                setPriceMax(hi);
              }}
            />
            <div className="flex justify-between text-sm font-semibold text-gray-800 tabular-nums mt-1">
              <span>{priceMin.toLocaleString()}만원</span>
              <span>{priceMax.toLocaleString()}만원</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">슬라이더 단위: 만원</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 border-t border-gray-100 mt-4">
          <StaticRow label="지역" hint="준비 중" />
          <div className="flex items-center justify-between py-3.5 text-[15px]">
            <span className="text-gray-800">무사고만</span>
            <select
              value={accident}
              onChange={(e) => setAccident(e.target.value)}
              className="text-sm text-gray-600 bg-transparent border-0 pr-6 focus:ring-0"
            >
              <option value="">전체</option>
              <option value="no">무사고만</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-3.5 text-[15px]">
            <span className="text-gray-800">튜닝</span>
            <select
              value={tuning}
              onChange={(e) => setTuning(e.target.value)}
              className="text-sm text-gray-600 bg-transparent border-0 pr-6 focus:ring-0"
            >
              <option value="">전체</option>
              <option value="yes">있음</option>
              <option value="no">없음</option>
            </select>
          </div>
          <StaticRow label="연료 / 변속" hint="바이크 기준 준비 중" />
        </div>
      </div>

      {/* sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 safe-area-pb">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            전체 초기화
          </button>
          <button
            type="button"
            onClick={onSearch}
            className="flex-[1.4] rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 active:scale-[0.99] transition"
          >
            검색 ({count.toLocaleString()}대)
          </button>
        </div>
      </div>

      {showMileageInput && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl">
            <h3 className="font-bold text-gray-900 text-[1.75rem] leading-tight mb-5">주행거리 직접 입력 (km)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <input
                type="number"
                inputMode="numeric"
                placeholder="최소"
                value={mileageMinIn}
                onChange={(e) => setMileageMinIn(e.target.value)}
                className="no-spinner w-full min-w-0 rounded-2xl border border-gray-300 px-4 py-3.5 text-lg text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="최대"
                value={mileageMaxIn}
                onChange={(e) => setMileageMaxIn(e.target.value)}
                className="no-spinner w-full min-w-0 rounded-2xl border border-gray-300 px-4 py-3.5 text-lg text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowMileageInput(false)}
                className="h-14 rounded-2xl border border-gray-300 bg-white text-gray-900 text-2xl font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={applyMileageDirect}
                className="h-14 rounded-2xl bg-orange-500 text-white text-2xl font-medium"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {showPriceInput && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl">
            <h3 className="font-bold text-gray-900 text-[1.75rem] leading-tight mb-5">가격 직접 입력 (만원)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <input
                type="number"
                inputMode="numeric"
                placeholder="최소"
                value={priceMinIn}
                onChange={(e) => setPriceMinIn(e.target.value)}
                className="no-spinner w-full min-w-0 rounded-2xl border border-gray-300 px-4 py-3.5 text-lg text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="최대"
                value={priceMaxIn}
                onChange={(e) => setPriceMaxIn(e.target.value)}
                className="no-spinner w-full min-w-0 rounded-2xl border border-gray-300 px-4 py-3.5 text-lg text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowPriceInput(false)}
                className="h-14 rounded-2xl border border-gray-300 bg-white text-gray-900 text-2xl font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={applyPriceDirect}
                className="h-14 rounded-2xl bg-orange-500 text-white text-2xl font-medium"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StaticRow({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 text-[15px] text-gray-400">
      <span>{label}</span>
      <span className="text-xs">{hint}</span>
    </div>
  );
}
