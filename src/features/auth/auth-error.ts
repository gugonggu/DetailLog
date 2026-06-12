import { SUPABASE_NETWORK_ERROR_MESSAGE } from "@/lib/supabase/fetch";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Email not confirmed":
    "이메일 인증이 완료되지 않았습니다. 받은 메일의 인증 링크를 확인해 주세요.",
  "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "Failed to fetch":
    "인증 서버에 연결할 수 없습니다. Supabase 프로젝트 상태와 환경 변수를 확인해 주세요.",
  "email rate limit exceeded":
    "인증 메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
  [SUPABASE_NETWORK_ERROR_MESSAGE]:
    "인증 서버에 연결할 수 없습니다. Supabase 프로젝트 상태와 환경 변수를 확인해 주세요.",
};

export function getAuthErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "인증 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

  return AUTH_ERROR_MESSAGES[message] ?? message;
}
