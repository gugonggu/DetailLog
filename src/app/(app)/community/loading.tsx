import { Droplets } from "lucide-react";

export default function CommunityLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <section>
        <p className="text-sm font-semibold text-primary">Community</p>
        <h1 className="mt-3 text-3xl font-bold">공개 세차 기록</h1>
        <p className="mt-3 h-5 max-w-xl animate-pulse rounded-md bg-muted" />
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <article
            className="overflow-hidden rounded-md border border-border bg-white shadow-sm"
            key={item}
          >
            <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
              <Droplets className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className="space-y-3 p-5">
              <div className="h-5 w-2/3 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-16 animate-pulse rounded-md bg-muted" />
                <div className="h-16 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
