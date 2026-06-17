import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  Clock,
  MapPin,
  Pencil,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { signWashImages } from "@/features/wash-images/wash-image-service";
import { DeleteWashLogButton } from "@/features/wash-logs/delete-wash-log-button";
import { mapWashLogRowToWashLog } from "@/features/wash-logs/wash-log-service";
import type { WashLogRow } from "@/features/wash-logs/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type WashLogDetailPageProps = {
  params: Promise<{
    washLogId: string;
  }>;
};

const washLogSelect =
  "id,user_id,car_id,title,wash_date,location,duration_minutes,cost,weather,dirt_level,satisfaction,memo,visibility,created_at,updated_at,cars(id,name,brand,model),wash_steps(id,wash_log_id,step_type,product_name,memo,step_order,created_at),wash_images(id,wash_log_id,wash_step_id,object_path,image_url,image_type,is_representative,created_at)";

const imageTypeLabels = {
  before: "세차 전",
  after: "세차 후",
  process: "과정",
  etc: "기타",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function WashLogDetailPage({ params }: WashLogDetailPageProps) {
  const { washLogId } = await params;
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
    .eq("id", washLogId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!error && !data) {
    notFound();
  }

  const washLog = data ? mapWashLogRowToWashLog(data as WashLogRow) : null;
  const signedImages = washLog ? await signWashImages(supabase, washLog.images) : [];
  const logImages = signedImages.filter((image) => !image.washStepId);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        href="/wash"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        세차 기록 목록
      </Link>

      {error ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          세차 기록을 불러오지 못했습니다. {error.message}
        </section>
      ) : null}

      {washLog ? (
        <>
          <section className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Wash Log Detail</p>
              <h1 className="mt-3 text-3xl font-bold">{washLog.title}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {washLog.car?.name ?? "차량 정보 없음"} · {formatDate(washLog.washDate)} ·{" "}
                {washLog.visibility === "private" ? "비공개" : "공개"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold shadow-sm transition hover:border-primary"
                href={`/wash/${washLog.id}/edit`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                수정
              </Link>
              <DeleteWashLogButton washLogId={washLog.id} userId={user.id} />
            </div>
          </section>

          <section className="mt-8 rounded-md border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <CarFront className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">기록 요약</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  세차 기본 정보와 만족도를 확인합니다.
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoItem
                label="세차일"
                value={formatDate(washLog.washDate)}
                icon={<CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem
                label="소요 시간"
                value={`${washLog.durationMinutes}분`}
                icon={<Clock className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem
                label="비용"
                value={formatCurrency(washLog.cost)}
                icon={<Wallet className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem
                label="장소"
                value={washLog.location ?? "입력 없음"}
                icon={<MapPin className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem label="날씨" value={washLog.weather ?? "입력 없음"} />
              <InfoItem label="오염도" value={`${washLog.dirtLevel}/5`} />
              <InfoItem label="만족도" value={`${washLog.satisfaction}/5`} />
              <InfoItem
                label="차량"
                value={
                  washLog.car
                    ? `${washLog.car.name} · ${washLog.car.brand} ${washLog.car.model}`
                    : "차량 정보 없음"
                }
              />
            </dl>

            <div className="mt-5 rounded-md border border-border p-4">
              <h3 className="text-sm font-semibold">메모</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {washLog.memo || "메모가 없습니다."}
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-md border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">세차 이미지</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  이미지는 수정 화면에서 추가, 삭제, 대표 지정할 수 있습니다.
                </p>
              </div>
              <Link
                className="secondary-action h-10 px-3"
                href={`/wash/${washLog.id}/edit`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                이미지 수정
              </Link>
            </div>

            {logImages.length === 0 ? (
              <div className="mt-5 rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                아직 등록된 세차 이미지가 없습니다.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {logImages.map((image) => (
                  <article className="overflow-hidden rounded-md border border-border" key={image.id}>
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        src={image.imageUrl}
                        alt={`${imageTypeLabels[image.imageType]} 세차 이미지`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                        unoptimized
                      />
                      {image.isRepresentative ? (
                        <span className="absolute left-3 top-3 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                          대표 이미지
                        </span>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <span className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {imageTypeLabels[image.imageType]}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-md border border-border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">세차 단계</h2>
            <div className="mt-5 space-y-4">
              {washLog.steps.map((step) => {
                const stepImages = signedImages.filter((image) => image.washStepId === step.id);

                return (
                  <div className="rounded-md border border-border p-4" key={step.id}>
                    <p className="text-sm font-semibold text-primary">단계 {step.stepOrder}</p>
                    <h3 className="mt-2 text-lg font-semibold">{step.stepType}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      제품: {step.productName ?? "입력 없음"}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {step.memo || "단계 메모가 없습니다."}
                    </p>
                    {stepImages.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {stepImages.map((image) => (
                          <div className="overflow-hidden rounded-md border border-border" key={image.id}>
                            <div className="relative aspect-[4/3] bg-muted">
                              <Image
                                src={image.imageUrl}
                                alt={`${step.stepType} 단계 이미지`}
                                fill
                                className="object-cover"
                                sizes="(min-width: 1024px) 28vw, (min-width: 640px) 42vw, 86vw"
                                unoptimized
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
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
