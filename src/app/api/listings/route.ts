import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mustEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

type CreateListingBody = {
  bike: { brand: string; model: string; year: number; engine_cc: number };
  listing: {
    price: number;
    mileage: number;
    accident: boolean;
    slip: boolean;
    tuning: boolean;
    original_parts: boolean;
    maintenance_history: string | null;
    document_status: string;
    description: string | null;
    sell_reason: string | null;
    status?: string;
  };
  consumables?: { tire: string | null; brake_pad: string | null; chain: string | null } | null;
  images?: { url: string }[] | null;
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

    // 1) 토큰 검증 (anon client)
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

    const body = (await req.json()) as CreateListingBody;
    if (!body?.bike || !body?.listing) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 2) 실제 DB 쓰기 (service role)
    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const bike = body.bike;
    const { data: foundBike, error: findBikeErr } = await admin
      .from("bikes")
      .select("id")
      .eq("brand", bike.brand)
      .eq("model", bike.model)
      .eq("year", bike.year)
      .eq("engine_cc", bike.engine_cc)
      .limit(1)
      .maybeSingle();
    if (findBikeErr) return NextResponse.json({ error: findBikeErr.message }, { status: 500 });

    let bikeId = (foundBike as any)?.id as string | undefined;
    if (!bikeId) {
      const { data: createdBike, error: createBikeErr } = await admin
        .from("bikes")
        .insert({
          brand: bike.brand,
          model: bike.model,
          year: bike.year,
          engine_cc: bike.engine_cc,
        })
        .select("id")
        .single();
      if (createBikeErr) return NextResponse.json({ error: createBikeErr.message }, { status: 500 });
      bikeId = (createdBike as any).id;
    }

    const listing = body.listing;
    const { data: createdListing, error: createListingErr } = await admin
      .from("listings")
      .insert({
        user_id: user.id,
        bike_id: bikeId,
        price: listing.price,
        mileage: listing.mileage,
        accident: listing.accident,
        slip: listing.slip,
        tuning: listing.tuning,
        original_parts: listing.original_parts,
        maintenance_history: listing.maintenance_history,
        document_status: listing.document_status,
        description: listing.description,
        sell_reason: listing.sell_reason,
        status: listing.status || "active",
      })
      .select("id")
      .single();
    if (createListingErr) return NextResponse.json({ error: createListingErr.message }, { status: 500 });

    const listingId = (createdListing as any).id as string;

    if (body.consumables && (body.consumables.tire || body.consumables.brake_pad || body.consumables.chain)) {
      const { error: conErr } = await admin.from("listing_consumables").upsert({
        listing_id: listingId,
        tire: body.consumables.tire,
        brake_pad: body.consumables.brake_pad,
        chain: body.consumables.chain,
      });
      if (conErr) return NextResponse.json({ error: conErr.message }, { status: 500 });
    }

    const imageUrls = (body.images ?? []).map((x) => x?.url).filter((u): u is string => typeof u === "string" && u.startsWith("http"));
    if (imageUrls.length > 0) {
      const payload = imageUrls.map((url, idx) => ({ listing_id: listingId, url, sort_order: idx }));
      const { error: imgErr } = await admin.from("listing_images").insert(payload);
      if (imgErr) return NextResponse.json({ error: imgErr.message }, { status: 500 });
    }

    return NextResponse.json({ id: listingId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "등록 실패" }, { status: 500 });
  }
}

