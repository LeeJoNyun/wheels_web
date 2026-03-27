import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mustEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

type Body = {
  nickname?: string;
  phone?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = mustEnv("NEXT_PUBLIC_SUPABASE_URL");
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    const serviceRole = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
    if (!anonKey) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");

    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
    }
    const token = auth.slice(7);

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: userErr,
    } = await authClient.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: userErr?.message || "Invalid token" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const nickname = (body.nickname ?? "").trim();
    const phone = (body.phone ?? "").toString().trim();

    if (!nickname) {
      return NextResponse.json({ error: "닉네임을 입력해 주세요." }, { status: 400 });
    }
    if (nickname.length > 64) {
      return NextResponse.json({ error: "닉네임은 64자 이하로 입력해 주세요." }, { status: 400 });
    }
    if (phone.length > 32) {
      return NextResponse.json({ error: "연락처는 32자 이하로 입력해 주세요." }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const now = new Date().toISOString();

    const { data: existing, error: selErr } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

    if (existing?.id) {
      const { error: updErr } = await admin
        .from("profiles")
        .update({
          nickname,
          phone: phone || null,
          updated_at: now,
        })
        .eq("id", user.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    } else {
      const { error: insErr } = await admin.from("profiles").insert({
        id: user.id,
        nickname,
        phone: phone || null,
        rating: 0,
        trade_count: 0,
        updated_at: now,
      });
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "프로필 저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

