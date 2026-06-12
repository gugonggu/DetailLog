import { ArrowLeft, CalendarDays, CarFront, Palette, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { mapCarRowToCar } from "@/features/cars/car-service";
import { DeleteCarButton } from "@/features/cars/delete-car-button";
import type { CarRow } from "@/features/cars/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CarDetailPageProps = {
  params: Promise<{
    carId: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "정보 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
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
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        href="/cars"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        차량 목록
      </Link>

      {error ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          차량 정보를 불러오지 못했습니다. {error.message}
        </section>
      ) : null}

      {car ? (
        <>
          <section className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Car Detail</p>
              <h1 className="mt-3 text-3xl font-bold">{car.name}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {car.brand} {car.model} · {car.year}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold shadow-sm transition hover:border-primary"
                href={`/cars/${car.id}/edit`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                수정
              </Link>
              <DeleteCarButton carId={car.id} userId={user.id} />
            </div>
          </section>

          <section className="mt-8 rounded-md border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <CarFront className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">차량 기본 정보</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  차량별 세차 기록은 다음 단계에서 연결합니다.
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoItem label="브랜드" value={car.brand} />
              <InfoItem label="모델" value={car.model} />
              <InfoItem label="연식" value={`${car.year}`} />
              <InfoItem
                label="색상"
                value={car.color}
                icon={<Palette className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem label="도장면 보호 상태" value={car.coatingType} />
              <InfoItem
                label="등록일"
                value={formatDate(car.createdAt)}
                icon={<CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
            </dl>

            <div className="mt-5 rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold">메모</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {car.memo || "메모가 없습니다."}
              </p>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

type InfoItemProps = {
  label: string;
  value: string;
  icon?: ReactNode;
};

function InfoItem({ label, value, icon }: InfoItemProps) {
  return (
    <div className="rounded-md border border-border p-4">
      <dt className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </dt>
      <dd className="mt-2 text-sm text-muted-foreground">{value}</dd>
    </div>
  );
}
