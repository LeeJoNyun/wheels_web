import { NextRequest, NextResponse } from "next/server";
import { countFilteredListings, parseListingFilters } from "@/lib/listing-filters";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 클라이언트 검색 UI에서 건수 조회용 (anon RLS 우회) */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const filters = parseListingFilters(sp);
    const supabase = createServiceRoleClient();
    const { count, error } = await countFilteredListings(supabase, filters);
    if (error) {
      return NextResponse.json({ error: error.message, count: 0 }, { status: 500 });
    }
    return NextResponse.json({ count: count ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "count failed", count: 0 }, { status: 500 });
  }
}
