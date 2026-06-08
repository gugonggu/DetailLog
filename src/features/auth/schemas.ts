import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

export const loginSchema = z.object({
  email: z.string().trim().email("올바른 이메일을 입력해 주세요."),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`),
});

export const signupSchema = loginSchema.extend({
  nickname: z
    .string()
    .trim()
    .min(2, "닉네임은 2자 이상 입력해 주세요.")
    .max(30, "닉네임은 30자 이하로 입력해 주세요."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;

export function createSignupProfileMetadata(nickname: string) {
  return {
    nickname: nickname.trim(),
  };
}

export function getLoginRedirectPath(redirectedFrom: string | null) {
  if (!redirectedFrom) {
    return "/dashboard";
  }

  if (!redirectedFrom.startsWith("/") || redirectedFrom.startsWith("//")) {
    return "/dashboard";
  }

  return redirectedFrom;
}
