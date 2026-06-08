import { z } from "zod";

export const ROUTINE_TEXT_MAX_LENGTH = 120;
export const ROUTINE_LONG_TEXT_MAX_LENGTH = 700;
export const ROUTINE_LIST_MAX_COUNT = 12;
export const ROUTINE_STEP_MAX_COUNT = 12;
export const ROUTINE_TARGET_TIME_MIN = 15;
export const ROUTINE_TARGET_TIME_MAX = 240;

const text = (label: string, max = ROUTINE_TEXT_MAX_LENGTH) =>
  z
    .string()
    .trim()
    .min(1, `${label}을 입력해 주세요.`)
    .max(max, `${label}은 ${max}자 이하로 입력해 주세요.`);

const listText = z
  .array(z.string().trim().max(ROUTINE_TEXT_MAX_LENGTH))
  .default([])
  .transform((items) => items.filter(Boolean))
  .pipe(z.array(z.string()).max(ROUTINE_LIST_MAX_COUNT));

export const routineEnvironmentSchema = z.enum([
  "home",
  "self_wash_bay",
  "professional_bay",
  "outdoor",
]);

export const routineExperienceLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const routineDifficultySchema = z.enum(["easy", "normal", "hard"]);

export const routineInputSchema = z
  .object({
    carId: text("차량"),
    carColor: text("차량 색상"),
    coatingType: text("코팅 상태"),
    dirtLevel: z.coerce
      .number({ invalid_type_error: "오염도는 숫자로 입력해 주세요." })
      .int("오염도는 정수로 입력해 주세요.")
      .min(1, "오염도는 1 이상이어야 합니다.")
      .max(5, "오염도는 5 이하이어야 합니다."),
    environment: routineEnvironmentSchema,
    experienceLevel: routineExperienceLevelSchema,
    targetTime: z.coerce
      .number({ invalid_type_error: "목표 시간은 숫자로 입력해 주세요." })
      .int("목표 시간은 정수로 입력해 주세요.")
      .min(ROUTINE_TARGET_TIME_MIN, `목표 시간은 ${ROUTINE_TARGET_TIME_MIN}분 이상이어야 합니다.`)
      .max(ROUTINE_TARGET_TIME_MAX, `목표 시간은 ${ROUTINE_TARGET_TIME_MAX}분 이하이어야 합니다.`),
    goals: listText.pipe(z.array(z.string()).min(1, "목표를 1개 이상 입력해 주세요.")),
    ownedProducts: listText,
    cautions: listText,
  })
  .strict();

export const routineStepSchema = z
  .object({
    order: z.coerce
      .number({ invalid_type_error: "단계 순서는 숫자여야 합니다." })
      .int("단계 순서는 정수여야 합니다.")
      .min(1, "단계 순서는 1 이상이어야 합니다."),
    title: text("단계 제목"),
    description: text("단계 설명", ROUTINE_LONG_TEXT_MAX_LENGTH),
    products: listText,
    estimatedMinutes: z.coerce
      .number({ invalid_type_error: "단계 예상 시간은 숫자여야 합니다." })
      .int("단계 예상 시간은 정수여야 합니다.")
      .min(1, "단계 예상 시간은 1분 이상이어야 합니다.")
      .max(ROUTINE_TARGET_TIME_MAX, `단계 예상 시간은 ${ROUTINE_TARGET_TIME_MAX}분 이하이어야 합니다.`),
    cautions: listText.pipe(
      z.array(z.string()).min(1, "각 단계에는 안전 주의사항이 1개 이상 필요합니다."),
    ),
  })
  .strict();

export const routineResultSchema = z
  .object({
    title: text("루틴 제목"),
    summary: text("루틴 요약", ROUTINE_LONG_TEXT_MAX_LENGTH),
    estimatedTime: z.coerce
      .number({ invalid_type_error: "예상 시간은 숫자여야 합니다." })
      .int("예상 시간은 정수여야 합니다.")
      .min(ROUTINE_TARGET_TIME_MIN, `예상 시간은 ${ROUTINE_TARGET_TIME_MIN}분 이상이어야 합니다.`)
      .max(ROUTINE_TARGET_TIME_MAX, `예상 시간은 ${ROUTINE_TARGET_TIME_MAX}분 이하이어야 합니다.`),
    difficulty: routineDifficultySchema,
    steps: z
      .array(routineStepSchema)
      .min(1, "루틴 단계가 1개 이상 필요합니다.")
      .max(ROUTINE_STEP_MAX_COUNT, `루틴 단계는 ${ROUTINE_STEP_MAX_COUNT}개 이하이어야 합니다.`),
    missingProducts: listText,
    generalCautions: listText.pipe(
      z.array(z.string()).min(1, "전체 안전 주의사항이 1개 이상 필요합니다."),
    ),
  })
  .strict();

export type RoutineInputValues = z.infer<typeof routineInputSchema>;
export type RoutineResult = z.infer<typeof routineResultSchema>;
