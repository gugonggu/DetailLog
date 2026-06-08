import { NextResponse } from "next/server";
import { z } from "zod";

import { createRoutineInsertPayload } from "@/features/routines/routine-service";
import {
  routineInputSchema,
  routineResultSchema,
  type RoutineInputValues,
  type RoutineResult,
} from "@/features/routines/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";

const routineResultJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "estimatedTime",
    "difficulty",
    "steps",
    "missingProducts",
    "generalCautions",
  ],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    estimatedTime: { type: "integer", minimum: 15, maximum: 240 },
    difficulty: { type: "string", enum: ["easy", "normal", "hard"] },
    steps: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "order",
          "title",
          "description",
          "products",
          "estimatedMinutes",
          "cautions",
        ],
        properties: {
          order: { type: "integer", minimum: 1 },
          title: { type: "string" },
          description: { type: "string" },
          products: {
            type: "array",
            items: { type: "string" },
          },
          estimatedMinutes: { type: "integer", minimum: 1, maximum: 240 },
          cautions: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
          },
        },
      },
    },
    missingProducts: {
      type: "array",
      items: { type: "string" },
    },
    generalCautions: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
  },
} as const;

type OpenAIResponseBody = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
};

function extractOutputText(body: OpenAIResponseBody) {
  if (typeof body.output_text === "string") {
    return body.output_text;
  }

  return (
    body.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .find((text) => typeof text === "string" && text.length > 0) ?? ""
  );
}

function buildPrompt(input: RoutineInputValues) {
  return `다음 입력을 바탕으로 세차 루틴을 추천해 주세요.

요구사항:
- 반드시 한국어로 작성합니다.
- 응답은 지정된 JSON Schema만 따릅니다.
- 도장면 손상 방지, 제품 혼용 주의, 뜨거운 패널/직사광선 주의 등 안전 주의사항을 포함합니다.
- 사용자가 가진 제품을 우선 사용하고, 꼭 필요한 누락 제품만 missingProducts에 넣습니다.
- targetTime 안에 들어오도록 단계별 예상 시간을 조정합니다.

입력:
${JSON.stringify(input, null, 2)}`;
}

function createFallbackRoutine(input: RoutineInputValues): RoutineResult {
  const contactMinutes = Math.max(10, Math.min(25, Math.floor(input.targetTime * 0.3)));
  const rinseMinutes = Math.max(8, Math.min(20, Math.floor(input.targetTime * 0.2)));
  const dryMinutes = Math.max(10, Math.min(25, Math.floor(input.targetTime * 0.25)));
  const finishMinutes = Math.max(
    5,
    input.targetTime - contactMinutes - rinseMinutes - dryMinutes,
  );

  return routineResultSchema.parse({
    title: "기본 안전 세차 루틴",
    summary:
      "AI 응답을 검증하지 못해 저장한 기본 루틴입니다. 도장면 마찰을 줄이고 보유 제품을 우선 사용하는 안전 중심 순서입니다.",
    estimatedTime: input.targetTime,
    difficulty: input.experienceLevel === "advanced" ? "normal" : "easy",
    steps: [
      {
        order: 1,
        title: "예비 고압수 헹굼",
        description: "상단에서 하단 순서로 먼지와 모래를 충분히 흘려보냅니다.",
        products: [],
        estimatedMinutes: rinseMinutes,
        cautions: ["마른 오염 위를 바로 문지르지 마세요."],
      },
      {
        order: 2,
        title: "부드러운 본세차",
        description: "카샴푸와 깨끗한 미트를 사용해 패널 단위로 세척합니다.",
        products: input.ownedProducts.filter((item) => item.includes("샴푸") || item.includes("미트")),
        estimatedMinutes: contactMinutes,
        cautions: ["미트에 이물감이 느껴지면 즉시 헹군 뒤 다시 진행하세요."],
      },
      {
        order: 3,
        title: "최종 헹굼과 드라잉",
        description: "잔여 세제를 완전히 헹군 뒤 깨끗한 타월로 물기를 제거합니다.",
        products: input.ownedProducts.filter((item) => item.includes("타월")),
        estimatedMinutes: dryMinutes,
        cautions: ["강한 압력으로 문지르지 말고 타월을 자주 뒤집어 사용하세요."],
      },
      {
        order: 4,
        title: "마무리 점검",
        description: "틈새 물기와 얼룩을 확인하고 필요한 부분만 가볍게 정리합니다.",
        products: [],
        estimatedMinutes: finishMinutes,
        cautions: ["뜨거운 패널이나 직사광선 아래에서는 케미컬을 오래 방치하지 마세요."],
      },
    ],
    missingProducts: input.ownedProducts.some((item) => item.includes("타월"))
      ? []
      : ["깨끗한 드라잉 타월"],
    generalCautions: [
      "처음 쓰는 제품은 눈에 덜 띄는 부위에서 먼저 확인하세요.",
      "서로 다른 케미컬을 임의로 섞지 마세요.",
      "코팅 상태가 불확실하면 강한 산성 또는 알칼리성 제품 사용을 줄이세요.",
    ],
  });
}

async function createOpenAIRoutine(input: RoutineInputValues) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
      instructions:
        "You are a professional car wash routine assistant. Return only valid structured JSON.",
      input: buildPrompt(input),
      text: {
        format: {
          type: "json_schema",
          name: "detailog_wash_routine",
          strict: true,
          schema: routineResultJsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const body = (await response.json()) as OpenAIResponseBody;
  const outputText = extractOutputText(body);
  const parsedJson = JSON.parse(outputText) as unknown;

  return routineResultSchema.parse(parsedJson);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase 환경 변수를 먼저 설정해 주세요." },
      { status: 500 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const inputResult = routineInputSchema.safeParse(body);

  if (!inputResult.success) {
    return NextResponse.json(
      { error: inputResult.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 },
    );
  }

  const input = inputResult.data;
  const { data: car, error: carError } = await supabase
    .from("cars")
    .select("id")
    .eq("id", input.carId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (carError) {
    return NextResponse.json({ error: carError.message }, { status: 500 });
  }

  if (!car) {
    return NextResponse.json({ error: "선택한 차량을 찾을 수 없습니다." }, { status: 404 });
  }

  let isFallback = false;
  let result: RoutineResult;

  try {
    result = await createOpenAIRoutine(input);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      isFallback = true;
      result = createFallbackRoutine(input);
    } else if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY 환경 변수를 설정해 주세요." },
        { status: 500 },
      );
    } else {
      isFallback = true;
      result = createFallbackRoutine(input);
    }
  }

  const { data, error } = await supabase
    .from("routine_recommendations")
    .insert(createRoutineInsertPayload({ userId: user.id, input, result }))
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    routineId: data.id,
    isFallback,
  });
}
