import { CalendarDays, Mail, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/states";
import { ProfileEditForm } from "@/features/profile/profile-edit-form";
import type { Profile } from "@/features/profile/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function formatCreatedDate(createdAt: string | null) {
  if (!createdAt) {
    return "생성일 정보 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(createdAt));
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,nickname,created_at")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as Profile | null;
  const fallbackNickname =
    typeof user.user_metadata.nickname === "string"
      ? user.user_metadata.nickname
      : "";
  const displayNickname = profile?.nickname ?? fallbackNickname;
  const displayEmail = profile?.email ?? user.email ?? "이메일 정보 없음";

  return (
    <main className="page-shell max-w-5xl">
      <PageHeader
        eyebrow="Profile"
        title="내 프로필"
        description="계정의 기본 프로필 정보를 확인하고 닉네임을 수정합니다. 차량 관리와 아바타 업로드는 아직 연결하지 않습니다."
      />

      {error ? (
        <ErrorState className="mt-8" title="프로필을 불러오지 못했습니다." description={error.message} />
      ) : null}

      {!error && !profile ? (
        <section className="mt-8 rounded-md border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
          아직 `profiles` row가 없습니다. 아래 닉네임 저장을 누르면 현재 계정의
          기본 프로필을 생성합니다.
        </section>
      ) : null}

      {!error ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
          <section className="surface-card p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <UserRound className="h-9 w-9" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {displayNickname || "닉네임 없음"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  아바타 업로드는 이후 단계에서 추가합니다.
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/60 p-4">
                <dt className="flex items-center gap-2 text-sm font-semibold">
                  <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                  이메일
                </dt>
                <dd className="mt-2 break-words text-sm text-muted-foreground">
                  {displayEmail}
                </dd>
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <dt className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  생성일
                </dt>
                <dd className="mt-2 text-sm text-muted-foreground">
                  {formatCreatedDate(profile?.created_at ?? null)}
                </dd>
              </div>
            </dl>
          </section>

          <ProfileEditForm
            userId={user.id}
            email={displayEmail}
            initialNickname={displayNickname}
            profileExists={Boolean(profile)}
          />
        </div>
      ) : null}
    </main>
  );
}
