import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Settings, User } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MyPageMenu } from "@/components/my/MyPageMenu";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getMyListingCounts } from "@/lib/listing-filters";

export const dynamic = "force-dynamic";

export default async function MyPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login?next=/my");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, rating, trade_count, phone")
    .eq("id", user.id)
    .maybeSingle();

  const p = profile as { nickname: string | null; rating: number; trade_count: number; phone: string | null } | null;
  const rating = p?.rating ?? 0;
  const tradeCount = p?.trade_count ?? 0;

  const admin = createServiceRoleClient();
  const counts = await getMyListingCounts(admin, user.id);

  let favoritesDisplay: number | null = null;
  const favRes = await supabase
    .from("listing_favorites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (!favRes.error) {
    favoritesDisplay = favRes.count ?? 0;
  }

  const updatedRaw = searchParams.updated;
  const profileJustUpdated = typeof updatedRaw === "string" && updatedRaw === "1";
  const avatarFromMetadata =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

  return (
    <div className="min-h-screen flex flex-col bg-dashboard">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 pb-16">
        <h1 className="text-2xl font-bold text-ink tracking-tight">마이페이지</h1>
        <p className="mt-1 text-sm text-gray-600">활동 요약과 바로가기를 한곳에서 확인하세요.</p>

        {profileJustUpdated ? (
          <p
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
            role="status"
          >
            프로필이 저장되었습니다.
          </p>
        ) : null}

        {/* 조회용 프로필 */}
        <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand/10 text-brand">
                {avatarFromMetadata ? (
                  <Image
                    src={avatarFromMetadata}
                    alt="내 프로필 이미지"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <User className="h-7 w-7" strokeWidth={1.5} aria-hidden />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">내 프로필</p>
                <p className="mt-1 text-lg font-semibold text-ink">{p?.nickname?.trim() || "닉네임 미설정"}</p>
                {user.email ? (
                  <p className="mt-0.5 truncate text-sm text-gray-600">{user.email}</p>
                ) : null}
                {p?.phone ? <p className="mt-1 text-sm text-gray-600">{p.phone}</p> : null}
                <p className="mt-2 text-xs text-gray-500">
                  평점 {rating} · 거래 {tradeCount}회 · 이메일 변경은 로그인 계정(소셜) 설정에서 진행해 주세요.
                </p>
              </div>
            </div>
            <Link
              href="/my/settings"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-ink shadow-sm transition hover:border-brand/40 hover:bg-brand/5"
            >
              <Settings className="h-4 w-4 text-brand-charcoal/90" strokeWidth={1.75} aria-hidden />
              프로필 수정
            </Link>
          </div>
        </section>

        {/* 활동 요약 */}
        <section className="mt-5" aria-label="활동 요약">
          <h2 className="sr-only">활동 요약</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-[13px] font-medium text-gray-600">관심 매물</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-ink">
                {favoritesDisplay === null ? "—" : favoritesDisplay}
              </p>
              {favoritesDisplay === null ? (
                <p className="mt-1 text-xs text-gray-500">곧 연동 예정</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">저장한 매물</p>
              )}
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-[13px] font-medium text-gray-600">판매 중</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-ink">{counts.active}</p>
              <p className="mt-1 text-xs text-gray-500">
                게시 중인 매물
                {counts.reserved > 0 ? ` · 예약 ${counts.reserved}건` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-[13px] font-medium text-gray-600">거래 완료</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-ink">{counts.sold}</p>
              <p className="mt-1 text-xs text-gray-500">완료 처리된 매물</p>
            </div>
          </div>
          {counts.error ? (
            <p className="mt-2 text-xs text-amber-800">일부 집계를 불러오지 못했습니다.</p>
          ) : null}
        </section>

        {/* 메뉴 — 2열 + 로그아웃 */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-ink">바로가기</h2>
          <MyPageMenu />
        </section>
      </main>
    </div>
  );
}
