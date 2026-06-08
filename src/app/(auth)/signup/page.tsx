import { redirect } from "next/navigation";

import { AuthCard } from "@/features/auth/auth-card";
import { SignupForm } from "@/features/auth/signup-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <AuthCard
      title="회원가입"
      description="이메일, 비밀번호, 닉네임으로 Detailog 계정을 준비합니다."
    >
      <SignupForm isSupabaseConfigured={isSupabaseConfigured()} />
    </AuthCard>
  );
}
