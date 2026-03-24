/**
 * 카카오 REST API 키 (= OAuth Client ID).
 * Supabase Auth → Providers → Kakao 의 Client ID에도 동일 값을 넣어야 합니다.
 *
 * 로그인 플로우: /auth/kakao (OIDC, account_email 미요청 — KOE205 회피).
 * 서버에 KAKAO_CLIENT_SECRET 필요. 카카오 콘솔 Redirect URI에 /auth/kakao/callback 등록 및 OpenID Connect 활성화.
 */
export const KAKAO_REST_API_KEY =
  process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY ?? "";
