"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, GripVertical, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ConsumableStatus, DocumentStatus } from "@/types/database";
import {
  getReitwagenBrandLogo,
  getReitwagenModelsByBrand,
  REITWAGEN_BRAND_OPTIONS,
} from "@/lib/reitwagen-brands";

type FormState = {
  brand: string;
  model: string;
  year: string;
  engine_cc: string;
  /** 만원 단위 입력(카페 양식 호환) */
  price_manwon: string;
  mileage: string;
  region: string;
  negotiable: "가능" | "불가";
  trade_options: string;
  product_description: string;
  owner_count: string;
  special_notes: string;
  other_notes: string;
  tuning_items: string[];
  tuning_custom: string;
  title: string;
  description: string;
  accident: boolean;
  slip: boolean;
  tuning: boolean;
  original_parts: boolean;
  maintenance_history: string;
  sell_reason: string;
  document_status: DocumentStatus;
  tire: ConsumableStatus | "";
  brake_pad: ConsumableStatus | "";
  chain: ConsumableStatus | "";
};

type UploadedImage = {
  id: string;
  url: string;
};

const INITIAL: FormState = {
  brand: "",
  model: "",
  year: "",
  engine_cc: "",
  price_manwon: "",
  mileage: "",
  region: "",
  negotiable: "가능",
  trade_options: "",
  product_description: "",
  owner_count: "",
  special_notes: "",
  other_notes: "",
  tuning_items: [],
  tuning_custom: "",
  title: "",
  description: "",
  accident: false,
  slip: false,
  tuning: false,
  original_parts: false,
  maintenance_history: "",
  sell_reason: "",
  document_status: "사용중 (이전 필요)",
  tire: "",
  brake_pad: "",
  chain: "",
};

const TUNING_OPTIONS = [
  "머플러",
  "ECU",
  "서스펜션",
  "브레이크",
  "휠/타이어",
  "핸들/레버",
  "외관(카울/도색)",
  "등화류",
] as const;

function formatWithComma(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  const n = Number(digits);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("ko-KR");
}

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function ListingForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const modelOptions = useMemo(() => getReitwagenModelsByBrand(form.brand), [form.brand]);
  const selectedBrandLogo = useMemo(() => getReitwagenBrandLogo(form.brand), [form.brand]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTuningItem = (item: string) => {
    setForm((prev) => {
      const has = prev.tuning_items.includes(item);
      return {
        ...prev,
        tuning_items: has ? prev.tuning_items.filter((x) => x !== item) : [...prev.tuning_items, item],
      };
    });
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setMsg("");
    setUploading(true);
    try {
      const uploaded: UploadedImage[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("image", file);
        const res = await fetch("/api/uploads/listing-image", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "이미지 업로드 실패");
        if (typeof data?.url === "string" && data.url) {
          uploaded.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            url: data.url,
          });
        }
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (e: any) {
      setMsg(e?.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((x) => x.id !== id));
  };

  const moveImage = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    setImages((prev) => {
      const from = prev.findIndex((x) => x.id === draggingId);
      const to = prev.findIndex((x) => x.id === targetId);
      if (from < 0 || to < 0) return prev;
      return reorder(prev, from, to);
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");

    if (!form.brand || !form.model || !form.year || !form.engine_cc || !form.price_manwon || !form.mileage) {
      setMsg("필수 항목을 모두 입력해주세요.");
      return;
    }

    const year = Number(form.year);
    const engineCC = Number(form.engine_cc);
    const priceManwon = Number(form.price_manwon);
    const price = Math.round(priceManwon * 10000);
    const mileage = Number(form.mileage);
    if ([year, engineCC, priceManwon, mileage].some((x) => Number.isNaN(x) || x < 0)) {
      setMsg("연식/배기량/가격/주행거리는 0 이상 숫자로 입력해주세요.");
      return;
    }
    if (!form.title.trim()) {
      setMsg("제목을 입력해주세요.");
      return;
    }
    if (!form.product_description.trim()) {
      setMsg("상품 설명을 입력해주세요.");
      return;
    }

    const tuningText = [
      ...form.tuning_items,
      ...(form.tuning_custom.trim() ? [form.tuning_custom.trim()] : []),
    ].join(", ");

    const cafeBlock = [
      `1. 판매 지역: ${form.region.trim() || "-"}`,
      `2. 제작사/모델명: ${`${form.brand.trim()} ${form.model.trim()}`.trim() || "-"}`,
      `3. 제작연식: ${year || "-"}`,
      `4. 적산거리: ${mileage ? `${mileage.toLocaleString()}km` : "-"}`,
      `5. 사고/슬립 여부: 사고 ${form.accident ? "있음" : "없음"} / 슬립 ${form.slip ? "있음" : "없음"}`,
      `5-1. 상품 설명: ${form.product_description.trim() || "-"}`,
      `5-2. 몇번째 차주: ${form.owner_count.trim() || "-"}`,
      `5-3. 특이사항: ${form.special_notes.trim() || "-"}`,
      `5-4. 기타: ${form.other_notes.trim() || "-"}`,
      `5-5. 튜닝 내역: ${tuningText || "없음"}`,
      `6. 판매 희망가격: ${priceManwon ? `${priceManwon.toLocaleString()}만원` : "-"}`,
      `7. 흥정 가능 여부: ${form.negotiable}`,
      form.trade_options.trim() ? `7-1. 추가 옵션: ${form.trade_options.trim()}` : "",
      "",
    ]
      .filter(Boolean)
      .join("\n");
    const composedDescription = `${cafeBlock}\n${(form.description || "").trim()}`.trim();

    setSubmitting(true);
    try {
      const {
        data: { session },
        error: sessErr,
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (sessErr || !token) {
        setMsg("로그인이 필요합니다.");
        setSubmitting(false);
        return;
      }
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bike: {
            brand: form.brand.trim(),
            model: form.model.trim(),
            year,
            engine_cc: engineCC,
          },
          listing: {
            price,
            mileage,
            accident: form.accident,
            slip: form.slip,
            tuning: form.tuning || form.tuning_items.length > 0 || Boolean(form.tuning_custom.trim()),
            original_parts: form.original_parts,
            maintenance_history: form.maintenance_history || null,
            document_status: form.document_status,
            description: composedDescription || null,
            sell_reason: form.sell_reason || null,
            status: "active",
          },
          consumables: {
            tire: form.tire || null,
            brake_pad: form.brake_pad || null,
            chain: form.chain || null,
          },
          images: images.map((x) => ({ url: x.url })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "매물 등록에 실패했습니다.");

      setMsg("매물이 등록되었습니다.");
      setForm(INITIAL);
      setImages([]);
      router.push("/listings?run=1");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message || "매물 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">사진</h2>
          <span className="text-sm text-gray-500">{images.length}/10</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100">
            <Camera className="h-6 w-6" />
            <span className="mt-1 text-xs">{uploading ? "업로드중" : "사진추가"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading || submitting || images.length >= 10}
              onChange={(e) => void uploadImages(e.target.files)}
              className="hidden"
            />
          </label>

          {images.map((img, idx) => (
            <div
              key={img.id}
              className="group relative h-24 w-24 overflow-hidden rounded-xl border bg-white"
              draggable
              onDragStart={() => setDraggingId(img.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => moveImage(img.id)}
              onDragEnd={() => setDraggingId(null)}
            >
              <Image src={img.url} alt={`업로드 이미지 ${idx + 1}`} fill className="object-cover" sizes="96px" />
              <div className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {idx + 1}
              </div>
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute right-1 top-1 rounded-full bg-black/65 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="이미지 제거"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/45 py-0.5 text-white">
                <GripVertical className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">사진을 드래그해서 순서를 바꿀 수 있습니다. 첫 번째 사진이 대표 이미지로 사용됩니다.</p>
      </section>

      <section className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-gray-900">제목 *</span>
          <input
            className="w-full rounded-xl border px-3 py-3 placeholder:text-gray-400"
            placeholder="예: BMW S1000RR 22년식 / 무사고 / 850만원"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-gray-900">추가 설명</span>
          <textarea
            rows={5}
            className="w-full rounded-xl border px-3 py-3 placeholder:text-gray-400"
            placeholder="위 항목 외 강조하고 싶은 내용을 자유롭게 입력하세요."
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-semibold">판매 지역 *</span>
          <input
            className="w-full rounded-xl border px-3 py-3"
            placeholder="예: 경기 안산"
            value={form.region}
            onChange={(e) => setField("region", e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">제조사 *</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setBrandOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left"
            >
              <span className="flex min-w-0 items-center gap-2">
                {selectedBrandLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedBrandLogo} alt="" className="h-5 w-5 shrink-0 rounded-full border object-cover" />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border bg-gray-100" />
                )}
                <span className={`truncate ${form.brand ? "text-gray-900" : "text-gray-500"}`}>
                  {form.brand || "제조사 선택"}
                </span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${brandOpen ? "rotate-180" : ""}`} />
            </button>
            {brandOpen ? (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, brand: "", model: "" }));
                    setBrandOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
                >
                  <span className="h-5 w-5 rounded-full border bg-gray-100" />
                  제조사 선택 해제
                </button>
                {REITWAGEN_BRAND_OPTIONS.map((brand) => (
                  <button
                    type="button"
                    key={brand.brandName}
                    onClick={() => {
                      const nextBrand = brand.brandName;
                      const nextModels = getReitwagenModelsByBrand(nextBrand);
                      setForm((prev) => ({
                        ...prev,
                        brand: nextBrand,
                        model: nextModels.includes(prev.model) ? prev.model : "",
                      }));
                      setBrandOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    {brand.logoImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brand.logoImageUrl} alt="" className="h-5 w-5 shrink-0 rounded-full border object-cover" />
                    ) : (
                      <span className="h-5 w-5 shrink-0 rounded-full border bg-gray-100" />
                    )}
                    <span className="truncate">{brand.brandName}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">모델명 *</span>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border px-3 py-3 pr-10"
              value={form.model}
              onChange={(e) => setField("model", e.target.value)}
              disabled={!form.brand}
            >
              <option value="">{form.brand ? "모델 선택" : "먼저 제조사를 선택하세요"}</option>
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">연식 *</span>
          <input type="number" className="w-full rounded-xl border px-3 py-3" value={form.year} onChange={(e) => setField("year", e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">배기량(cc) *</span>
          <input type="number" className="w-full rounded-xl border px-3 py-3" value={form.engine_cc} onChange={(e) => setField("engine_cc", e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">주행거리(km) *</span>
          <input type="number" className="w-full rounded-xl border px-3 py-3" value={form.mileage} onChange={(e) => setField("mileage", e.target.value)} />
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-gray-900">가격</h3>
        <label className="text-sm block">
          <input
            className="w-full rounded-xl border px-3 py-3 text-lg"
            placeholder="₩ 가격을 입력해주세요. (만원 단위)"
            inputMode="numeric"
            value={formatWithComma(form.price_manwon)}
            onChange={(e) => setField("price_manwon", e.target.value.replace(/[^\d]/g, ""))}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-semibold">흥정 가능 여부</span>
            <select
              className="w-full rounded-xl border px-3 py-3"
              value={form.negotiable}
              onChange={(e) => setField("negotiable", e.target.value as FormState["negotiable"])}
            >
              <option value="가능">가능</option>
              <option value="불가">불가</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">추가 옵션(자유)</span>
            <input
              className="w-full rounded-xl border px-3 py-3"
              placeholder="예: 대차 가능, 추가금 협의"
              value={form.trade_options}
              onChange={(e) => setField("trade_options", e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.accident} onChange={(e) => setField("accident", e.target.checked)} />
          사고 있음
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.slip} onChange={(e) => setField("slip", e.target.checked)} />
          슬립 있음
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.tuning || form.tuning_items.length > 0 || Boolean(form.tuning_custom.trim())}
            onChange={(e) => setField("tuning", e.target.checked)}
          />
          튜닝 있음
        </label>
      </section>

      <section className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">상품 설명 *</span>
          <textarea
            rows={3}
            className="w-full rounded-xl border px-3 py-3"
            placeholder="차량 상태를 핵심 위주로 작성해 주세요. (예: 외관 상태, 주요 정비 상태)"
            value={form.product_description}
            onChange={(e) => setField("product_description", e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">정비 이력</span>
          <textarea
            rows={3}
            className="w-full rounded-xl border px-3 py-3"
            value={form.maintenance_history}
            onChange={(e) => setField("maintenance_history", e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block font-semibold">몇번째 차주</span>
            <input
              className="w-full rounded-xl border px-3 py-3"
              placeholder="예: 2차주"
              value={form.owner_count}
              onChange={(e) => setField("owner_count", e.target.value)}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold">특이사항</span>
            <input
              className="w-full rounded-xl border px-3 py-3"
              placeholder="예: 엔진 누유 없음, 최근 소모품 교체"
              value={form.special_notes}
              onChange={(e) => setField("special_notes", e.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">기타</span>
          <input
            className="w-full rounded-xl border px-3 py-3"
            placeholder="예: 실물 보시면 상태 좋습니다."
            value={form.other_notes}
            onChange={(e) => setField("other_notes", e.target.value)}
          />
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">서류 상태 *</span>
          <select className="w-full rounded-xl border px-3 py-3" value={form.document_status} onChange={(e) => setField("document_status", e.target.value as DocumentStatus)}>
            <option value="폐지 완료">폐지 완료</option>
            <option value="사용중 (이전 필요)">사용중 (이전 필요)</option>
            <option value="서류 없음">서류 없음</option>
          </select>
        </label>
        <div className="text-xs text-gray-500 sm:pt-7">순정 부품 보유 여부는 아래 상품 설명/기타에 자유롭게 적어주세요.</div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-gray-900">튜닝 항목</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {TUNING_OPTIONS.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.tuning_items.includes(item)} onChange={() => toggleTuningItem(item)} />
              {item}
            </label>
          ))}
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">기타 튜닝(직접 입력)</span>
          <input
            className="w-full rounded-xl border px-3 py-3"
            placeholder="예: 프레임 슬라이더, 퀵시프터"
            value={form.tuning_custom}
            onChange={(e) => setField("tuning_custom", e.target.value)}
          />
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">타이어</span>
          <select className="w-full rounded-xl border px-3 py-3" value={form.tire} onChange={(e) => setField("tire", e.target.value as ConsumableStatus | "")}>
            <option value="">선택 안함</option>
            <option value="좋음">좋음</option>
            <option value="교체 필요">교체 필요</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">브레이크 패드</span>
          <select className="w-full rounded-xl border px-3 py-3" value={form.brake_pad} onChange={(e) => setField("brake_pad", e.target.value as ConsumableStatus | "")}>
            <option value="">선택 안함</option>
            <option value="좋음">좋음</option>
            <option value="교체 필요">교체 필요</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">체인</span>
          <select className="w-full rounded-xl border px-3 py-3" value={form.chain} onChange={(e) => setField("chain", e.target.value as ConsumableStatus | "")}>
            <option value="">선택 안함</option>
            <option value="좋음">좋음</option>
            <option value="교체 필요">교체 필요</option>
          </select>
        </label>
      </section>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold">판매 이유</span>
        <textarea rows={2} className="w-full rounded-xl border px-3 py-3" value={form.sell_reason} onChange={(e) => setField("sell_reason", e.target.value)} />
      </label>


      <div className="sticky bottom-0 -mx-4 sm:mx-0 border-t bg-white/95 backdrop-blur px-4 py-3 sm:px-0 sm:border-0 sm:bg-transparent">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full rounded-lg bg-brand-button px-5 py-3.5 text-lg font-bold text-white hover:bg-brand-button-hover disabled:opacity-60"
        >
          {submitting ? "등록 중..." : "작성 완료"}
        </button>
        {uploading && <p className="mt-2 text-sm text-gray-600">이미지 업로드 중...</p>}
        {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
      </div>
    </form>
  );
}
