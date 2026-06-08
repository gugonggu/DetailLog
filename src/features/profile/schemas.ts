import { z } from "zod";

export const PROFILE_NICKNAME_MIN_LENGTH = 2;
export const PROFILE_NICKNAME_MAX_LENGTH = 30;

export const profileFormSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(
      PROFILE_NICKNAME_MIN_LENGTH,
      `닉네임은 ${PROFILE_NICKNAME_MIN_LENGTH}자 이상 입력해 주세요.`,
    )
    .max(
      PROFILE_NICKNAME_MAX_LENGTH,
      `닉네임은 ${PROFILE_NICKNAME_MAX_LENGTH}자 이하로 입력해 주세요.`,
    ),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
