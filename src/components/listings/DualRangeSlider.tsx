"use client";

import { useMemo } from "react";

type DualRangeSliderProps = {
  min: number;
  max: number;
  step: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  /** 선택 구간 막대 */
  fillClassName?: string;
  /** 슬라이더 위 중앙 라벨 */
  label?: string;
};

/**
 * 하나의 트랙에 두 손잡이(최소·최대)를 겹쳐 둔 범위 슬라이더.
 */
export function DualRangeSlider({
  min,
  max,
  step,
  low,
  high,
  onChange,
  fillClassName = "bg-red-400",
  label,
}: DualRangeSliderProps) {
  const span = max - min || 1;
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);

  const { leftPct, widthPct } = useMemo(() => {
    const left = ((lo - min) / span) * 100;
    const w = ((hi - lo) / span) * 100;
    return {
      leftPct: left,
      widthPct: lo === hi ? Math.max(w, 0.6) : Math.max(w, 0),
    };
  }, [lo, hi, min, span]);

  return (
    <div className="range-dual relative w-full pb-1 pt-2">
      {label ? (
        <div
          className="pointer-events-none absolute -top-5 z-10 -translate-x-1/2 text-xs font-medium text-gray-700 tabular-nums whitespace-nowrap"
          style={{ left: `${leftPct + widthPct / 2}%` }}
        >
          {label}
        </div>
      ) : null}
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-300" />
      <div
        className={`pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-full ${fillClassName}`}
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={lo}
        aria-label="최소값"
        className="range-dual-input range-dual-input-min"
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(Math.min(v, hi), hi);
        }}
        onInput={(e) => {
          const v = Number((e.target as HTMLInputElement).value);
          onChange(Math.min(v, hi), hi);
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={hi}
        aria-label="최대값"
        className="range-dual-input range-dual-input-max"
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(lo, Math.max(v, lo));
        }}
        onInput={(e) => {
          const v = Number((e.target as HTMLInputElement).value);
          onChange(lo, Math.max(v, lo));
        }}
      />
    </div>
  );
}
