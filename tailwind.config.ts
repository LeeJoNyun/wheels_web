import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /** Premium Heritage — 메인 오렌지 */
        primary: { DEFAULT: "#FF8A00", dark: "#E57400" },
        /** 포인트 다크 차콜 */
        secondary: { DEFAULT: "#2D3436", dark: "#1e2123" },
        brand: {
          DEFAULT: "#FF8A00",
          dark: "#E57400",
          /** CTA 버튼 (매물 등록 등) */
          button: "#FF7A00",
          "button-hover": "#E56E00",
          charcoal: "#2D3436",
        },
        surface: "#F9FAFB",
        /** 마이페이지 등 대시보드 배경 */
        dashboard: "#F5F7FA",
        ink: "#333333",
      },
    },
  },
  plugins: [],
} satisfies Config;
