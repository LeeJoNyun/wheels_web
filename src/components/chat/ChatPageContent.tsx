"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";

export function ChatPageContent({ listingId }: { listingId: string | null }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        {!listingId ? (
          <div className="rounded-xl border bg-white p-6 text-center">
            <p className="text-gray-600">채팅할 매물이 지정되지 않았습니다.</p>
            <Link href="/listings" className="mt-4 inline-block text-brand font-medium hover:underline">
              매물 목록으로
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">매물 ID</p>
            <p className="font-mono text-sm break-all mt-1">{listingId}</p>
            <p className="mt-6 text-gray-600 text-sm">
              채팅 UI는 Supabase Realtime·메시지 API 연동 후 이 영역에 표시됩니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
