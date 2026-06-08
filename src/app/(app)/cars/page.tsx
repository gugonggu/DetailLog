import { CarFront, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { mapCarRowToCar } from "@/features/cars/car-service";
import type { CarRow } from "@/features/cars/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CarsPage() {
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

  const cars = ((data ?? []) as CarRow[]).map(mapCarRowToCar);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Cars</p>
          <h1 className="mt-3 text-3xl font-bold">내 차량</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            세차 기록을 남기기 전에 관리할 차량 프로필을 먼저 정리합니다.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          href="/cars/new"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          새 차량
        </Link>
      </section>

      {error ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          차량 목록을 불러오지 못했습니다. {error.message}
        </section>
      ) : null}

      {!error && cars.length === 0 ? (
        <section className="mt-8 rounded-md border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <CarFront className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">등록된 차량이 없습니다.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            첫 차량을 등록하면 차량별 세차 기준을 분리해서 관리할 수 있습니다.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            href="/cars/new"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            차량 등록
          </Link>
        </section>
      ) : null}

      {!error && cars.length > 0 ? (
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {cars.map((car) => (
            <Link
              className="rounded-md border border-border bg-white p-5 shadow-sm transition hover:border-primary"
              href={`/cars/${car.id}`}
              key={car.id}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
                  <CarFront className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{car.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {car.brand} {car.model} · {car.year}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {car.color} · {car.coatingType}
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
