export default function CarsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <section>
        <div className="h-4 w-20 rounded-md bg-muted" />
        <div className="mt-4 h-9 w-40 rounded-md bg-muted" />
        <div className="mt-4 h-5 w-full max-w-lg rounded-md bg-muted" />
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            className="h-32 rounded-md border border-border bg-white p-5 shadow-sm"
            key={item}
          >
            <div className="h-12 w-12 rounded-md bg-muted" />
            <div className="mt-4 h-5 w-1/2 rounded-md bg-muted" />
            <div className="mt-3 h-4 w-2/3 rounded-md bg-muted" />
          </div>
        ))}
      </section>
    </main>
  );
}
