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
import { carFormSchema, type CarFormValues } from "./schemas";

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
  coatingType: "",
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
    resolver: zodResolver(carFormSchema),
    defaultValues,
  });

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
      className="rounded-md border border-border bg-white p-5 shadow-sm"
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
        <TextField
          label="코팅 타입"
          autoComplete="off"
          error={errors.coatingType?.message}
          registration={register("coatingType")}
        />
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

      {formError ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <button
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
        className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none transition focus:border-primary"
        type={type}
        {...props}
        {...registration}
      />
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
