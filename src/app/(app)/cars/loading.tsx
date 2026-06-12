import { LoadingCard } from "@/components/ui/states";

export default function CarsLoading() {
  return (
    <main className="page-shell" aria-label="차량 목록 불러오는 중">
      <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-10 w-40 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-5 w-full max-w-lg animate-pulse rounded-full bg-muted" />
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => <LoadingCard className="min-h-36" key={item} />)}
      </section>
    </main>
  );
}
