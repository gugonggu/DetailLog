import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        href="/dashboard"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        대시보드
      </Link>

      <section className="mt-6">
        <p className="text-sm font-semibold text-primary">AI Routine</p>
        <h1 className="mt-3 text-3xl font-bold">AI 세차 루틴 추천</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          차량 상태와 보유 제품을 바탕으로 모바일에서 읽기 쉬운 단계별 세차 루틴을
          생성합니다.
        </p>
      </section>

      {error ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          차량 목록을 불러오지 못했습니다. {error.message}
        </section>
      ) : null}

      {!error ? (
        <section className="mt-8">
          <RoutineForm cars={cars} />
        </section>
      ) : null}
    </main>
  );
}
