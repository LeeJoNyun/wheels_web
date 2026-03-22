"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatPageContent } from "@/components/chat/ChatPageContent";

function ChatFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">로딩 중...</p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatFallback />}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  return <ChatPageContent listingId={listingId} />;
}
