import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ProfileEditForm } from "@/components/my/ProfileEditForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login?next=/my/settings");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, rating, trade_count, phone")
    .eq("id", user.id)
    .maybeSingle();

  const p = profile as { nickname: string | null; rating: number; trade_count: number; phone: string | null } | null;
  const providerMeta = user.app_metadata?.provider as string | undefined;
  const provider =
    providerMeta && providerMeta !== "email"
      ? providerMeta
      : user.user_metadata?.naver_id
        ? "naver"
        : "email";
  const avatarFromMetadata =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  return (
    <div className="min-h-screen flex flex-col bg-dashboard">
      <Header />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 pb-16">
        <Link
          href="/my"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          마이페이지
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-ink tracking-tight">프로필 설정</h1>
        <p className="mt-1 text-sm text-gray-600">계정 연결 상태와 프로필 정보를 관리합니다.</p>

        <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <ProfileEditForm
            provider={provider}
            initialAvatarUrl={avatarFromMetadata}
            initialNickname={p?.nickname ?? null}
            initialPhone={p?.phone ?? null}
          />
        </section>
      </main>
    </div>
  );
}
