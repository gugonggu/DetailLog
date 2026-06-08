import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CarForm } from "@/features/cars/car-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewCarPage() {
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

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        href="/cars"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        차량 목록
      </Link>
      <section className="mt-6">
        <p className="text-sm font-semibold text-primary">New Car</p>
        <h1 className="mt-3 text-3xl font-bold">차량 등록</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          세차 루틴과 기록을 분리해서 볼 수 있도록 기본 차량 정보를 저장합니다.
        </p>
      </section>
      <section className="mt-8">
        <CarForm mode="create" userId={user.id} />
      </section>
    </main>
  );
}
