"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Header } from "@/components/layout/Header";

export function ChatPageContent({ listingId }: { listingId: string | null }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; sender_id: string; message: string; created_at: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      if (!authLoading) router.push("/auth/login");
      return;
    }
    if (!listingId) {
      router.push("/listings");
      return;
    }

    const run = async () => {
      const { data: listing } = await supabase
        .from("listings")
        .select("id, user_id")
        .eq("id", listingId)
        .single();
      if (!listing || listing.user_id === user.id) {
        router.push("/listings");
        return;
      }
      let { data: chat } = await supabase
        .from("chats")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", user.id)
        .single();
      if (!chat) {
        const { data: created } = await supabase
          .from("chats")
          .insert({
            listing_id: listingId,
            buyer_id: user.id,
            seller_id: listing.user_id,
          })
          .select("id")
          .single();
        chat = created ?? null;
      }
      if (chat) {
        setChatId(chat.id);
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, sender_id, message, created_at")
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: true });
        setMessages(msgs || []);
      }
      setLoading(false);
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- init once when user/listingId available
  }, [user?.id, listingId, authLoading]);

  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as any]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase ref stable
  }, [chatId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user || sending) return;
    setSending(true);
    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      message: newMessage.trim(),
    });
    setNewMessage("");
    setSending(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Header />
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4 max-w-2xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">채팅</h1>
          <button
            type="button"
            onClick={() => router.push("/my/chats")}
            className="text-primary text-sm"
          >
            채팅 목록
          </button>
        </div>
        {loading ? (
          <p className="text-gray-500">로딩 중...</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px] bg-gray-50 rounded-lg p-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      m.sender_id === user.id ? "bg-primary text-white" : "bg-white border"
                    }`}
                  >
                    <p className="text-sm">{m.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(m.created_at).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 mt-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지 입력..."
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium disabled:opacity-50"
              >
                전송
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
