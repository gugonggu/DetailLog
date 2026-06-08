# Troubleshooting

## Dependencies Do Not Install

Check the Node.js version first:

```bash
node --version
npm --version
```

Use an active LTS version of Node.js. Then retry:

```bash
npm install
```

## Development Server Does Not Start

Run:

```bash
npm run dev
```

If port `3000` is already in use, Next.js usually offers another port. Open the URL printed in the terminal.

## Tailwind Styles Do Not Apply

Check that `src/app/globals.css` is imported by `src/app/layout.tsx`, and confirm the route files live under `src/app`.

## Build Fails After Adding Integrations

Confirm required environment variables exist in `.env.local` and Vercel project settings. Supabase Auth requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Build Fails With useSearchParams

If a client component uses `useSearchParams()` inside an App Router page, wrap that client component in `Suspense`. Next.js can otherwise fail prerendering with a missing suspense boundary error.

## Supabase Nested Select Type Looks Like an Array

Supabase nested selects can infer a joined relation as an array even when the relationship is conceptually one row, for example `wash_logs` selecting `cars(id,name,brand,model)`. Keep the feature mapper defensive by accepting either a single object or an array and normalizing it before returning the app-facing type.

## Vitest Cannot Resolve Next Alias In Feature Helpers

When a feature helper is imported by Vitest directly, prefer relative imports between nearby feature modules unless the test runner is configured with the Next.js `@/` alias. This keeps helper tests runnable with the current `vitest run` setup.
