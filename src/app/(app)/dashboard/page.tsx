import type { ReactNode } from "react";
import {
  Bot,
  CalendarDays,
  CarFront,
  CircleDollarSign,
  Droplets,
  ExternalLink,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  getDashboardMonthRange,
  summarizeMonthlyWashLogs,
} from "@/features/dashboard/dashboard-summary";
import { mapRoutineRowToRoutine } from "@/features/routines/routine-service";
import type { Routine, RoutineRow } from "@/features/routines/types";
import { mapWashLogRowToWashLog } from "@/features/wash-logs/wash-log-service";
import type { WashLog, WashLogRow } from "@/features/wash-logs/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type QueryError = {
  message: string;
};

const recentWashLogSelect =
  "id,user_id,car_id,title,wash_date,location,duration_minutes,cost,weather,dirt_level,satisfaction,memo,visibility,created_at,updated_at,cars(id,name,brand,model),wash_steps(id,wash_log_id,step_type,product_name,memo,step_order,created_at)";

const recentRoutineSelect =
  "id,user_id,car_id,input,result,created_at,cars(id,name,brand,model)";

const quickActions = [
  {
    href: "/cars/new",
    label: "차량 추가",
    icon: CarFront,
  },
  {
    href: "/wash/new",
    label: "세차 기록 작성",
    icon: Droplets,
  },
  {
    href: "/routine/new",
    label: "AI 루틴 받기",
    icon: Sparkles,
  },
  {
    href: "/community",
    label: "커뮤니티 보기",
    icon: Users,
  },
];

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "기록 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    currency: "KRW",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export default async function DashboardPage() {
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

  const monthRange = getDashboardMonthRange();

  const [
    carCountResult,
    washLogCountResult,
    recentWashLogResult,
    monthlyWashLogsResult,
    recentRoutineResult,
  ] = await Promise.all([
    supabase
      .from("cars")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("wash_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("wash_logs")
      .select(recentWashLogSelect)
      .eq("user_id", user.id)
      .order("wash_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("wash_logs")
      .select("id,cost")
      .eq("user_id", user.id)
      .gte("wash_date", monthRange.start)
      .lt("wash_date", monthRange.end),
    supabase
      .from("routine_recommendations")
      .select(recentRoutineSelect)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const queryErrors: QueryError[] = [
    carCountResult.error,
    washLogCountResult.error,
    recentWashLogResult.error,
    monthlyWashLogsResult.error,
    recentRoutineResult.error,
  ].flatMap((error) => (error ? [{ message: error.message }] : []));

  const totalCarCount = carCountResult.count ?? 0;
  const totalWashLogCount = washLogCountResult.count ?? 0;
  const recentWashLog = recentWashLogResult.data
    ? mapWashLogRowToWashLog(recentWashLogResult.data as WashLogRow)
    : null;
  const monthlySummary = summarizeMonthlyWashLogs(
    (monthlyWashLogsResult.data ?? []) as { cost: number | null }[],
  );
  let recentRoutine: Routine | null = null;
  let routineValidationError = "";

  if (recentRoutineResult.data) {
    try {
      recentRoutine = mapRoutineRowToRoutine(recentRoutineResult.data as RoutineRow);
    } catch (error) {
      routineValidationError =
        error instanceof ZodError
          ? "최근 AI 루틴 데이터가 현재 스키마와 맞지 않습니다."
          : "최근 AI 루틴을 해석하지 못했습니다.";
    }
  }

  const hasAnyData = totalCarCount > 0 || totalWashLogCount > 0 || Boolean(recentRoutine);

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Dashboard"
        title="내 관리 현황"
        description="차량, 세차 기록, 이번 달 비용, 최근 AI 루틴을 한눈에 확인하고 다음 작업으로 바로 이동합니다."
      />

      {queryErrors.length > 0 ? (
        <ErrorState
          className="mt-8"
          title="대시보드 정보를 불러오지 못했습니다"
          details={
            <ul className="space-y-1">
              {queryErrors.map((error) => (
                <li key={error.message}>{error.message}</li>
              ))}
            </ul>
          }
        />
      ) : null}

      {!queryErrors.length && !hasAnyData ? (
        <EmptyState
          className="mt-8"
          icon={<CarFront className="h-7 w-7" aria-hidden="true" />}
          title="아직 관리할 데이터가 없습니다"
          description="첫 차량을 등록하면 세차 기록과 AI 루틴을 차량 기준으로 모아볼 수 있습니다."
          action={
            <Link className="primary-action" href="/cars/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              차량 추가
            </Link>
          }
        />
      ) : null}

      {!queryErrors.length ? (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={<CarFront className="h-5 w-5 text-primary" aria-hidden="true" />}
              label="등록 차량"
              value={`${totalCarCount}대`}
            />
            <SummaryCard
              icon={<Droplets className="h-5 w-5 text-primary" aria-hidden="true" />}
              label="전체 세차 기록"
              value={`${totalWashLogCount}건`}
            />
            <SummaryCard
              icon={<CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />}
              label="이번 달 세차"
              value={`${monthlySummary.count}건`}
            />
            <SummaryCard
              icon={<CircleDollarSign className="h-5 w-5 text-primary" aria-hidden="true" />}
              label="월 평균 비용"
              value={formatCurrency(monthlySummary.averageCost)}
            />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <RecentWashLogCard washLog={recentWashLog} />
            <RecentRoutineCard
              routine={recentRoutine}
              validationError={routineValidationError}
            />
          </section>

          <section className="surface-card mt-6 p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">빠른 실행</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  자주 여는 작업으로 바로 이동합니다.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link className="secondary-action" href={action.href} key={action.href}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

type SummaryCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function SummaryCard({ icon, label, value }: SummaryCardProps) {
  return (
    <article className="surface-card p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </article>
  );
}

function RecentWashLogCard({ washLog }: { washLog: WashLog | null }) {
  return (
    <article className="surface-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">최근 세차 기록</p>
          <h2 className="mt-3 text-xl font-semibold">
            {washLog ? washLog.title : "아직 세차 기록이 없습니다"}
          </h2>
        </div>
        <Droplets className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      {washLog ? (
        <>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {washLog.car?.name ?? "차량 정보 없음"} · {formatDate(washLog.washDate)}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SmallMetric label="세차일" value={formatDate(washLog.washDate)} />
            <SmallMetric label="소요 시간" value={`${washLog.durationMinutes}분`} />
            <SmallMetric label="비용" value={formatCurrency(washLog.cost)} />
          </div>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            href={`/wash/${washLog.id}`}
          >
            기록 보기
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          세차 기록을 추가하면 최근 기록 요약과 비용, 소요 시간을 이곳에서 확인할 수 있습니다.
        </p>
      )}
    </article>
  );
}

function RecentRoutineCard({
  routine,
  validationError,
}: {
  routine: Routine | null;
  validationError: string;
}) {
  return (
    <article className="surface-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">최근 AI 루틴</p>
          <h2 className="mt-3 text-xl font-semibold">
            {routine ? routine.result.title : "저장된 AI 루틴이 없습니다"}
          </h2>
        </div>
        <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      {validationError ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          {validationError}
        </p>
      ) : null}
      {routine ? (
        <>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {routine.car?.name ?? "차량 정보 없음"} · {formatDate(routine.createdAt)}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {routine.result.summary}
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            href={`/routine/${routine.id}`}
          >
            루틴 보기
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          AI 루틴을 생성하면 가장 최근 추천을 이곳에서 다시 열어볼 수 있습니다.
        </p>
      )}
    </article>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}
