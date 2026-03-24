/**
 * wheels_api(Express)와 프로필 동기화.
 * `NEXT_PUBLIC_WHEELS_API_URL` 이 없으면 아무 것도 하지 않습니다.
 */
export async function syncProfileWithWheelsApi(accessToken: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_WHEELS_API_URL?.replace(/\/$/, "");
  if (!base) return;

  try {
    const res = await fetch(`${base}/auth/sync-profile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!res.ok && process.env.NODE_ENV === "development") {
      console.warn("[wheels-api] sync-profile:", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[wheels-api] sync-profile failed:", e);
    }
  }
}
