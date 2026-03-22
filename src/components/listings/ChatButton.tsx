"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export function ChatButton({
  listingId,
  sellerId,
}: {
  listingId: string;
  sellerId: string;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const handleClick = () => {
    if (!user) {
      router.push(`/auth/login?next=/listings/${listingId}`);
      return;
    }
    if (user.id === sellerId) {
      return;
    }
    router.push(`/chat?listingId=${listingId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark"
    >
      채팅하기
    </button>
  );
}
