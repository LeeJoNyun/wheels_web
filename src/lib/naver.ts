/**
 * 네이버 로그인 애플리케이션 Client ID.
 * 네이버 개발자센터 → Application → Client ID 와 동일.
 *
 * Supabase는 네이버를 기본 OAuth 프로바이더로 제공하지 않아 /auth/naver 수동 플로우를 씁니다.
 */
export const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ?? "";
