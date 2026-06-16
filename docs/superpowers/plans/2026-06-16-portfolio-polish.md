# Portfolio Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare Detailog for portfolio presentation by removing visible MVP rough edges, polishing the dashboard, connecting profile avatars to community data, and updating documentation.

**Architecture:** Keep business behavior stable and improve product-facing presentation. Add tested summary helpers where logic changes; use focused UI rewrites for corrupted Korean copy and portfolio README content.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase, Vitest.

---

### Task 1: Dashboard Product Polish

**Files:**
- Modify: `src/features/dashboard/dashboard-summary.ts`
- Modify: `src/features/dashboard/dashboard-summary.test.ts`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [x] Add tested dashboard helper logic for average wash cost.
- [x] Replace corrupted Korean copy with product-ready dashboard text.
- [x] Keep existing Supabase queries and route behavior stable.

### Task 2: Community/Profile Polish

**Files:**
- Modify: `src/features/community/types.ts`
- Modify: `src/features/community/community-service.ts`
- Modify: `src/features/community/community-service.test.ts`
- Modify: `src/features/community/community-feed-card.tsx`
- Modify: `src/app/(app)/community/page.tsx`
- Modify: `src/app/(marketing)/page.tsx`

- [x] Expose `avatar_url` through community author mapping.
- [x] Render author avatar fallback on community cards and landing preview cards.
- [x] Keep anonymous public preview RLS scope unchanged.

### Task 3: Korean Copy Sweep

**Files:**
- Modify visible app screens under `src/app` and `src/features`.

- [x] Scan for corrupted Korean text.
- [x] Fix visible page titles, empty states, error states, labels, and CTA text.
- [x] Avoid unrelated behavior changes.

### Task 4: Portfolio README

**Files:**
- Modify: `README.md`

- [x] Replace stale MVP placeholder status with current implemented features.
- [x] Add architecture, setup, verification, and portfolio notes.

### Task 5: Verification

**Files:**
- No source edits.

- [x] Run focused tests.
- [x] Run `npm.cmd test`.
- [x] Run `npm.cmd run lint`.
- [x] Run `npm.cmd run build`.
- [x] Browser-check dashboard and landing.
