import Link from "next/link";
import { Header } from "@/components/layout/Header";

export const metadata = {
  title: "고객 센터 — 휠스",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dashboard">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold text-ink">고객 센터</h1>
        <p className="mt-2 text-sm text-gray-600">문의 및 서비스 안내입니다.</p>
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">문의</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            서비스 이용 중 불편이 있으시면 앱 내 채팅 또는 이메일로 연락해 주세요. (운영 시간 및 답변은 정책에 따라
            안내됩니다.)
          </p>
        </div>
        <p className="mt-8 text-center">
          <Link href="/my" className="text-sm font-medium text-brand hover:underline">
            마이페이지로 돌아가기
          </Link>
        </p>
      </main>
    </div>
  );
}
