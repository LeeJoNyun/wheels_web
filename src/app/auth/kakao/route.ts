import { NextResponse } from "next/server";
import { KAKAO_REST_API_KEY } from "@/lib/kakao";
import { getKakaoClientSecret } from "@/lib/server-env";

const STATE_COOKIE = "kakao_oauth_state";

export const runtime = "nodejs";

/**
 * Supabase 기본 카카오 OAuth는 account_email을 항상 넣어 KOE205가 날 수 있음 → 여기서는 직접 인가 URL을 만듦.
 * scope에 openid가 있으면 카카오 콘솔에서「OpenID Connect 사용」을 켜야 함. 끄면 KOE205(invalid_scope).
 * Redirect URI: {현재 접속 origin}/auth/kakao/callback (예: http://localhost:3001/auth/kakao/callback)
 */
export async function GET(request: Request) {
  if (!KAKAO_REST_API_KEY) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent("카카오 앱 키가 설정되지 않았습니다.")}`,
        request.url
      )
    );
  }
  if (!getKakaoClientSecret()) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(
          "KAKAO_CLIENT_SECRET을 읽지 못했습니다. wheels_web/.env.local에 넣었는지 확인하고, 터미널에 나온 포트(예: 3002)로 접속 중인지 확인하세요. 3000·3001에 예전 next dev가 남아 있으면 종료 후 다시 npm run dev 하세요."
        )}`,
        request.url
      )
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/auth/kakao/callback`;
  const state = crypto.randomUUID();

  const authorize = new URL("https://kauth.kakao.com/oauth/authorize");
  authorize.searchParams.set("client_id", KAKAO_REST_API_KEY);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("state", state);
  const scope =
    process.env.KAKAO_LOGIN_SCOPES?.trim() ||
    "openid profile_nickname profile_image";
  authorize.searchParams.set("scope", scope);

  const res = NextResponse.redirect(authorize.toString());
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
