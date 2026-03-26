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
    ],
  },
};

export default nextConfig;
