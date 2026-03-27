import { notFound } from "next/navigation";
import Image from "next/image";
import { User } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ChatButton } from "@/components/listings/ChatButton";
import { ListingImageGallery } from "@/components/listings/ListingImageGallery";
import { BackToPreviousNav } from "@/components/listings/BackToPreviousNav";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { safeReturnPath } from "@/lib/internal-path";

export const dynamic = "force-dynamic";

type ListingRow = {
  id: string;
  user_id: string;
  status: string;
  price: number;
  mileage: number;
  accident: boolean;
  slip: boolean;
  tuning: boolean;
  document_status: string;
  description: string | null;
  maintenance_history: string | null;
  sell_reason: string | null;
  bike: { brand: string; model: string; year: number; engine_cc: number }[] | { brand: string; model: string; year: number; engine_cc: number } | null;
  listing_images: { url: string; sort_order: number }[] | null;
  listing_consumables: { tire: string | null; brake_pad: string | null; chain: string | null }[] | { tire: string | null; brake_pad: string | null; chain: string | null } | null;
};

function firstOf<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

function boolText(v: boolean) {
  return v ? "있음" : "없음";
}

function timeAgo(iso: string | undefined) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function formatReadableDescription(raw: string | null | undefined) {
  if (!raw) return "등록된 설명이 없습니다.";
  const normalized = raw.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const out: string[] = [];
  let inProductDescription = false;
  let productIndex = 1;
  let pendingSlipLine: string | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i].trimStart();
    line = line.replace(/^\d+-\d+\.\s*/, "");
    const trimmed = line.trim();
    if (trimmed === "") {
      if (!inProductDescription) out.push("");
      continue;
    }

    const oldSlipMatch = trimmed.match(/^5\.\s*사고\/슬립\s*여부:\s*(.*)$/);
    if (oldSlipMatch) {
      pendingSlipLine = `사고/슬립 여부: ${oldSlipMatch[1]?.trim() ?? "-"}`;
      continue;
    }

    const productMatch = trimmed.match(/^상품\s*설명:\s*(.*)$/);
    if (productMatch) {
      inProductDescription = true;
      productIndex = 1;
      out.push("5. 상품설명");
      const first = productMatch[1]?.trim();
      if (first) {
        out.push(`${productIndex}. ${first}`);
        productIndex += 1;
      }
      continue;
    }

    if (
      inProductDescription &&
      !/^(사고\/슬립\s*여부:|몇번째\s*차주:|특이사항:|기타:|튜닝\s*내역:|\d+\.\s)/.test(trimmed)
    ) {
      out.push(`${productIndex}. ${trimmed}`);
      productIndex += 1;
      continue;
    }

    if (inProductDescription && pendingSlipLine) {
      out.push(pendingSlipLine);
      pendingSlipLine = null;
    }

    inProductDescription = false;
    out.push(trimmed);
    if (/^\d+\.\s/.test(trimmed)) {
      const next = lines[i + 1]?.trim() ?? "";
      if (next !== "") out.push("");
    }
  }

  if (pendingSlipLine) out.push(pendingSlipLine);

  return out.join("\n");
}

type ParsedDescription = {
  region?: string;
  modelText?: string;
  yearText?: string;
  mileageText?: string;
  priceText?: string;
  negotiableText?: string;
  accidentSlipText?: string;
  ownerCount?: string;
  specialNotes?: string;
  miscNotes?: string;
  tuningItems: string[];
  photoComposition?: string;
  productDescriptionLines: string[];
};

function parseCafeDescription(raw: string | null | undefined): ParsedDescription {
  const parsed: ParsedDescription = {
    tuningItems: [],
    productDescriptionLines: [],
  };
  const text = formatReadableDescription(raw);
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let inProductDescription = false;

  for (const line of lines) {
    const clean = line.replace(/^\d+\.\s*/, "").trim();

    if (/^상품설명$/.test(clean) || /^상품\s*설명:?$/.test(clean)) {
      inProductDescription = true;
      continue;
    }
    if (/^(사고\/슬립\s*여부:|몇번째\s*차주:|특이사항:|기타:|튜닝\s*내역:|판매\s*희망가격:|흥정\s*가능\s*여부:|추가\s*옵션:)/.test(clean)) {
      inProductDescription = false;
    }

    const mRegion = clean.match(/^판매\s*지역:\s*(.*)$/);
    if (mRegion) {
      parsed.region = mRegion[1]?.trim();
      continue;
    }
    const mModel = clean.match(/^제작사\/모델명:\s*(.*)$/);
    if (mModel) {
      parsed.modelText = mModel[1]?.trim();
      continue;
    }
    const mYear = clean.match(/^제작연식:\s*(.*)$/);
    if (mYear) {
      parsed.yearText = mYear[1]?.trim();
      continue;
    }
    const mMileage = clean.match(/^적산거리:\s*(.*)$/);
    if (mMileage) {
      parsed.mileageText = mMileage[1]?.trim();
      continue;
    }
    const mAcc = clean.match(/^사고\/슬립\s*여부:\s*(.*)$/);
    if (mAcc) {
      parsed.accidentSlipText = mAcc[1]?.trim();
      continue;
    }
    const mOwner = clean.match(/^몇번째\s*차주:\s*(.*)$/);
    if (mOwner) {
      parsed.ownerCount = mOwner[1]?.trim();
      continue;
    }
    const mSpecial = clean.match(/^특이사항:\s*(.*)$/);
    if (mSpecial) {
      parsed.specialNotes = mSpecial[1]?.trim();
      continue;
    }
    const mMisc = clean.match(/^기타:\s*(.*)$/);
    if (mMisc) {
      parsed.miscNotes = mMisc[1]?.trim();
      continue;
    }
    const mTune = clean.match(/^튜닝\s*내역:\s*(.*)$/);
    if (mTune) {
      parsed.tuningItems = mTune[1]
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      continue;
    }
    const mPrice = clean.match(/^판매\s*희망가격:\s*(.*)$/);
    if (mPrice) {
      parsed.priceText = mPrice[1]?.trim();
      continue;
    }
    const mNegotiable = clean.match(/^흥정\s*가능\s*여부:\s*(.*)$/);
    if (mNegotiable) {
      parsed.negotiableText = mNegotiable[1]?.trim();
      continue;
    }
    if (/^사진\s+/.test(clean)) {
      parsed.photoComposition = clean;
      continue;
    }
    if (inProductDescription) {
      parsed.productDescriptionLines.push(clean.replace(/^\d+\.\s*/, "").trim());
    }
  }

  return parsed;
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabaseUser = await createClient();
  const {
    data: { user: sessionUser },
  } = await supabaseUser.auth.getUser();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      user_id,
      bike_id,
      price,
      mileage,
      accident,
      slip,
      tuning,
      original_parts,
      maintenance_history,
      document_status,
      description,
      sell_reason,
      status,
      created_at,
      updated_at,
      bike:bikes ( brand, model, year, engine_cc ),
      listing_images ( url, sort_order ),
      listing_consumables ( tire, brake_pad, chain )
    `
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) notFound();

  const listing = data as unknown as ListingRow;
  const isOwner = sessionUser?.id === listing.user_id;
  if (listing.status !== "active" && !isOwner) {
    notFound();
  }
  const bike = firstOf(listing.bike);
  const images = (listing.listing_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const consumables = firstOf(listing.listing_consumables);
  const parsed = parseCafeDescription(listing.description);
  let seller: { nickname: string | null; rating: number; trade_count: number } | null = null;
  let sellerAvatarUrl: string | null = null;
  const { data: sellerRow } = await supabase
    .from("profiles")
    .select("nickname,rating,trade_count")
    .eq("id", listing.user_id)
    .maybeSingle();
  if (sellerRow) {
    seller = sellerRow as { nickname: string | null; rating: number; trade_count: number };
  }
  const { data: sellerAuthData } = await supabase.auth.admin.getUserById(listing.user_id);
  sellerAvatarUrl =
    (sellerAuthData.user?.user_metadata?.avatar_url as string | undefined) ??
    (sellerAuthData.user?.user_metadata?.picture as string | undefined) ??
    null;

  const rawReturn = searchParams.returnTo;
  const returnToRaw = Array.isArray(rawReturn) ? rawReturn[0] : rawReturn;
  const backHref = safeReturnPath(returnToRaw, "/listings");
  const backVariant =
    backHref === "/"
      ? ("home" as const)
      : backHref.startsWith("/listings")
        ? ("search" as const)
        : ("default" as const);

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <BackToPreviousNav href={backHref} variant={backVariant} />

        {listing.status !== "active" && isOwner ? (
          <div
            className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p className="font-semibold">판매자 전용 보기</p>
            <p className="mt-1 text-amber-900/90">
              이 매물은 일반 검색에 노출되지 않습니다. (상태:{" "}
              {listing.status === "sold"
                ? "거래완료"
                : listing.status === "reserved"
                  ? "예약중"
                  : listing.status === "hidden"
                    ? "숨김"
                    : listing.status}
              )
            </p>
          </div>
        ) : null}

        <section className="mt-3 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-3">
            <ListingImageGallery images={images} />
            <div className="rounded-xl border bg-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full bg-gray-200">
                  {sellerAvatarUrl ? (
                    <Image src={sellerAvatarUrl} alt="판매자 프로필 이미지" fill sizes="44px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-500">
                      <User className="h-5 w-5" aria-hidden />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{seller?.nickname ?? "판매자"}</p>
                  <p className="text-sm text-gray-500">평점 {seller?.rating ?? 0} · 거래 {seller?.trade_count ?? 0}회</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{timeAgo((listing as any).created_at)}</span>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
              {bike ? `${bike.brand} ${bike.model}` : "매물"} {bike ? `(${bike.year})` : ""}
            </h1>
            <p className="mt-1 text-gray-500">스포츠/레저 · {timeAgo((listing as any).created_at)}</p>
            <p className="mt-4 text-4xl font-extrabold text-gray-900">{listing.price.toLocaleString()}원</p>
            <p className="mt-2 text-gray-700">{bike?.engine_cc?.toLocaleString()}cc · {listing.mileage.toLocaleString()}km</p>

            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-gray-50 p-3">사고 여부: <b>{boolText(listing.accident)}</b></div>
              <div className="rounded-lg bg-gray-50 p-3">슬립 여부: <b>{boolText(listing.slip)}</b></div>
              <div className="rounded-lg bg-gray-50 p-3">튜닝 여부: <b>{boolText(listing.tuning)}</b></div>
              <div className="rounded-lg bg-gray-50 p-3">서류 상태: <b>{listing.document_status}</b></div>
            </div>

            <div className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-2">소모품 상태</h2>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>타이어: {consumables?.tire ?? "-"}</li>
                <li>브레이크 패드: {consumables?.brake_pad ?? "-"}</li>
                <li>체인: {consumables?.chain ?? "-"}</li>
              </ul>
            </div>

            <div className="mt-6">
              <ChatButton listingId={listing.id} sellerId={listing.user_id} />
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-gray-950">상세 설명</h2>

          <div className="mb-4 rounded-xl border bg-gray-50 p-4">
            <p className="text-sm font-bold text-gray-600">요약</p>
            <p className="mt-1 text-lg font-extrabold text-gray-900">
              {bike ? `${bike.brand} ${bike.model}` : "매물"} / {bike?.year ?? "-"} /{" "}
              {listing.mileage.toLocaleString()}km
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-700">
              {listing.price.toLocaleString()}원 / 사고 {listing.accident ? "있음" : "없음"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                {listing.accident ? "⚪ 사고 있음" : "🟢 사고 없음"}
              </span>
              <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-700">
                {listing.mileage <= 20000 ? "🔥 저주행" : "일반 주행"}
              </span>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-yellow-800">
                {parsed.ownerCount ? `🟡 ${parsed.ownerCount}` : "🟡 차주 정보"}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-gray-800">
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-extrabold text-gray-950">📌 기본 정보</h3>
              <p className="mt-2">모델: {parsed.modelText ?? (bike ? `${bike.brand} ${bike.model}` : "-")}</p>
              <p>연식: {parsed.yearText ?? (bike ? `${bike.year}년` : "-")}</p>
              <p>주행거리: {parsed.mileageText ?? `${listing.mileage.toLocaleString()}km`}</p>
              <p>지역: {parsed.region ?? "-"}</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-extrabold text-gray-950">💰 가격 및 조건</h3>
              <p className="mt-2">희망가격: {parsed.priceText ?? `${listing.price.toLocaleString()}원`}</p>
              <p>흥정: {parsed.negotiableText?.includes("불가") ? "❌ 불가" : parsed.negotiableText ?? "-"}</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-extrabold text-gray-950">🛠 상태 및 특징</h3>
              {parsed.productDescriptionLines.length > 0 ? (
                parsed.productDescriptionLines.map((line, idx) => (
                  <p key={`desc-${idx}`} className="mt-2">{idx + 1}. {line}</p>
                ))
              ) : (
                <p className="mt-2">설명 없음</p>
              )}
              <p className="mt-2">사고 / 슬립: {parsed.accidentSlipText ?? `사고 ${boolText(listing.accident)} / 슬립 ${boolText(listing.slip)}`}</p>
              <p>차주: {parsed.ownerCount ?? "-"}</p>
              {listing.maintenance_history && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <h4 className="text-base font-bold text-gray-900">🧾 정비 이력</h4>
                  <p className="mt-1 whitespace-pre-wrap">{listing.maintenance_history}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-extrabold text-gray-950">🔧 튜닝 및 소모품</h3>
              {parsed.tuningItems.length > 0 ? (
                parsed.tuningItems.map((item, idx) => (
                  <p key={`tuning-${idx}`} className="mt-2">{item}</p>
                ))
              ) : (
                <p className="mt-2">튜닝 내역 없음</p>
              )}
              <p>타이어: {consumables?.tire ?? "-"}</p>
              <p>브레이크 패드: {consumables?.brake_pad ?? "-"}</p>
              <p>체인: {consumables?.chain ?? "-"}</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-extrabold text-gray-950">📸 사진 구성</h3>
              <p className="mt-2">{parsed.photoComposition ?? "-"}</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-extrabold text-gray-950">⚠️ 참고사항</h3>
              <p className="mt-2">{parsed.specialNotes ?? "-"}</p>
              {parsed.miscNotes ? <p>{parsed.miscNotes}</p> : null}
            </div>
          </div>

          {listing.sell_reason && (
            <div className="mt-4 rounded-xl border border-gray-200 p-4">
              <h3 className="text-lg font-extrabold text-gray-950">📉 판매 이유</h3>
              <p className="mt-2 whitespace-pre-wrap text-gray-800">{listing.sell_reason}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

