import { ArrowLeft, Clock, ListChecks, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ZodError } from "zod";

import { mapRoutineRowToRoutine } from "@/features/routines/routine-service";
import type { RoutineRow } from "@/features/routines/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RoutineDetailPageProps = {
  params: Promise<{
    routineId: string;
  }>;
};

const routineSelect =
  "id,user_id,car_id,input,result,created_at,cars(id,name,brand,model)";

const difficultyLabels = {
  easy: "쉬움",
  normal: "보통",
  hard: "어려움",
};

function formatDate(value: string | null) {
  if (!value) {
    return "생성일 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export default async function RoutineDetailPage({ params }: RoutineDetailPageProps) {
  const { routineId } = await params;
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
    .from("routine_recommendations")
    .select(routineSelect)
    .eq("id", routineId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!error && !data) {
    notFound();
  }

  let routine = null;
  let validationError = "";

  if (data) {
    try {
      routine = mapRoutineRowToRoutine(data as RoutineRow);
    } catch (caughtError) {
      validationError =
        caughtError instanceof ZodError
          ? "저장된 루틴 JSON이 현재 스키마와 맞지 않습니다."
          : "저장된 루틴을 해석하지 못했습니다.";
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        href="/routine/new"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />새 루틴 만들기
      </Link>

      {error ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          루틴을 불러오지 못했습니다. {error.message}
        </section>
      ) : null}

      {validationError ? (
        <section className="mt-8 rounded-md border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
          {validationError} 새 루틴을 다시 생성해 주세요.
        </section>
      ) : null}

      {routine ? (
        <>
          <section className="mt-6">
            <p className="text-sm font-semibold text-primary">Saved AI Routine</p>
            <h1 className="mt-3 text-3xl font-bold">{routine.result.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {routine.result.summary}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {routine.car
                ? `${routine.car.name} · ${routine.car.brand} ${routine.car.model}`
                : "차량 정보 없음"}{" "}
              · {formatDate(routine.createdAt)}
            </p>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <InfoCard
              label="예상 시간"
              value={`${routine.result.estimatedTime}분`}
              icon={<Clock className="h-5 w-5 text-primary" aria-hidden="true" />}
            />
            <InfoCard
              label="난이도"
              value={difficultyLabels[routine.result.difficulty]}
              icon={<Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />}
            />
            <InfoCard
              label="단계"
              value={`${routine.result.steps.length}개`}
              icon={<ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />}
            />
          </section>

          <section className="mt-6 rounded-md border border-border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">추천 단계</h2>
            <div className="mt-5 space-y-4">
              {routine.result.steps.map((step) => (
                <article className="rounded-md border border-border p-4" key={step.order}>
                  <p className="text-sm font-semibold text-primary">Step {step.order}</p>
                  <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    예상 시간: {step.estimatedMinutes}분
                  </p>
                  <ListBlock title="사용 제품" items={step.products} emptyText="필수 제품 없음" />
                  <ListBlock title="단계 주의사항" items={step.cautions} />
                </article>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">부족한 제품</h2>
              <ListBlock
                title=""
                items={routine.result.missingProducts}
                emptyText="현재 입력한 보유 제품으로 진행 가능합니다."
              />
            </div>
            <div className="rounded-md border border-border bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <ShieldAlert className="h-5 w-5 text-primary" aria-hidden="true" />
                전체 안전 주의사항
              </h2>
              <ListBlock title="" items={routine.result.generalCautions} />
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

type InfoCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

function InfoCard({ label, value, icon }: InfoCardProps) {
  return (
    <div className="rounded-md border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

type ListBlockProps = {
  title: string;
  items: string[];
  emptyText?: string;
};

function ListBlock({ title, items, emptyText = "항목 없음" }: ListBlockProps) {
  return (
    <div className={title ? "mt-4" : "mt-3"}>
      {title ? <h4 className="text-sm font-semibold">{title}</h4> : null}
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li className="rounded-md border border-border px-3 py-2" key={item}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}
