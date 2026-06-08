import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CarForm } from "@/features/cars/car-form";
import { mapCarRowToCar } from "@/features/cars/car-service";
import type { CarRow } from "@/features/cars/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type EditCarPageProps = {
  params: Promise<{
    carId: string;
  }>;
};

export default async function EditCarPage({ params }: EditCarPageProps) {
  const { carId } = await params;
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
    .eq("id", carId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!error && !data) {
    notFound();
  }

  const car = data ? mapCarRowToCar(data as CarRow) : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        href={car ? `/cars/${car.id}` : "/cars"}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        차량 상세
      </Link>

      {error ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          차량 정보를 불러오지 못했습니다. {error.message}
        </section>
      ) : null}

      {car ? (
        <>
          <section className="mt-6">
            <p className="text-sm font-semibold text-primary">Edit Car</p>
            <h1 className="mt-3 text-3xl font-bold">차량 수정</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              차량 기본 정보만 수정합니다. 세차 기록은 이번 단계에 포함하지 않습니다.
            </p>
          </section>
          <section className="mt-8">
            <CarForm
              mode="edit"
              userId={user.id}
              carId={car.id}
              defaultValues={{
                name: car.name,
                brand: car.brand,
                model: car.model,
                year: car.year,
                color: car.color,
                coatingType: car.coatingType,
                memo: car.memo ?? "",
              }}
            />
          </section>
        </>
      ) : null}
    </main>
  );
}
