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
        primary: { DEFAULT: "#e63946", dark: "#c1121f" },
        secondary: { DEFAULT: "#457b9d", dark: "#1d3557" },
      },
    },
  },
  plugins: [],
} satisfies Config;
