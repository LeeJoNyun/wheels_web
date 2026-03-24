import { NextResponse } from "next/server";
import { NAVER_CLIENT_ID } from "@/lib/naver";

const STATE_COOKIE = "naver_oauth_state";

export const runtime = "nodejs";

/** Supabase에 네이버 프로바이더가 없어 nid.naver.com OAuth 후 콜백에서 계정·세션을 만듦 */
export async function GET(request: Request) {
  if (!NAVER_CLIENT_ID) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent("NEXT_PUBLIC_NAVER_CLIENT_ID를 .env.local에 설정해 주세요.")}`,
        request.url
      )
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/auth/naver/callback`;
  const state = crypto.randomUUID();

  const authorize = new URL("https://nid.naver.com/oauth2.0/authorize");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", NAVER_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("scope", "name email profile_image");

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
