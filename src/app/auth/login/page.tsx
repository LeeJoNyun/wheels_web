"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KAKAO_REST_API_KEY } from "@/lib/kakao";
import { NAVER_CLIENT_ID } from "@/lib/naver";
import { createClient } from "@/lib/supabase/client";

const PROVIDERS = [
  { 
    id: "kakao" as const, 
    label: "카카오 로그인", 
    bgColor: "bg-[#FEE500]", 
    textColor: "text-black",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.712 4.8 4.346 6.113l-.844 3.127c-.115.422.38.74.721.513l3.674-2.43c.36.05.73.077 1.103.077 4.97 0 9-3.186 9-7.115S16.97 3 12 3z" />
      </svg>
    )
  },
  { 
    id: "naver" as const, 
    label: "네이버 로그인", 
    bgColor: "bg-[#03C75A]", 
    textColor: "text-white",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
      </svg>
    )
  },
  { 
    id: "google" as const, 
    label: "Google 로그인", 
    bgColor: "bg-white", 
    textColor: "text-gray-700",
    border:
      "border-2 border-gray-300 shadow-sm hover:border-gray-400 hover:shadow-md",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    )
  },
];

/** OAuth 리다이렉트 오류 문자열이 잘못 인코딩된 경우 decodeURIComponent가 URIError를 내 페이지 전체를 깨뜨리지 않도록 처리 */
function decodeOAuthErrorMessage(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!errorParam) return;
    setError(
      errorParam === "no_code"
        ? "로그인 정보를 불러오지 못했습니다. 다시 시도해 주세요."
        : decodeOAuthErrorMessage(errorParam)
    );
  }, [errorParam]);

  const handleSocialLogin = async (provider: string) => {
    setError(null);
    setLoading(provider);
    try {
      if (provider === "kakao" && !KAKAO_REST_API_KEY) {
        setError("카카오 로그인 설정이 없습니다. NEXT_PUBLIC_KAKAO_REST_API_KEY를 확인해 주세요.");
        setLoading(null);
        return;
      }
      if (provider === "naver" && !NAVER_CLIENT_ID) {
        setError("네이버 로그인 설정이 없습니다. NEXT_PUBLIC_NAVER_CLIENT_ID를 확인해 주세요.");
        setLoading(null);
        return;
      }
      // Supabase 기본 카카오 OAuth는 account_email scope를 항상 넣어 KOE205가 날 수 있음 → OIDC 경로(/auth/kakao) 사용
      if (provider === "kakao") {
        window.location.href = "/auth/kakao";
        return;
      }
      if (provider === "naver") {
        window.location.href = "/auth/naver";
        return;
      }
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (err) {
        setError(err.message);
        setLoading(null);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setLoading(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "로그인 요청에 실패했습니다.");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/50">
          <Link
            href="/"
            aria-label="메인 페이지로 이동"
            className="flex justify-center mb-8 outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <img src="/logo.svg" alt="" className="h-11 sm:h-12 w-auto object-contain" />
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mb-2">간편로그인</h2>
          <p className="text-gray-400 text-sm mb-8">
            소셜계정으로 간편하게 로그인하세요.
          </p>

          <div className="space-y-3">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm mb-4 border border-red-100">
                {error}
              </div>
            )}
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                disabled={!!loading}
                onClick={() => handleSocialLogin(provider.id)}
                className={`w-full py-4 px-6 rounded-2xl font-bold transition-all flex items-center justify-between group active:scale-[0.98] ${
                  provider.bgColor
                } ${provider.textColor} ${provider.border || ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${provider.id === 'google' ? 'p-0.5' : ''}`}>
                    {provider.icon}
                  </div>
                  <span>{provider.label}</span>
                </div>
                {loading === provider.id ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-xs">
          © 2026 wheels. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">로딩 중...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
