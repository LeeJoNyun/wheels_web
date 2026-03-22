"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

type TargetType = "listing" | "user" | "chat";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: TargetType;
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: reason || null,
    });
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    setDone(true);
    setOpen(false);
  };

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
      >
        신고
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-3">신고하기</h3>
            {done ? (
              <p className="text-gray-600">신고가 접수되었습니다.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="신고 사유 (선택)"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3 py-1.5 border rounded-lg"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? "처리 중..." : "제출"}
                  </button>
                </div>
              </form>
            )}
            {done && (
              <button
                type="button"
                onClick={() => { setDone(false); setOpen(false); }}
                className="mt-3 text-primary"
              >
                닫기
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
