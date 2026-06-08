export default function ProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
      <section>
        <div className="h-4 w-16 rounded-md bg-muted" />
        <div className="mt-4 h-9 w-44 rounded-md bg-muted" />
        <div className="mt-4 h-5 w-full max-w-xl rounded-md bg-muted" />
      </section>
      <section className="mt-8 rounded-md border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-muted" />
          <div className="space-y-3">
            <div className="h-7 w-36 rounded-md bg-muted" />
            <div className="h-4 w-52 rounded-md bg-muted" />
          </div>
        </div>
      </section>
    </main>
  );
}
