import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase Dashboard → Authentication → URL Configuration 에서
// Redirect URLs에 https://도메인/auth/callback (개발: http://localhost:3000/auth/callback) 추가 필요

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
