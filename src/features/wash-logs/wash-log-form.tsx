"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import {
  useFieldArray,
  useForm,
  type FieldError,
  type UseFormRegisterReturn,
} from "react-hook-form";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import {
  createWashLogInsertPayload,
  createWashLogUpdatePayload,
} from "./wash-log-service";
import { washLogFormSchema, type WashLogFormValues } from "./schemas";

type WashLogFormMode = "create" | "edit";

type CarOption = {
  id: string;
  name: string;
  brand: string;
  model: string;
};

type WashLogFormProps = {
  mode: WashLogFormMode;
  userId: string;
  cars: CarOption[];
  washLogId?: string;
  defaultValues?: WashLogFormValues;
};

const today = new Date().toISOString().slice(0, 10);

const emptyValues: WashLogFormValues = {
  carId: "",
  title: "",
  washDate: today,
  location: "",
  durationMinutes: 60,
  cost: 0,
  weather: "",
  dirtLevel: 3,
  satisfaction: 4,
  memo: "",
  visibility: "private",
  steps: [
    {
      stepType: "",
      productName: "",
      memo: "",
      stepOrder: 1,
    },
  ],
};

export function WashLogForm({
  mode,
  userId,
  cars,
  washLogId,
  defaultValues = emptyValues,
}: WashLogFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState("");

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<WashLogFormValues>({
    resolver: zodResolver(washLogFormSchema),
    defaultValues,
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: "steps",
  });

  async function onSubmit(values: WashLogFormValues) {
    setFormError("");

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setFormError("Supabase 환경 변수를 먼저 설정해 주세요.");
      return;
    }

    if (mode === "create") {
      const payload = createWashLogInsertPayload({ userId, values });
      const { data, error } = await supabase
        .from("wash_logs")
        .insert(payload.log)
        .select("id")
        .single();

      if (error) {
        setFormError(error.message);
        return;
      }

      const { error: stepsError } = await supabase.from("wash_steps").insert(
        payload.steps.map((step) => ({
          ...step,
          wash_log_id: data.id,
        })),
      );

      if (stepsError) {
        setFormError(stepsError.message);
        return;
      }

      router.push(`/wash/${data.id}`);
      router.refresh();
      return;
    }

    if (!washLogId) {
      setFormError("수정할 세차 기록 정보를 찾지 못했습니다.");
      return;
    }

    const payload = createWashLogUpdatePayload(values);
    const { data, error } = await supabase
      .from("wash_logs")
      .update(payload.log)
      .eq("id", washLogId)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error) {
      setFormError(error.message);
      return;
    }

    const { error: deleteStepsError } = await supabase
      .from("wash_steps")
      .delete()
      .eq("wash_log_id", washLogId);

    if (deleteStepsError) {
      setFormError(deleteStepsError.message);
      return;
    }

    const { error: stepsError } = await supabase.from("wash_steps").insert(
      payload.steps.map((step) => ({
        ...step,
        wash_log_id: washLogId,
      })),
    );

    if (stepsError) {
      setFormError(stepsError.message);
      return;
    }

    router.push(`/wash/${data.id}`);
    router.refresh();
  }

  return (
    <form
      className="rounded-md border border-border bg-white p-5 shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      {cars.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          세차 기록을 작성하려면 먼저 차량을 등록해 주세요.
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          차량
          <select
            className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
            disabled={cars.length === 0}
            {...register("carId")}
          >
            <option value="">차량을 선택해 주세요</option>
            {cars.map((car) => (
              <option value={car.id} key={car.id}>
                {car.name} · {car.brand} {car.model}
              </option>
            ))}
          </select>
          {errors.carId ? (
            <span className="mt-2 block text-sm text-red-700">{errors.carId.message}</span>
          ) : null}
        </label>
        <TextField
          label="제목"
          autoComplete="off"
          error={errors.title}
          registration={register("title")}
        />
        <TextField
          label="세차일"
          type="date"
          error={errors.washDate}
          registration={register("washDate")}
        />
        <TextField
          label="장소"
          autoComplete="off"
          error={errors.location}
          registration={register("location")}
        />
        <TextField
          label="소요 시간(분)"
          type="number"
          min="1"
          max="1440"
          error={errors.durationMinutes}
          registration={register("durationMinutes")}
        />
        <TextField
          label="비용(원)"
          type="number"
          min="0"
          step="100"
          error={errors.cost}
          registration={register("cost")}
        />
        <TextField
          label="날씨"
          autoComplete="off"
          error={errors.weather}
          registration={register("weather")}
        />
        <TextField
          label="오염도(1-5)"
          type="number"
          min="1"
          max="5"
          error={errors.dirtLevel}
          registration={register("dirtLevel")}
        />
        <TextField
          label="만족도(1-5)"
          type="number"
          min="1"
          max="5"
          error={errors.satisfaction}
          registration={register("satisfaction")}
        />
        <label className="block text-sm font-medium">
          공개 범위
          <select
            className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
            {...register("visibility")}
          >
            <option value="private">비공개</option>
            <option value="public">공개</option>
          </select>
          {errors.visibility ? (
            <span className="mt-2 block text-sm text-red-700">
              {errors.visibility.message}
            </span>
          ) : null}
        </label>
      </div>

      <label className="mt-5 block text-sm font-medium">
        메모
        <textarea
          className="mt-2 min-h-32 w-full rounded-md border border-border px-3 py-3 text-sm outline-none transition focus:border-primary"
          {...register("memo")}
        />
      </label>
      {errors.memo ? (
        <p className="mt-2 text-sm text-red-700">{errors.memo.message}</p>
      ) : null}

      <section className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">세차 단계</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              실제 진행한 순서대로 단계를 기록합니다.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold transition hover:border-primary"
            type="button"
            onClick={() =>
              append({
                stepType: "",
                productName: "",
                memo: "",
                stepOrder: fields.length + 1,
              })
            }
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            단계 추가
          </button>
        </div>

        {typeof errors.steps?.message === "string" ? (
          <p className="mt-3 text-sm text-red-700">{errors.steps.message}</p>
        ) : null}

        <div className="mt-4 space-y-4">
          {fields.map((field, index) => (
            <div className="rounded-md border border-border p-4" key={field.id}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">단계 {index + 1}</h3>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  삭제
                </button>
              </div>
              <input type="hidden" value={index + 1} {...register(`steps.${index}.stepOrder`)} />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TextField
                  label="단계 유형"
                  autoComplete="off"
                  error={errors.steps?.[index]?.stepType}
                  registration={register(`steps.${index}.stepType`)}
                />
                <TextField
                  label="제품명"
                  autoComplete="off"
                  error={errors.steps?.[index]?.productName}
                  registration={register(`steps.${index}.productName`)}
                />
              </div>
              <label className="mt-4 block text-sm font-medium">
                단계 메모
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-border px-3 py-3 text-sm outline-none transition focus:border-primary"
                  {...register(`steps.${index}.memo`)}
                />
              </label>
              {errors.steps?.[index]?.memo ? (
                <p className="mt-2 text-sm text-red-700">
                  {errors.steps[index]?.memo?.message}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {formError ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <button
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isSubmitting || cars.length === 0}
      >
        <Save className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}

type TextFieldProps = {
  label: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

function TextField({
  label,
  error,
  registration,
  type = "text",
  ...props
}: TextFieldProps) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none transition focus:border-primary"
        type={type}
        {...props}
        {...registration}
      />
      {error ? <span className="mt-2 block text-sm text-red-700">{error.message}</span> : null}
    </label>
  );
}
