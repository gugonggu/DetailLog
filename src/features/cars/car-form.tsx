"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import {
  createCarInsertPayload,
  createCarUpdatePayload,
} from "./car-service";
import {
  createCarFormSchema,
  getPaintProtectionOptions,
  type CarFormValues,
} from "./schemas";

type CarFormMode = "create" | "edit";

type CarFormProps = {
  mode: CarFormMode;
  userId: string;
  carId?: string;
  defaultValues?: CarFormValues;
};

const emptyValues: CarFormValues = {
  name: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  color: "",
  coatingType: "잘 모르겠음",
  memo: "",
};

export function CarForm({
  mode,
  userId,
  carId,
  defaultValues = emptyValues,
}: CarFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState("");

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CarFormValues>({
    resolver: zodResolver(createCarFormSchema(defaultValues.coatingType)),
    defaultValues,
  });
  const paintProtectionOptions = getPaintProtectionOptions(
    defaultValues.coatingType,
  );

  async function onSubmit(values: CarFormValues) {
    setFormError("");

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setFormError("Supabase 환경 변수를 먼저 설정해 주세요.");
      return;
    }

    if (mode === "create") {
      const { data, error } = await supabase
        .from("cars")
        .insert(createCarInsertPayload({ userId, values }))
        .select("id")
        .single();

      if (error) {
        setFormError(error.message);
        return;
      }

      router.push(`/cars/${data.id}`);
      router.refresh();
      return;
    }

    if (!carId) {
      setFormError("수정할 차량 정보를 찾지 못했습니다.");
      return;
    }

    const { data, error } = await supabase
      .from("cars")
      .update(createCarUpdatePayload(values))
      .eq("id", carId)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error) {
      setFormError(error.message);
      return;
    }

    router.push(`/cars/${data.id}`);
    router.refresh();
  }

  return (
    <form
      className="surface-card p-5 sm:p-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="차량 이름"
          autoComplete="off"
          error={errors.name?.message}
          registration={register("name")}
        />
        <TextField
          label="브랜드"
          autoComplete="organization"
          error={errors.brand?.message}
          registration={register("brand")}
        />
        <TextField
          label="모델"
          autoComplete="off"
          error={errors.model?.message}
          registration={register("model")}
        />
        <TextField
          label="연식"
          type="number"
          min="1886"
          max={String(new Date().getFullYear() + 1)}
          error={errors.year?.message}
          registration={register("year")}
        />
        <TextField
          label="색상"
          autoComplete="off"
          error={errors.color?.message}
          registration={register("color")}
        />
        <label className="block text-sm font-medium">
          도장면 보호 상태
          <select className="field-control" {...register("coatingType")}>
            {paintProtectionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs leading-5 text-muted-foreground">
            현재 차량 도장면에 적용된 왁스, 코팅 또는 보호 필름 상태입니다.
          </span>
          {errors.coatingType ? (
            <span className="mt-2 block text-sm text-red-700">
              {errors.coatingType.message}
            </span>
          ) : null}
        </label>
      </div>

      <label className="mt-5 block text-sm font-medium">
        메모
        <textarea
          className="field-control min-h-32 py-3"
          {...register("memo")}
        />
      </label>
      {errors.memo ? (
        <p className="mt-2 text-sm text-red-700">{errors.memo.message}</p>
      ) : null}

      {formError ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <button
        className="primary-action mt-5 w-full sm:w-auto"
        type="submit"
        disabled={isSubmitting}
      >
        <Save className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}

type TextFieldProps = {
  label: string;
  error?: string;
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
        className="field-control"
        type={type}
        {...props}
        {...registration}
      />
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
