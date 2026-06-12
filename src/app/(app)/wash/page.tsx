import { CalendarDays, Droplets, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { WashLogFilterForm } from "@/features/wash-logs/wash-log-filter-form";
import {
  createWashLogKeywordFilter,
  parseWashLogFilters,
  type SearchParams,
} from "@/features/wash-logs/wash-log-filters";
import { mapWashLogRowToWashLog } from "@/features/wash-logs/wash-log-service";
import type { WashLogCar, WashLogRow } from "@/features/wash-logs/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const washLogSelect =
  "id,user_id,car_id,title,wash_date,location,duration_minutes,cost,weather,dirt_level,satisfaction,memo,visibility,created_at,updated_at,cars(id,name,brand,model),wash_steps(id,wash_log_id,step_type,product_name,memo,step_order,created_at)";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

type WashPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function WashPage({ searchParams }: WashPageProps) {
  const filters = parseWashLogFilters(await searchParams);
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

  let washLogsQuery = supabase
    .from("wash_logs")
    .select(washLogSelect)
    .eq("user_id", user.id);

  const keywordFilter = createWashLogKeywordFilter(filters.keyword);

  if (keywordFilter) {
    washLogsQuery = washLogsQuery.or(keywordFilter);
  }
  if (filters.car) {
    washLogsQuery = washLogsQuery.eq("car_id", filters.car);
  }
  if (filters.visibility) {
    washLogsQuery = washLogsQuery.eq("visibility", filters.visibility);
  }
  if (filters.dirtLevel) {
    washLogsQuery = washLogsQuery.eq("dirt_level", filters.dirtLevel);
  }
  if (filters.satisfaction) {
    washLogsQuery = washLogsQuery.eq("satisfaction", filters.satisfaction);
  }
  if (filters.from) {
    washLogsQuery = washLogsQuery.gte("wash_date", filters.from);
  }
  if (filters.to) {
    washLogsQuery = washLogsQuery.lte("wash_date", filters.to);
  }

  const [
    { data, error },
    { data: carRows, error: carError },
  ] = await Promise.all([
    washLogsQuery
      .order("wash_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("cars")
      .select("id,name,brand,model")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
  ]);

  const washLogs = ((data ?? []) as WashLogRow[]).map(mapWashLogRowToWashLog);
  const cars = (carRows ?? []) as WashLogCar[];
  const pageError = error ?? carError;

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Wash Logs"
        title="세차 기록"
        description="내 차량별 세차 이력과 진행 단계를 한곳에서 관리합니다."
        action={
          <Link className="primary-action" href="/wash/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            기록 추가
          </Link>
        }
      />

      <WashLogFilterForm cars={cars} filters={filters} />

      {pageError ? (
        <ErrorState className="mt-8" title="세차 기록 목록을 불러오지 못했습니다." description={pageError.message} />
      ) : null}

      {!pageError && washLogs.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Droplets className="h-7 w-7" aria-hidden="true" />}
          title={filters.hasActiveFilters ? "조건에 맞는 세차 기록이 없습니다." : "아직 세차 기록이 없습니다."}
          description={filters.hasActiveFilters ? "필터 조건을 바꾸거나 초기화해서 다시 확인해 보세요." : "첫 세차 기록을 남기면 차량별 관리 이력을 차곡차곡 확인할 수 있습니다."}
          action={filters.hasActiveFilters ? (
            <Link className="secondary-action" href="/wash">필터 초기화</Link>
          ) : (
            <Link className="primary-action" href="/wash/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              기록 추가
            </Link>
          )}
        />
      ) : null}

      {!pageError && washLogs.length > 0 ? (
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {washLogs.map((washLog) => (
            <Link
              className="surface-card p-5 transition hover:-translate-y-0.5 hover:border-primary sm:p-6"
              href={`/wash/${washLog.id}`}
              key={washLog.id}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Droplets className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold">{washLog.title}</h2>
                    <span className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {washLog.visibility === "private" ? "비공개" : "공개"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {washLog.car?.name ?? "차량 정보 없음"} · {formatDate(washLog.washDate)}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    {washLog.durationMinutes}분 · 만족도 {washLog.satisfaction}/5
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  );
}
