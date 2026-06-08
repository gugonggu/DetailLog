"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import {
  createProfileUpsertPayload,
  prepareProfileUpdate,
} from "./profile-service";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "./schemas";

type ProfileEditFormProps = {
  userId: string;
  email: string;
  initialNickname: string;
  profileExists: boolean;
};

export function ProfileEditForm({
  userId,
  email,
  initialNickname,
  profileExists,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nickname: initialNickname,
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    setFormError("");
    setSuccessMessage("");

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setFormError("Supabase 환경 변수를 먼저 설정해 주세요.");
      return;
    }

    const request = profileExists
      ? supabase
          .from("profiles")
          .update(prepareProfileUpdate(values))
          .eq("id", userId)
      : supabase.from("profiles").upsert(
          createProfileUpsertPayload({
            userId,
            email,
            nickname: values.nickname,
          }),
          { onConflict: "id" },
        );

    const { error } = await request;

    if (error) {
      setFormError(error.message);
      return;
    }

    setSuccessMessage("프로필을 저장했습니다.");
    router.refresh();
  }

  return (
    <form
      className="rounded-md border border-border bg-white p-5 shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <h2 className="text-lg font-semibold">닉네임 수정</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Detailog 안에서 표시할 닉네임만 수정합니다.
        </p>
      </div>

      <label className="mt-5 block text-sm font-medium">
        닉네임
        <input
          className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none transition focus:border-primary"
          type="text"
          autoComplete="nickname"
          {...register("nickname")}
        />
      </label>
      {errors.nickname ? (
        <p className="mt-2 text-sm text-red-700">{errors.nickname.message}</p>
      ) : null}

      {formError ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
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
