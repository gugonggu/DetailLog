type PlaceholderPageProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function PlaceholderPage({
  title,
  description,
  eyebrow = "Detailog MVP",
}: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
        <div className="mt-8 grid gap-3 rounded-md border border-border bg-white p-4 text-sm text-muted-foreground shadow-sm sm:grid-cols-3">
          <span>Responsive web MVP</span>
          <span>Supabase not connected</span>
          <span>OpenAI not connected</span>
        </div>
      </section>
    </main>
  );
}
