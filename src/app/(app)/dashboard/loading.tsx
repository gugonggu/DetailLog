export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div className="h-4 w-24 rounded-md bg-muted" />
      <div className="mt-4 h-9 w-44 rounded-md bg-muted" />
      <div className="mt-3 h-5 w-full max-w-xl rounded-md bg-muted" />
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div className="rounded-md border border-border bg-white p-5 shadow-sm" key={item}>
            <div className="h-5 w-28 rounded-md bg-muted" />
            <div className="mt-4 h-8 w-20 rounded-md bg-muted" />
          </div>
        ))}
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {[1, 2].map((item) => (
          <div className="rounded-md border border-border bg-white p-5 shadow-sm" key={item}>
            <div className="h-4 w-28 rounded-md bg-muted" />
            <div className="mt-4 h-7 w-2/3 rounded-md bg-muted" />
            <div className="mt-4 h-4 w-full rounded-md bg-muted" />
            <div className="mt-3 h-4 w-3/4 rounded-md bg-muted" />
          </div>
        ))}
      </section>
    </main>
  );
}
