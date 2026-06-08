import { z } from "zod";

export const WASH_LOG_TEXT_MAX_LENGTH = 80;
export const WASH_LOG_MEMO_MAX_LENGTH = 1000;
export const WASH_STEP_MEMO_MAX_LENGTH = 300;
export const WASH_STEP_MAX_COUNT = 20;
export const WASH_DURATION_MIN = 1;
export const WASH_DURATION_MAX = 1440;
export const WASH_COST_MIN = 0;
export const WASH_COST_MAX = 10000000;
export const WASH_RATING_MIN = 1;
export const WASH_RATING_MAX = 5;

const requiredText = (label: string, max = WASH_LOG_TEXT_MAX_LENGTH) =>
  z
    .string()
    .trim()
    .min(1, `${label}을 입력해 주세요.`)
    .max(max, `${label}은 ${max}자 이하로 입력해 주세요.`);

const optionalText = (label: string, max = WASH_LOG_TEXT_MAX_LENGTH) =>
  z
    .string()
    .trim()
    .max(max, `${label}은 ${max}자 이하로 입력해 주세요.`)
    .optional()
    .default("");

const rating = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label}을 숫자로 입력해 주세요.` })
    .int(`${label}은 정수로 입력해 주세요.`)
    .min(WASH_RATING_MIN, `${label}은 ${WASH_RATING_MIN} 이상으로 입력해 주세요.`)
    .max(WASH_RATING_MAX, `${label}은 ${WASH_RATING_MAX} 이하로 입력해 주세요.`);

const washStepSchema = z.object({
  stepType: requiredText("단계 유형", 60),
  productName: optionalText("제품명", 80),
  memo: optionalText("단계 메모", WASH_STEP_MEMO_MAX_LENGTH),
  stepOrder: z.coerce
    .number({ invalid_type_error: "단계 순서를 숫자로 입력해 주세요." })
    .int("단계 순서는 정수로 입력해 주세요.")
    .min(1, "단계 순서는 1 이상이어야 합니다."),
});

export const washLogFormSchema = z.object({
  carId: requiredText("차량"),
  title: requiredText("제목"),
  washDate: z
    .string()
    .trim()
    .min(1, "세차일을 입력해 주세요.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "유효한 세차일을 입력해 주세요."),
  location: optionalText("장소"),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "소요 시간을 숫자로 입력해 주세요." })
    .int("소요 시간은 정수로 입력해 주세요.")
    .min(WASH_DURATION_MIN, `소요 시간은 ${WASH_DURATION_MIN}분 이상이어야 합니다.`)
    .max(WASH_DURATION_MAX, `소요 시간은 ${WASH_DURATION_MAX}분 이하로 입력해 주세요.`),
  cost: z.coerce
    .number({ invalid_type_error: "비용을 숫자로 입력해 주세요." })
    .min(WASH_COST_MIN, "비용은 0 이상이어야 합니다.")
    .max(WASH_COST_MAX, `비용은 ${WASH_COST_MAX}원 이하로 입력해 주세요.`),
  weather: optionalText("날씨"),
  dirtLevel: rating("오염도"),
  satisfaction: rating("만족도"),
  memo: optionalText("메모", WASH_LOG_MEMO_MAX_LENGTH),
  visibility: z.enum(["private", "public"], {
    required_error: "공개 범위를 선택해 주세요.",
  }),
  steps: z
    .array(washStepSchema)
    .min(1, "세차 단계를 1개 이상 입력해 주세요.")
    .max(WASH_STEP_MAX_COUNT, `세차 단계는 ${WASH_STEP_MAX_COUNT}개 이하로 입력해 주세요.`),
});

export type WashLogFormValues = z.infer<typeof washLogFormSchema>;
