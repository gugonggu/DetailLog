import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { CarRow } from "@/features/cars/types";
import { WashImageManager } from "@/features/wash-images/wash-image-manager";
import { signWashImages } from "@/features/wash-images/wash-image-service";
import { mapWashLogRowToWashLog } from "@/features/wash-logs/wash-log-service";
import { WashLogForm } from "@/features/wash-logs/wash-log-form";
import type { WashLogRow } from "@/features/wash-logs/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type EditWashLogPageProps = {
  params: Promise<{
    washLogId: string;
  }>;
};

const washLogSelect =
  "id,user_id,car_id,title,wash_date,location,duration_minutes,cost,weather,dirt_level,satisfaction,memo,visibility,created_at,updated_at,cars(id,name,brand,model),wash_steps(id,wash_log_id,step_type,product_name,memo,step_order,created_at),wash_images(id,wash_log_id,wash_step_id,object_path,image_url,image_type,is_representative,created_at)";

export default async function EditWashLogPage({ params }: EditWashLogPageProps) {
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

  const [{ data: washLogData, error: washLogError }, { data: carData, error: carError }] =
    await Promise.all([
      supabase
        .from("wash_logs")
        .select(washLogSelect)
        .eq("id", washLogId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("cars")
        .select("id,user_id,name,brand,model,year,color,coating_type,memo,created_at,updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  if (!washLogError && !washLogData) {
    notFound();
  }

  const washLog = washLogData ? mapWashLogRowToWashLog(washLogData as WashLogRow) : null;
  const signedImages = washLog ? await signWashImages(supabase, washLog.images) : [];
  const cars = ((carData ?? []) as CarRow[]).map((car) => ({
    id: car.id,
    name: car.name,
    brand: car.brand,
    model: car.model,
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        href={washLog ? `/wash/${washLog.id}` : "/wash"}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        세차 기록 상세
      </Link>

      {washLogError || carError ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          수정 정보를 불러오지 못했습니다. {washLogError?.message ?? carError?.message}
        </section>
      ) : null}

      {washLog && !washLogError && !carError ? (
        <>
          <section className="mt-6">
            <p className="text-sm font-semibold text-primary">Edit Wash Log</p>
            <h1 className="mt-3 text-3xl font-bold">세차 기록 수정</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              세차 정보, 단계 기록, 이미지를 한 화면에서 수정합니다.
            </p>
          </section>
          <section className="mt-8">
            <WashLogForm
              mode="edit"
              userId={user.id}
              cars={cars}
              washLogId={washLog.id}
              defaultValues={{
                carId: washLog.carId,
                title: washLog.title,
                washDate: washLog.washDate,
                location: washLog.location ?? "",
                durationMinutes: washLog.durationMinutes,
                cost: washLog.cost,
                weather: washLog.weather ?? "",
                dirtLevel: washLog.dirtLevel,
                satisfaction: washLog.satisfaction,
                memo: washLog.memo ?? "",
                visibility: washLog.visibility,
                steps: washLog.steps.map((step) => ({
                  stepType: step.stepType,
                  productName: step.productName ?? "",
                  memo: step.memo ?? "",
                  stepOrder: step.stepOrder,
                })),
              }}
            />
          </section>
          <WashImageManager
            userId={user.id}
            washLogId={washLog.id}
            initialImages={signedImages}
          />
        </>
      ) : null}
    </main>
  );
}
