import { z } from "zod";

export const CAR_TEXT_MIN_LENGTH = 1;
export const CAR_TEXT_MAX_LENGTH = 60;
export const CAR_MEMO_MAX_LENGTH = 500;
export const CAR_YEAR_MIN = 1886;
export const CAR_YEAR_MAX = new Date().getFullYear() + 1;

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(CAR_TEXT_MIN_LENGTH, `${label}을 입력해 주세요.`)
    .max(CAR_TEXT_MAX_LENGTH, `${label}은 ${CAR_TEXT_MAX_LENGTH}자 이하로 입력해 주세요.`);

export const carFormSchema = z.object({
  name: requiredText("차량 이름"),
  brand: requiredText("브랜드"),
  model: requiredText("모델"),
  year: z.coerce
    .number({
      invalid_type_error: "연식을 숫자로 입력해 주세요.",
    })
    .int("연식은 정수로 입력해 주세요.")
    .min(CAR_YEAR_MIN, `연식은 ${CAR_YEAR_MIN}년 이후로 입력해 주세요.`)
    .max(CAR_YEAR_MAX, `연식은 ${CAR_YEAR_MAX}년 이하로 입력해 주세요.`),
  color: requiredText("색상"),
  coatingType: requiredText("코팅 타입"),
  memo: z
    .string()
    .trim()
    .max(CAR_MEMO_MAX_LENGTH, `메모는 ${CAR_MEMO_MAX_LENGTH}자 이하로 입력해 주세요.`)
    .optional()
    .default(""),
});

export type CarFormValues = z.infer<typeof carFormSchema>;
