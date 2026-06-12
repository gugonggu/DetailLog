import { LoadingCard } from "@/components/ui/states";

export default function ProfileLoading() {
  return (
    <main className="page-shell max-w-5xl" aria-label="프로필 불러오는 중">
      <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-10 w-44 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded-full bg-muted" />
      <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <LoadingCard className="min-h-64" />
        <LoadingCard className="min-h-64" />
      </section>
    </main>
  );
}
