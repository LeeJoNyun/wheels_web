import { loadEnvConfig } from "@next/env";

let envLoaded = false;

/** dev에서 워커/재컴파일 타이밍에 process.env가 비는 경우를 줄이기 위해 .env를 한 번 더 병합 */
function ensureEnvLoaded(): void {
  if (envLoaded) return;
  envLoaded = true;
  loadEnvConfig(process.cwd());
}

function readTrimmed(name: string): string | undefined {
  ensureEnvLoaded();
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;
  const t = raw.trim().replace(/^["']|["']$/g, "");
  return t.length > 0 ? t : undefined;
}

export function getKakaoClientSecret(): string | undefined {
  return readTrimmed("KAKAO_CLIENT_SECRET");
}

export function getNaverClientSecret(): string | undefined {
  return readTrimmed("NAVER_CLIENT_SECRET");
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return readTrimmed("SUPABASE_SERVICE_ROLE_KEY");
}
