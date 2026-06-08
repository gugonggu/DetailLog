"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { InputHTMLAttributes } from "react";
import { useMemo, useState } from "react";
import { useForm, type FieldError, type UseFormRegisterReturn } from "react-hook-form";

import { routineInputSchema, type RoutineInputValues } from "./schemas";

type RoutineCarOption = {
  id: string;
  name: string;
  brand: string;
  model: string;
  color: string;
  coatingType: string;
};

type RoutineFormProps = {
  cars: RoutineCarOption[];
};

type RoutineApiResponse = {
  routineId?: string;
  isFallback?: boolean;
  error?: string;
};

const defaultValues: RoutineInputValues = {
  carId: "",
  carColor: "",
  coatingType: "",
  dirtLevel: 3,
  environment: "self_wash_bay",
  experienceLevel: "beginner",
  targetTime: 60,
  goals: ["안전한 세차", "도장면 손상 최소화"],
  ownedProducts: [],
  cautions: [],
};

function parseList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function RoutineForm({ cars }: RoutineFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");

  const firstCar = cars[0];
  const initialValues = useMemo<RoutineInputValues>(
    () => ({
      ...defaultValues,
      carId: firstCar?.id ?? "",
      carColor: firstCar?.color ?? "",
      coatingType: firstCar?.coatingType ?? "",
    }),
    [firstCar],
  );

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<RoutineInputValues>({
    resolver: zodResolver(routineInputSchema),
    defaultValues: initialValues,
  });

  async function onSubmit(values: RoutineInputValues) {
    setFormError("");
    setFallbackMessage("");

    const response = await fetch("/api/routines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => ({}))) as RoutineApiResponse;

    if (!response.ok || !payload.routineId) {
      setFormError(payload.error ?? "루틴을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    if (payload.isFallback) {
      setFallbackMessage(
        "AI 응답을 검증하지 못해 기본 안전 루틴으로 저장했습니다. 상세 화면에서 내용을 확인해 주세요.",
      );
    }

    router.push(`/routine/${payload.routineId}`);
    router.refresh();
  }

  function syncCarProfile(carId: string) {
    const car = cars.find((item) => item.id === carId);

    if (!car) {
      return;
    }

    setValue("carColor", car.color, { shouldValidate: true });
    setValue("coatingType", car.coatingType, { shouldValidate: true });
  }

  return (
    <form
      className="rounded-md border border-border bg-white p-5 shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      {cars.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          루틴 추천을 받으려면 먼저 차량을 등록해 주세요.
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          차량
          <select
            className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
            disabled={cars.length === 0}
            {...register("carId", {
              onChange: (event) => syncCarProfile(event.target.value),
            })}
          >
            <option value="">차량을 선택해 주세요</option>
            {cars.map((car) => (
              <option value={car.id} key={car.id}>
                {car.name} · {car.brand} {car.model}
              </option>
            ))}
          </select>
          <FieldErrorMessage error={errors.carId} />
        </label>

        <TextField
          label="차량 색상"
          autoComplete="off"
          error={errors.carColor}
          registration={register("carColor")}
        />
        <TextField
          label="코팅 상태"
          autoComplete="off"
          error={errors.coatingType}
          registration={register("coatingType")}
        />
        <TextField
          label="오염도(1-5)"
          type="number"
          min="1"
          max="5"
          error={errors.dirtLevel}
          registration={register("dirtLevel")}
        />

        <SelectField
          label="세차 환경"
          error={errors.environment}
          registration={register("environment")}
          options={[
            ["home", "자택"],
            ["self_wash_bay", "셀프 세차장"],
            ["professional_bay", "실내 세차 베이"],
            ["outdoor", "야외"],
          ]}
        />
        <SelectField
          label="경험 수준"
          error={errors.experienceLevel}
          registration={register("experienceLevel")}
          options={[
            ["beginner", "입문"],
            ["intermediate", "중급"],
            ["advanced", "숙련"],
          ]}
        />
        <TextField
          label="목표 시간(분)"
          type="number"
          min="15"
          max="240"
          error={errors.targetTime}
          registration={register("targetTime")}
        />
      </div>

      <div className="mt-5 grid gap-5">
        <ListField
          label="목표"
          helper="쉼표 또는 줄바꿈으로 입력해 주세요."
          error={errors.goals?.message}
          registration={register("goals", {
            setValueAs: (value) => (Array.isArray(value) ? value : parseList(value)),
          })}
        />
        <ListField
          label="보유 제품"
          helper="예: 카샴푸, 드라잉 타월, 휠 클리너"
          error={errors.ownedProducts?.message}
          registration={register("ownedProducts", {
            setValueAs: (value) => (Array.isArray(value) ? value : parseList(value)),
          })}
        />
        <ListField
          label="주의사항"
          helper="예: 검정 하이그로시, 오래된 PPF, 강한 알칼리 제품 피하기"
          error={errors.cautions?.message}
          registration={register("cautions", {
            setValueAs: (value) => (Array.isArray(value) ? value : parseList(value)),
          })}
        />
      </div>

      {fallbackMessage ? (
        <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          {fallbackMessage}
        </p>
      ) : null}

      {formError ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
          <AlertTriangle className="mr-2 inline h-4 w-4" aria-hidden="true" />
          {formError}
        </p>
      ) : null}

      <button
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        type="submit"
        disabled={isSubmitting || cars.length === 0}
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "루틴 생성 중..." : "AI 루틴 추천 받기"}
      </button>
    </form>
  );
}

type TextFieldProps = {
  label: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

function TextField({ label, error, registration, type = "text", ...props }: TextFieldProps) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none transition focus:border-primary"
        type={type}
        {...props}
        {...registration}
      />
      <FieldErrorMessage error={error} />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  options: [string, string][];
};

function SelectField({ label, error, registration, options }: SelectFieldProps) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
        {...registration}
      >
        {options.map(([value, labelText]) => (
          <option value={value} key={value}>
            {labelText}
          </option>
        ))}
      </select>
      <FieldErrorMessage error={error} />
    </label>
  );
}

type ListFieldProps = {
  label: string;
  helper: string;
  error?: string;
  registration: UseFormRegisterReturn;
};

function ListField({ label, helper, error, registration }: ListFieldProps) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <textarea
        className="mt-2 min-h-24 w-full rounded-md border border-border px-3 py-3 text-sm outline-none transition focus:border-primary"
        {...registration}
      />
      <span className="mt-2 block text-xs text-muted-foreground">{helper}</span>
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function FieldErrorMessage({ error }: { error?: FieldError }) {
  return error ? <span className="mt-2 block text-sm text-red-700">{error.message}</span> : null;
}
