import { LoadingCard } from "@/components/ui/states";

export default function WashLoading() {
  return (
    <main className="page-shell" aria-label="세차 기록 불러오는 중">
      <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-10 w-48 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded-full bg-muted" />
      <LoadingCard className="mt-8 min-h-48" />
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => <LoadingCard className="min-h-36" key={item} />)}
      </section>
    </main>
  );
}
