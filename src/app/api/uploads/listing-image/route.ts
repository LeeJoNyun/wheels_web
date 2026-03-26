import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mustEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function publicStorageUrl(supabaseUrl: string, bucket: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = mustEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRole = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
    const bucket = process.env.SUPABASE_LISTING_IMAGES_BUCKET?.trim() || "listing-images";

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const form = await req.formData();
    const file = form.get("image");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "image 파일이 필요합니다." }, { status: 400 });
    }

    // 기본 제한(너무 큰 파일 방지). 필요 시 조정
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "이미지는 8MB 이하만 업로드할 수 있습니다." }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `listings/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, bytes, {
      contentType: file.type || `image/${ext}`,
      upsert: false,
    });
    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    // public 버킷을 가정. private이면 signed URL 방식으로 바꿔야 함.
    const url = publicStorageUrl(supabaseUrl, bucket, path);
    return NextResponse.json({ url, path, bucket });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "업로드 실패" }, { status: 500 });
  }
}

