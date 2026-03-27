"use client";

import Link from "next/link";
import { LayoutGrid, List, LogOut, MessageSquare, UserCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

/** 네비·유저 메뉴 공통 간격 (gutter) */
const navGutter = "gap-4 md:gap-5";
const navItemClass =
  "inline-flex items-center gap-1.5 text-[13px] font-medium leading-5 text-ink hover:text-brand-charcoal transition-colors whitespace-nowrap";
const iconClass = "h-4 w-4 shrink-0 text-brand-charcoal/85";

export function Header() {
  const { user, loading, signOut } = useAuth();

  const listingsNewHref = user ? "/listings/new" : "/auth/login?next=/listings/new";

  return (
    <header className="border-b border-gray-200/80 bg-white sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-2.5 flex min-h-[3rem] items-center gap-0">
        {/* 좌측: 로고 + 탐색(매물) + 액션(매물 등록) */}
        <div className={`flex min-w-0 shrink-0 items-center ${navGutter}`}>
          <Link href="/" className="flex shrink-0 items-center">
            <img
              src="/logo.svg"
              alt="wheels"
              className="h-9 w-auto object-contain object-left transition-all sm:h-10 md:h-11"
            />
          </Link>
          <Link href="/listings" className={navItemClass}>
            <LayoutGrid className={iconClass} strokeWidth={1.75} aria-hidden />
            매물
          </Link>
          <Link
            href={listingsNewHref}
            className="inline-flex shrink-0 items-center rounded-lg bg-brand-button px-3 py-1.5 text-[13px] font-semibold leading-5 text-white shadow-sm transition-colors hover:bg-brand-button-hover"
          >
            매물 등록
          </Link>
        </div>

        {/* 중앙: 검색 등 확보용 여백 */}
        <div className="min-h-[2.5rem] min-w-[0.5rem] flex-1 mx-1 sm:mx-3" aria-hidden="true" />

        {/* 우측: 개인/커뮤니티 — 채팅 > 내 매물 > 마이페이지 > 로그아웃 */}
        <nav
          className={`ml-auto flex shrink-0 items-center justify-end ${navGutter} overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
          aria-label="사용자 메뉴"
        >
          {loading ? (
            <span className="text-[13px] text-gray-400 whitespace-nowrap">로딩중...</span>
          ) : user ? (
            <>
              <Link href="/chat" className={navItemClass}>
                <MessageSquare className={iconClass} strokeWidth={1.75} aria-hidden />
                채팅
              </Link>
              <Link href="/my/listings" className={navItemClass}>
                <List className={iconClass} strokeWidth={1.75} aria-hidden />
                내 매물
              </Link>
              <Link href="/my" className={navItemClass}>
                <UserCircle className={iconClass} strokeWidth={1.75} aria-hidden />
                마이페이지
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-brand-charcoal/70 transition-colors hover:bg-gray-100 hover:text-brand-charcoal"
                aria-label="로그아웃"
                title="로그아웃"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex shrink-0 items-center rounded-lg bg-brand-charcoal px-3 py-1.5 text-[13px] font-semibold leading-5 text-white shadow-sm transition-colors hover:bg-secondary-dark"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
