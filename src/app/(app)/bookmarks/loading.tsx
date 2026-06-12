import { LoadingCard } from "@/components/ui/states";

export default function BookmarksLoading() {
  return (
    <main className="page-shell" aria-label="북마크 불러오는 중">
      <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-10 w-56 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded-full bg-muted" />
      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => <LoadingCard className="min-h-96" key={item} />)}
      </section>
    </main>
  );
}
