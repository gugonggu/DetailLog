# Product Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the MVP-style landing page with a product-grade hybrid home that combines product positioning and public community preview.

**Architecture:** Add a tested community preview mapper, then render `/` as a server page that fetches recent public wash logs with the anon Supabase client. Add a Supabase migration that exposes only public community preview data to anon users.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL/RLS, Vitest.

---

### Task 1: Preview Data Mapper

**Files:**
- Modify: `src/features/community/community-service.ts`
- Modify: `src/features/community/community-service.test.ts`

- [x] Write a failing test for `mapLandingPreviewRows` limiting public feed items to three.
- [x] Run `npm.cmd test -- src/features/community/community-service.test.ts` and confirm failure.
- [x] Implement `mapLandingPreviewRows`.
- [x] Run the same test and confirm success.

### Task 2: Public Home UI

**Files:**
- Modify: `src/app/(marketing)/page.tsx`
- Modify: `src/features/landing/landing-page.tsx`

- [x] Query recent public wash logs and community profiles from the marketing home page.
- [x] Pass preview items and loading error state into `LandingPage`.
- [x] Replace MVP copy with production Korean copy and render preview cards.
- [x] Keep CTA links to `/signup`, `/login`, and `/community`.

### Task 3: Public Read Policies

**Files:**
- Create: `supabase/migrations/20260616001000_public_landing_preview.sql`
- Modify: `docs/security-rls.md`

- [x] Grant anon select access to `community_profiles`, public `wash_logs`, public `wash_images`, and public car summaries needed for previews.
- [x] Keep write policies authenticated-only.
- [x] Document the public-preview RLS boundary.

### Task 4: Verification

**Files:**
- No source edits.

- [x] Run `npm.cmd test -- src/features/community/community-service.test.ts`.
- [x] Run `npm.cmd test`.
- [x] Run `npm.cmd run lint`.
- [x] Run `npm.cmd run build`.
- [x] Open `/` in the browser and verify the home renders.
