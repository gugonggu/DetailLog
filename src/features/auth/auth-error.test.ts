import { describe, expect, it } from "vitest";

import { getAuthErrorMessage } from "./auth-error";

describe("getAuthErrorMessage", () => {
  it("explains invalid login credentials in Korean", () => {
    expect(getAuthErrorMessage("Invalid login credentials")).toBe(
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );
  });

  it("explains common signup restrictions in Korean", () => {
    expect(getAuthErrorMessage("email rate limit exceeded")).toBe(
      "인증 메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
    );
    expect(getAuthErrorMessage("Email not confirmed")).toBe(
      "이메일 인증이 완료되지 않았습니다. 받은 메일의 인증 링크를 확인해 주세요.",
    );
  });

  it("explains network failures as a Supabase connection problem", () => {
    expect(getAuthErrorMessage("Failed to fetch")).toBe(
      "인증 서버에 연결할 수 없습니다. Supabase 프로젝트 상태와 환경 변수를 확인해 주세요.",
    );
    expect(getAuthErrorMessage(new TypeError("Failed to fetch"))).toBe(
      "인증 서버에 연결할 수 없습니다. Supabase 프로젝트 상태와 환경 변수를 확인해 주세요.",
    );
  });

  it("explains the shared Supabase network error", () => {
    expect(
      getAuthErrorMessage(
        "Supabase 서버에 연결할 수 없습니다. 프로젝트 URL과 네트워크 상태를 확인해 주세요.",
      ),
    ).toBe(
      "인증 서버에 연결할 수 없습니다. Supabase 프로젝트 상태와 환경 변수를 확인해 주세요.",
    );
  });

  it("keeps unknown Supabase errors visible", () => {
    expect(getAuthErrorMessage("Unknown auth error")).toBe("Unknown auth error");
  });
});
