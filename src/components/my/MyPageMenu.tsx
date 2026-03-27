"use client";

import Link from "next/link";
import { Headphones, List, LogOut, MessageSquare, PlusCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

const linkClass =
  "flex flex-col justify-center gap-0.5 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:border-brand/25 hover:shadow-md sm:min-h-[4.25rem] sm:p-3.5";

export function MyPageMenu() {
  const { signOut } = useAuth();

  const items = [
    { href: "/my/listings", label: "내 매물 관리", icon: List },
    { href: "/chat", label: "채팅 목록", icon: MessageSquare },
    { href: "/listings/new", label: "매물 등록", icon: PlusCircle },
    { href: "/help", label: "고객 센터", icon: Headphones },
  ] as const;

  return (
    <div>
      <nav className="grid grid-cols-2 gap-2 sm:gap-3" aria-label="마이페이지 바로가기">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass}>
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-brand-charcoal/90" strokeWidth={1.75} aria-hidden />
              <span className="text-[13px] font-semibold leading-tight text-ink">{label}</span>
            </span>
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => signOut()}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-[13px] font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
      >
        <LogOut className="h-4 w-4 text-gray-500" strokeWidth={1.75} aria-hidden />
        로그아웃
      </button>
    </div>
  );
}
