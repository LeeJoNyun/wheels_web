"use client";

import Link from "next/link";

type Props = {
  href: string;
  /** 홈 / 검색 목록 / 기본 */
  variant: "home" | "search" | "default";
};

const labelMap = {
  home: "홈으로",
  search: "검색 목록으로",
  default: "목록으로",
} as const;

export function BackToPreviousNav({ href, variant }: Props) {
  const text = labelMap[variant];

  return (
    <Link
      href={href}
      className="group inline-flex items-center rounded-lg py-1.5 pr-2 text-sm font-medium text-gray-600 transition-colors hover:text-orange-600"
    >
      <span className="tabular-nums">
        <span className="listing-back-arrow inline-block transition-transform duration-200 group-hover:-translate-x-0.5">
          ←
        </span>{" "}
        {text}
      </span>
    </Link>
  );
}
