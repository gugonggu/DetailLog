export default function WashLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div className="h-4 w-24 rounded-md bg-muted" />
      <div className="mt-4 h-9 w-48 rounded-md bg-muted" />
      <div className="mt-3 h-5 w-full max-w-xl rounded-md bg-muted" />
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div className="rounded-md border border-border bg-white p-5 shadow-sm" key={item}>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-md bg-muted" />
              <div className="flex-1">
                <div className="h-5 w-2/3 rounded-md bg-muted" />
                <div className="mt-3 h-4 w-1/2 rounded-md bg-muted" />
                <div className="mt-3 h-4 w-1/3 rounded-md bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
