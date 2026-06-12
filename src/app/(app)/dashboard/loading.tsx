import { LoadingCard } from "@/components/ui/states";

export default function DashboardLoading() {
  return (
    <main className="page-shell" aria-label="대시보드 불러오는 중">
      <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-10 w-48 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded-full bg-muted" />
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <LoadingCard className="min-h-32" key={item} />)}
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {[1, 2].map((item) => <LoadingCard className="min-h-48" key={item} />)}
      </section>
    </main>
  );
}
