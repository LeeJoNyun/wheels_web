/**
 * returnTo 쿼리 등에 쓸 내부 경로만 허용(오픈 리다이렉트 방지).
 */
export function safeReturnPath(candidate: string | undefined | null, fallback: string): string {
  if (candidate == null || typeof candidate !== "string") return fallback;
  try {
    const d = decodeURIComponent(candidate.trim());
    if (!d.startsWith("/") || d.startsWith("//")) return fallback;
    if (d.includes("://")) return fallback;
    return d;
  } catch {
    return fallback;
  }
}
