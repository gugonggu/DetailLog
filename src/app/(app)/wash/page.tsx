import { CalendarDays, Droplets, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { mapWashLogRowToWashLog } from "@/features/wash-logs/wash-log-service";
import type { WashLogRow } from "@/features/wash-logs/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const washLogSelect =
  "id,user_id,car_id,title,wash_date,location,duration_minutes,cost,weather,dirt_level,satisfaction,memo,visibility,created_at,updated_at,cars(id,name,brand,model),wash_steps(id,wash_log_id,step_type,product_name,memo,step_order,created_at)";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export default async function WashPage() {
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
    .from("wash_logs")
    .select(washLogSelect)
    .eq("user_id", user.id)
    .order("wash_date", { ascending: false })
    .order("created_at", { ascending: false });

  const washLogs = ((data ?? []) as WashLogRow[]).map(mapWashLogRowToWashLog);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Wash Logs</p>
          <h1 className="mt-3 text-3xl font-bold">세차 기록</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            내 차량별 세차 이력과 진행 단계를 한곳에서 관리합니다.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          href="/wash/new"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          기록 추가
        </Link>
      </section>

      {error ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          세차 기록 목록을 불러오지 못했습니다. {error.message}
        </section>
      ) : null}

      {!error && washLogs.length === 0 ? (
        <section className="mt-8 rounded-md border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <Droplets className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">아직 세차 기록이 없습니다.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            첫 세차 기록을 남기면 차량별 관리 이력을 차곡차곡 확인할 수 있습니다.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            href="/wash/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            기록 추가
          </Link>
        </section>
      ) : null}

      {!error && washLogs.length > 0 ? (
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {washLogs.map((washLog) => (
            <Link
              className="rounded-md border border-border bg-white p-5 shadow-sm transition hover:border-primary"
              href={`/wash/${washLog.id}`}
              key={washLog.id}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
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
