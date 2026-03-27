import { redirect } from "next/navigation";

/** 예전 링크(/my/chats) 호환 — 채팅은 /chat 에서 동작 */
export default function MyChatsRedirectPage() {
  redirect("/chat");
}
