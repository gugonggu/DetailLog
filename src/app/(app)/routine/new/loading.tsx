import { LoadingCard } from "@/components/ui/states";

export default function RoutineLoading() {
  return (
    <main className="page-shell max-w-4xl" aria-label="AI 루틴 폼 불러오는 중">
      <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-6 h-4 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded-full bg-muted" />
      <LoadingCard className="mt-8 min-h-[32rem]" />
    </main>
  );
}
