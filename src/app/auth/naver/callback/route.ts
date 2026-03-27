import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NAVER_CLIENT_ID } from "@/lib/naver";
import {
  getNaverClientSecret,
  getSupabaseServiceRoleKey,
} from "@/lib/server-env";
import { syncProfileWithWheelsApi } from "@/lib/wheels-api";

const STATE_COOKIE = "naver_oauth_state";

export const runtime = "nodejs";

type NaverTokenJson = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type NaverMeJson = {
  resultcode: string;
  message: string;
  response?: {
    id: string;
    email?: string;
    name?: string;
    nickname?: string;
    profile_image?: string;
  };
};

function syntheticNaverEmail(naverId: string) {
  return `naver_${naverId}@oauth.wheels.local`;
}

function isEmailAlreadyUsedError(err: { message?: string; code?: string }) {
  const m = (err.message ?? "").toLowerCase();
  return (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("duplicate") ||
    err.code === "email_exists"
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errParam = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");

  const cookieStore = cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;

  const redirectLogin = (msg: string) => {
    const res = NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(msg)}`
    );
    res.cookies.delete(STATE_COOKIE);
    return res;
  };

  if (errParam) {
    return redirectLogin(errDesc || errParam || "네이버 로그인이 취소되었습니다.");
  }

  if (!code || !state || !savedState || savedState !== state) {
    return redirectLogin("로그인 요청이 만료되었거나 유효하지 않습니다. 다시 시도해 주세요.");
  }

  const clientSecret = getNaverClientSecret();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!NAVER_CLIENT_ID || !clientSecret) {
    return redirectLogin("NAVER_CLIENT_SECRET 또는 네이버 Client ID 설정을 확인해 주세요.");
  }
  if (!serviceKey) {
    return redirectLogin(
      "서버에 SUPABASE_SERVICE_ROLE_KEY가 필요합니다. Supabase 대시보드 → Project Settings → API 의 service_role 키를 .env.local에만 넣어 주세요."
    );
  }

  const redirectUri = `${origin}/auth/naver/callback`;
  const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: NAVER_CLIENT_ID,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      state,
    }),
  });

  const tokenJson = (await tokenRes.json()) as NaverTokenJson;
  if (!tokenRes.ok || tokenJson.error || !tokenJson.access_token) {
    return redirectLogin(
      tokenJson.error_description || tokenJson.error || "네이버 토큰 교환에 실패했습니다."
    );
  }

  const meRes = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const meJson = (await meRes.json()) as NaverMeJson;
  if (meJson.resultcode !== "00" || !meJson.response?.id) {
    return redirectLogin(meJson.message || "네이버 프로필을 가져오지 못했습니다.");
  }

  const naverId = meJson.response.id;
  const email = syntheticNaverEmail(naverId);
  const displayName =
    meJson.response.name || meJson.response.nickname || "네이버 사용자";
  const avatar = meJson.response.profile_image ?? undefined;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: displayName,
      name: displayName,
      avatar_url: avatar,
      naver_id: naverId,
    },
  });

  if (createErr && !isEmailAlreadyUsedError(createErr)) {
    return redirectLogin(createErr.message || "계정을 만들지 못했습니다.");
  }

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/` },
  });

  const tokenHash = linkData?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    return redirectLogin(
      linkErr?.message || "로그인 링크를 만들지 못했습니다. Authentication에서 Email provider가 켜져 있는지 확인해 주세요."
    );
  }

  const publishable =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const sessionResponse = NextResponse.redirect(`${origin}/`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishable!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            sessionResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof sessionResponse.cookies.set>[2]
            )
          );
        },
      },
    }
  );

  const { data: verified, error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });

  sessionResponse.cookies.delete(STATE_COOKIE);

  if (verifyErr) {
    const errRes = NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(verifyErr.message)}`
    );
    errRes.cookies.delete(STATE_COOKIE);
    return errRes;
  }

  if (verified?.session?.access_token) {
    if (avatar || displayName) {
      const { error: updateErr } = await supabase.auth.updateUser({
        data: {
          ...(avatar ? { avatar_url: avatar } : {}),
          ...(displayName ? { full_name: displayName, name: displayName } : {}),
        },
      });
      if (updateErr && process.env.NODE_ENV === "development") {
        console.warn("[auth/naver/callback] profile sync failed:", updateErr.message);
      }
    }
    await syncProfileWithWheelsApi(verified.session.access_token);
  }

  return sessionResponse;
}
