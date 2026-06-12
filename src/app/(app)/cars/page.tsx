import { CarFront, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
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
    <main className="page-shell">
      <PageHeader
        eyebrow="Cars"
        title="내 차량"
        description="세차 기록을 남기기 전에 관리할 차량 프로필을 먼저 정리합니다."
        action={
          <Link className="primary-action" href="/cars/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            새 차량
          </Link>
        }
      />

      {error ? (
        <ErrorState
          className="mt-8"
          title="차량 목록을 불러오지 못했습니다."
          description={error.message}
        />
      ) : null}

      {!error && cars.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<CarFront className="h-7 w-7" aria-hidden="true" />}
          title="등록된 차량이 없습니다."
          description="첫 차량을 등록하면 차량별 세차 기준을 분리해서 관리할 수 있습니다."
          action={
            <Link className="primary-action" href="/cars/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              차량 등록
            </Link>
          }
        />
      ) : null}

      {!error && cars.length > 0 ? (
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {cars.map((car) => (
            <Link
              className="surface-card p-5 transition hover:-translate-y-0.5 hover:border-primary sm:p-6"
              href={`/cars/${car.id}`}
              key={car.id}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CarFront className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold">{car.name}</h2>
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
