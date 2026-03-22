"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export function Header() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/logo.svg"
            alt="wheels"
            className="h-9 sm:h-10 md:h-11 w-auto object-contain object-left transition-all"
          />
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/listings" className="text-gray-600 hover:text-primary">
            매물
          </Link>
          {loading ? (
            <span className="text-gray-400 text-sm">로딩중...</span>
          ) : user ? (
            <>
              <Link href="/my/listings" className="text-gray-600 hover:text-primary">
                내 매물
              </Link>
              <Link href="/my/chats" className="text-gray-600 hover:text-primary">
                채팅
              </Link>
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-primary text-sm"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
