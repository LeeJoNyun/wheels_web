import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncProfileWithWheelsApi } from "@/lib/wheels-api";

// Supabase Dashboard → Authentication → URL Configuration 에서
// Redirect URLs에 https://도메인/auth/callback (개발: http://localhost:3000/auth/callback) 추가 필요
// 카카오: /auth/kakao OIDC → Kakao Redirect URI는 /auth/kakao/callback (Supabase /auth/v1/callback 과 별도)
// 네이버: /auth/naver → 콜백에서 서버가 세션 쿠키를 심고 / 로 보냄 (이 라우트를 거치지 않을 수 있음)

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data: exchanged, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  if (exchanged?.session?.access_token) {
    await syncProfileWithWheelsApi(exchanged.session.access_token);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
