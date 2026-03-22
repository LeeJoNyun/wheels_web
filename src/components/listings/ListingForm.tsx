"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRANDS, DOCUMENT_STATUS_OPTIONS, CONSUMABLE_OPTIONS } from "@/types/database";

export function ListingForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bike, setBike] = useState({ brand: "", model: "", year: "", engine_cc: "" });
  const [price, setPrice] = useState("");
  const [mileage, setMileage] = useState("");
  const [accident, setAccident] = useState(false);
  const [slip, setSlip] = useState(false);
  const [tuning, setTuning] = useState(false);
  const [originalParts, setOriginalParts] = useState<boolean | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState("");
  const [documentStatus, setDocumentStatus] = useState<"폐지 완료" | "사용중 (이전 필요)" | "서류 없음">("폐지 완료");
  const [description, setDescription] = useState("");
  const [sellReason, setSellReason] = useState("");
  const [tire, setTire] = useState<"좋음" | "교체 필요" | "">("");
  const [brakePad, setBrakePad] = useState<"좋음" | "교체 필요" | "">("");
  const [chain, setChain] = useState<"좋음" | "교체 필요" | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login?next=/listings/new");
        return;
      }
      const yearNum = parseInt(bike.year, 10);
      const engineCcNum = parseInt(bike.engine_cc, 10);
      const priceNum = parseInt(price.replace(/,/g, ""), 10);
      const mileageNum = parseInt(mileage.replace(/,/g, ""), 10);
      if (!bike.brand || !bike.model || !yearNum || !engineCcNum || !priceNum || !mileageNum) {
        setError("제조사, 모델, 연식, 배기량, 주행거리, 가격을 입력해 주세요.");
        setLoading(false);
        return;
      }
      const { data: bikeRow, error: bikeErr } = await supabase
        .from("bikes")
        .insert({ brand: bike.brand, model: bike.model, year: yearNum, engine_cc: engineCcNum })
        .select("id")
        .single();
      if (bikeErr || !bikeRow) {
        setError(bikeErr?.message || "바이크 정보 저장 실패");
        setLoading(false);
        return;
      }
      const { data: listingRow, error: listErr } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          bike_id: bikeRow.id,
          price: priceNum,
          mileage: mileageNum,
          accident,
          slip,
          tuning,
          original_parts: originalParts ?? null,
          maintenance_history: maintenanceHistory || null,
          document_status: documentStatus,
          description: description || null,
          sell_reason: sellReason || null,
        })
        .select("id")
        .single();
      if (listErr || !listingRow) {
        setError(listErr?.message || "매물 등록 실패");
        setLoading(false);
        return;
      }
      if (tire || brakePad || chain) {
        await supabase.from("listing_consumables").insert({
          listing_id: listingRow.id,
          tire: tire || null,
          brake_pad: brakePad || null,
          chain: chain || null,
        });
      }
      router.push(`/listings/${listingRow.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">바이크 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제조사 *</label>
            <select
              required
              value={bike.brand}
              onChange={(e) => setBike((p) => ({ ...p, brand: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">선택</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">모델 *</label>
            <input
              type="text"
              required
              value={bike.model}
              onChange={(e) => setBike((p) => ({ ...p, model: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연식 *</label>
            <input
              type="number"
              required
              min="1990"
              max="2030"
              value={bike.year}
              onChange={(e) => setBike((p) => ({ ...p, year: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">배기량(cc) *</label>
            <input
              type="number"
              required
              min="50"
              value={bike.engine_cc}
              onChange={(e) => setBike((p) => ({ ...p, engine_cc: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">거래 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">판매 가격(원) *</label>
            <input
              type="text"
              required
              placeholder="예: 5000000"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주행거리(km) *</label>
            <input
              type="number"
              required
              min="0"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">서류 상태 *</label>
            <select
              value={documentStatus}
              onChange={(e) => setDocumentStatus(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {DOCUMENT_STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={accident} onChange={(e) => setAccident(e.target.checked)} />
            <span>사고 이력 있음</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={slip} onChange={(e) => setSlip(e.target.checked)} />
            <span>슬립 이력 있음</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={tuning} onChange={(e) => setTuning(e.target.checked)} />
            <span>튜닝 있음</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={originalParts === true} onChange={(e) => setOriginalParts(e.target.checked ? true : null)} />
            <span>순정 부품 보유</span>
          </label>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">정비 이력</label>
          <textarea
            value={maintenanceHistory}
            onChange={(e) => setMaintenanceHistory(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">소모품 상태</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">타이어</label>
            <select value={tire} onChange={(e) => setTire(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">선택</option>
              {CONSUMABLE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">브레이크 패드</label>
            <select value={brakePad} onChange={(e) => setBrakePad(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">선택</option>
              {CONSUMABLE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">체인</label>
            <select value={chain} onChange={(e) => setChain(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">선택</option>
              {CONSUMABLE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </section>
      <section>
        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" />
        <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">판매 이유</label>
        <textarea value={sellReason} onChange={(e) => setSellReason(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" />
      </section>
      <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50">
        {loading ? "등록 중..." : "매물 등록"}
      </button>
    </form>
  );
}
