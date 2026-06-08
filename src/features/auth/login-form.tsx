"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { AuthMessage } from "./auth-message";
import {
  getLoginRedirectPath,
  type LoginFormValues,
  loginSchema,
} from "./schemas";

type LoginFormProps = {
  isSupabaseConfigured: boolean;
};

export function LoginForm({ isSupabaseConfigured }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState("");

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const redirectedFrom = searchParams.get("redirectedFrom");

  async function onSubmit(values: LoginFormValues) {
    setFormError("");
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setFormError("Supabase 환경 변수를 먼저 설정해 주세요.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setFormError(error.message);
      return;
    }

    router.replace(getLoginRedirectPath(redirectedFrom));
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {!isSupabaseConfigured ? (
        <AuthMessage>
          Supabase URL과 anon key가 없어 로그인 기능이 비활성화되어 있습니다.
        </AuthMessage>
      ) : null}
      {redirectedFrom ? (
        <AuthMessage>로그인이 필요한 페이지입니다. 먼저 로그인해 주세요.</AuthMessage>
      ) : null}
      {formError ? <AuthMessage tone="error">{formError}</AuthMessage> : null}

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
          autoComplete="current-password"
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
        <LogIn className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "로그인 중..." : "로그인"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        계정이 없나요?{" "}
        <Link className="font-semibold text-primary" href="/signup">
          회원가입
        </Link>
      </p>
    </form>
  );
}
