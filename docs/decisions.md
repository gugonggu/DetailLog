# Decisions

## 2026-05-19: Start With Responsive Web MVP

Decision: Detailog starts as a responsive web service targeting Vercel.

Trade-off: This keeps the first release smaller and easier to deploy, but native mobile-specific capabilities are intentionally deferred.

## 2026-05-19: Use App Router Route Groups

Decision: Use `src/app/(marketing)`, `src/app/(auth)`, and `src/app/(app)` route groups.

Trade-off: Route groups add a little folder nesting, but they keep public, auth, and product areas separate without changing URLs.

## 2026-05-19: Delay Supabase And OpenAI Connections

Decision: Do not connect Supabase or OpenAI in the initial scaffold.

Trade-off: The app is not functional yet, but the review surface stays small and avoids premature secret, schema, and API design decisions.
