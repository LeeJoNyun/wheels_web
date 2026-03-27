/** @param {string | undefined} url */
function supabaseHostname(url) {
  try {
    if (!url) return null;
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const supabaseHost =
  supabaseHostname(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? "oiheaqahghorrtljlbwo.supabase.co";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "k.kakaocdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "phinf.pstatic.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
