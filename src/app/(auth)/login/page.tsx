import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthCard } from "@/features/auth/auth-card";
import { LoginForm } from "@/features/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LoginPage() {
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
      title="로그인"
      description="Detailog 대시보드와 주요 앱 페이지에 접근하려면 로그인해 주세요."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">로딩 중...</p>}>
        <LoginForm isSupabaseConfigured={isSupabaseConfigured()} />
      </Suspense>
    </AuthCard>
  );
}
