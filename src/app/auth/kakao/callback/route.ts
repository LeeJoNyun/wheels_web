import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { KAKAO_REST_API_KEY } from "@/lib/kakao";
import { getKakaoClientSecret } from "@/lib/server-env";
import { syncProfileWithWheelsApi } from "@/lib/wheels-api";

const STATE_COOKIE = "kakao_oauth_state";

export const runtime = "nodejs";

type KakaoTokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type KakaoMeResponse = {
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const searchParams = url.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const kakaoError = searchParams.get("error_description") || searchParams.get("error");

  const cookieStore = cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;

  const redirectLogin = (msg: string) =>
    NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(msg)}`);

  if (kakaoError) {
    const res = redirectLogin(typeof kakaoError === "string" ? kakaoError : "카카오 로그인이 취소되었습니다.");
    res.cookies.delete(STATE_COOKIE);
    return res;
  }

  if (!code || !state || !savedState || savedState !== state) {
    const res = redirectLogin("로그인 요청이 만료되었거나 유효하지 않습니다. 다시 시도해 주세요.");
    res.cookies.delete(STATE_COOKIE);
    return res;
  }

  const clientSecret = getKakaoClientSecret();
  if (!KAKAO_REST_API_KEY || !clientSecret) {
    const res = redirectLogin("카카오 서버 설정이 완료되지 않았습니다.");
    res.cookies.delete(STATE_COOKIE);
    return res;
  }

  const redirectUri = `${origin}/auth/kakao/callback`;
  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: redirectUri,
      code,
      client_secret: clientSecret,
    }),
  });

  const tokens = (await tokenRes.json()) as KakaoTokenResponse;

  if (!tokenRes.ok || tokens.error) {
    const res = redirectLogin(
      tokens.error_description || tokens.error || "카카오 토큰을 받지 못했습니다."
    );
    res.cookies.delete(STATE_COOKIE);
    return res;
  }

  if (!tokens.id_token) {
    const res = redirectLogin(
      "카카오에서 ID 토큰을 받지 못했습니다. 카카오 개발자 콘솔에서 OpenID Connect를 켜고, Redirect URI에 이 주소를 등록했는지 확인해 주세요."
    );
    res.cookies.delete(STATE_COOKIE);
    return res;
  }

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabaseResponse = NextResponse.redirect(`${origin}/`);

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
        );
      },
    },
  });

  const { data: signed, error } = await supabase.auth.signInWithIdToken({
    provider: "kakao",
    token: tokens.id_token,
    ...(tokens.access_token ? { access_token: tokens.access_token } : {}),
  });

  if (error) {
    const errRes = NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
    );
    errRes.cookies.delete(STATE_COOKIE);
    return errRes;
  }

  if (tokens.access_token) {
    try {
      const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const meJson = (await meRes.json()) as KakaoMeResponse;
      const avatar =
        meJson.properties?.profile_image ?? meJson.properties?.thumbnail_image ?? null;
      const displayName = meJson.properties?.nickname ?? null;
      if (avatar || displayName) {
        const { error: updateErr } = await supabase.auth.updateUser({
          data: {
            ...(avatar ? { avatar_url: avatar } : {}),
            ...(displayName ? { full_name: displayName, name: displayName } : {}),
          },
        });
        if (updateErr && process.env.NODE_ENV === "development") {
          console.warn("[auth/kakao/callback] profile sync failed:", updateErr.message);
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[auth/kakao/callback] me fetch failed:", e);
      }
    }
  }

  if (signed?.session?.access_token) {
    await syncProfileWithWheelsApi(signed.session.access_token);
  }

  supabaseResponse.cookies.delete(STATE_COOKIE);
  return supabaseResponse;
}
