import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/states";
import type { CarRow } from "@/features/cars/types";
import { RoutineForm } from "@/features/routines/routine-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewRoutinePage() {
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
    .from("cars")
    .select("id,user_id,name,brand,model,year,color,coating_type,memo,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const cars = ((data ?? []) as CarRow[]).map((car) => ({
    id: car.id,
    name: car.name,
    brand: car.brand,
    model: car.model,
    color: car.color,
    coatingType: car.coating_type,
  }));

  return (
    <main className="page-shell max-w-4xl">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        href="/dashboard"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        대시보드
      </Link>

      <PageHeader
        className="mt-6"
        eyebrow="AI Routine"
        title="AI 세차 루틴 추천"
        description="차량 상태와 보유 제품을 바탕으로 모바일에서 읽기 쉬운 단계별 세차 루틴을 생성합니다."
      />

      {error ? (
        <ErrorState className="mt-8" title="차량 목록을 불러오지 못했습니다." description={error.message} />
      ) : null}

      {!error ? (
        <section className="mt-8">
          <RoutineForm cars={cars} />
        </section>
      ) : null}
    </main>
  );
}
