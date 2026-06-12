"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { getAuthErrorMessage } from "./auth-error";
import { AuthMessage } from "./auth-message";
import {
  createSignupProfileMetadata,
  type SignupFormValues,
  signupSchema,
} from "./schemas";
import { createProfileUpsertPayload } from "@/features/profile/profile-service";

type SignupFormProps = {
  isSupabaseConfigured: boolean;
};

export function SignupForm({ isSupabaseConfigured }: SignupFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      nickname: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setFormError("");
    setSuccessMessage("");
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setFormError("Supabase 환경 변수를 먼저 설정해 주세요.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: createSignupProfileMetadata(values.nickname),
        },
      });

      if (error) {
        setFormError(getAuthErrorMessage(error.message));
        return;
      }

      if (data.user && data.session) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          createProfileUpsertPayload({
            userId: data.user.id,
            email: data.user.email ?? values.email,
            nickname: values.nickname,
          }),
          { onConflict: "id" },
        );

        if (profileError) {
          setFormError(getAuthErrorMessage(profileError.message));
          return;
        }
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage("가입 확인 메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {!isSupabaseConfigured ? (
        <AuthMessage>
          Supabase URL과 anon key가 없어 회원가입 기능이 비활성화되어 있습니다.
        </AuthMessage>
      ) : null}
      {formError ? <AuthMessage tone="error">{formError}</AuthMessage> : null}
      {successMessage ? (
        <AuthMessage tone="success">{successMessage}</AuthMessage>
      ) : null}

      <label className="block text-sm font-medium">
        닉네임
        <input
          className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none transition focus:border-primary"
          type="text"
          autoComplete="nickname"
          placeholder="Detailer"
          {...register("nickname")}
        />
      </label>
      {errors.nickname ? (
        <p className="text-sm text-red-700">{errors.nickname.message}</p>
      ) : null}

      <label className="block text-sm font-medium">
        이메일
        <input
          className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none transition focus:border-primary"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
        />
      </label>
      {errors.email ? (
        <p className="text-sm text-red-700">{errors.email.message}</p>
      ) : null}

      <label className="block text-sm font-medium">
        비밀번호
        <input
          className="mt-2 h-11 w-full rounded-md border border-border px-3 text-sm outline-none transition focus:border-primary"
          type="password"
          autoComplete="new-password"
          placeholder="8자 이상"
          {...register("password")}
        />
      </label>
      {errors.password ? (
        <p className="text-sm text-red-700">{errors.password.message}</p>
      ) : null}

      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isSubmitting || !isSupabaseConfigured}
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "가입 중..." : "회원가입"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link className="font-semibold text-primary" href="/login">
          로그인
        </Link>
      </p>
    </form>
  );
}
