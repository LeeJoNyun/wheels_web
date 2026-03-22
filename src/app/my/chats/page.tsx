import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";

export default async function MyChatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/my/chats");

  const { data: chats } = await supabase
    .from("chats")
    .select(
      `
      id, listing_id, buyer_id, seller_id, updated_at,
      listing:listings(id, price, bike:bikes(brand, model, year))
    `
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-secondary-dark mb-4">내 채팅</h1>
        <ul className="space-y-2">
          {chats?.map((chat: any) => {
            const listing = chat.listing;
            const bike = listing?.bike;
            const otherId = chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id;
            return (
              <li key={chat.id}>
                <Link
                  href={`/chat?listingId=${chat.listing_id}`}
                  className="block p-4 bg-white border rounded-lg hover:shadow-md"
                >
                  <p className="font-medium">
                    {bike ? `${bike.brand} ${bike.model} (${bike.year})` : "매물"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {listing?.price?.toLocaleString()}원 · {new Date(chat.updated_at).toLocaleDateString("ko-KR")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
        {(!chats || chats.length === 0) && (
          <p className="text-gray-500 py-8 text-center">채팅 내역이 없습니다.</p>
        )}
      </main>
    </div>
  );
}
