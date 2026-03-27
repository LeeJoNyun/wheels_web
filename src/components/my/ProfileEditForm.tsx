"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  provider: string;
  initialAvatarUrl: string | null;
  initialNickname: string | null;
  initialPhone: string | null;
};

function providerLabel(provider: string) {
  if (provider === "kakao") return "카카오";
  if (provider === "google") return "구글";
  if (provider === "naver") return "네이버";
  return "이메일";
}

function providerBadgeClass(provider: string) {
  if (provider === "kakao") return "bg-[#FEE500] text-[#191600]";
  if (provider === "google") return "bg-[#e8f0fe] text-[#1a73e8]";
  if (provider === "naver") return "bg-[#03C75A]/15 text-[#03A64A]";
  return "bg-gray-100 text-gray-700";
}

async function toResizedDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 처리하지 못했습니다."));
    img.src = dataUrl;
  });

  const max = 512;
  const ratio = Math.min(1, max / Math.max(image.width, image.height));
  const w = Math.max(1, Math.round(image.width * ratio));
  const h = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 변환을 시작할 수 없습니다.");
  ctx.drawImage(image, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export function ProfileEditForm({
  provider,
  initialAvatarUrl,
  initialNickname,
  initialPhone,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nickname, setNickname] = useState(initialNickname?.trim() ?? "");
  const [phone, setPhone] = useState(initialPhone?.trim() ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerName = providerLabel(provider);

  async function handleAvatarPick(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("이미지 파일은 8MB 이하로 업로드해 주세요.");
      return;
    }
    try {
      setError(null);
      const resized = await toResizedDataUrl(file);
      setAvatarUrl(resized);
      setAvatarChanged(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지를 처리하지 못했습니다.");
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nn = nickname.trim();
    if (!nn) {
      setError("닉네임을 입력해 주세요.");
      return;
    }
    if (nn.length > 64) {
      setError("닉네임은 64자 이하로 입력해 주세요.");
      return;
    }

    const ph = phone.trim();
    if (ph.length > 32) {
      setError("연락처는 32자 이하로 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (avatarChanged) {
        const { error: authErr } = await supabase.auth.updateUser({
          data: {
            avatar_url: avatarUrl || null,
          },
        });
        if (authErr) {
          setError(authErr.message || "프로필 이미지를 저장하지 못했습니다.");
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("로그인 세션을 확인하지 못했습니다. 다시 로그인해 주세요.");
        return;
      }

      const res = await fetch("/api/my/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nickname: nn,
          phone: ph || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error || "저장에 실패했습니다.");
        return;
      }

      router.push("/my?updated=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-xl border border-gray-100 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">프로필 이미지</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="프로필 이미지" fill sizes="64px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl text-gray-400">🙂</div>
            )}
          </div>
          <div className="space-y-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void handleAvatarPick(file);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              이미지 변경
            </button>
            <p className="text-xs text-gray-500">SNS 이미지 또는 업로드한 이미지가 표시됩니다.</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">계정 연결 정보</h2>
        <div className="mt-3 flex items-center gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${providerBadgeClass(provider)}`}>
            {providerName}
          </span>
          <p className="text-sm text-gray-700">{providerName} 계정으로 로그인 중</p>
        </div>
        <p className="mt-2 text-xs text-gray-500">SNS 로그인 전용 서비스라 이메일은 별도 수정 항목을 제공하지 않습니다.</p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            로그아웃
          </button>
        </div>
      </section>

      <div>
        <label htmlFor="profile-nickname" className="mb-1 block text-sm font-medium text-gray-700">
          닉네임 <span className="text-red-600">*</span>
        </label>
        <input
          id="profile-nickname"
          type="text"
          name="nickname"
          autoComplete="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={64}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          placeholder="표시될 닉네임"
        />
      </div>

      <div>
        <label htmlFor="profile-phone" className="mb-1 block text-sm font-medium text-gray-700">
          연락처
        </label>
        <input
          id="profile-phone"
          type="tel"
          name="phone"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={32}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          placeholder="010-0000-0000 (선택)"
        />
        <p className="mt-1 text-xs text-gray-500">거래 시 상대에게 공개 여부는 서비스 정책에 따릅니다.</p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="pt-1">
        <Link href="/help?topic=withdraw" className="text-xs text-gray-400 hover:text-gray-500 hover:underline">
          회원 탈퇴 문의
        </Link>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <Link
          href="/my"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-brand-button px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-button-hover disabled:opacity-60"
        >
          {loading ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
