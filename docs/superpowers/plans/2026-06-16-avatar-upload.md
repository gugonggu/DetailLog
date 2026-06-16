# Avatar Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase-backed avatar upload to the web profile page.

**Architecture:** Store avatar files in a public `avatars` Supabase Storage bucket using user-scoped paths. Persist the public avatar URL on `profiles.avatar_url`, then render and update it from the existing profile page.

**Tech Stack:** Next.js App Router, TypeScript, React Hook Form, Zod, Supabase PostgreSQL, Supabase Storage, Vitest.

---

### Task 1: Avatar Storage Helpers

**Files:**
- Modify: `src/features/profile/profile-service.ts`
- Modify: `src/features/profile/profile-schemas.test.ts`

- [x] Write failing tests for avatar object path creation and URL path extraction.
- [x] Run `npm test -- src/features/profile/profile-schemas.test.ts` and verify the new tests fail because helpers are missing.
- [x] Implement `AVATAR_BUCKET`, `createAvatarObjectPath`, and `getAvatarStoragePath`.
- [x] Run the same test and verify it passes.

### Task 2: Profile Data Shape

**Files:**
- Modify: `src/features/profile/types.ts`
- Modify: `src/features/profile/profile-service.ts`
- Modify: `src/features/profile/profile-schemas.test.ts`

- [x] Write failing tests proving profile update/upsert payloads include an optional `avatar_url`.
- [x] Run the profile tests and verify failure.
- [x] Add `avatarUrl`/`avatar_url` support to types and payload helpers.
- [x] Run the profile tests and verify success.

### Task 3: Supabase Schema

**Files:**
- Modify: `supabase/migrations/20260609000000_initial_schema.sql`
- Modify: `docs/profile-setup.md`

- [x] Add `avatar_url text` to `profiles`.
- [x] Include `avatar_url` in `community_profiles`.
- [x] Create public `avatars` bucket and insert/update/delete policies scoped to the authenticated user's top-level folder.
- [x] Document the new profile field and bucket.

### Task 4: Profile UI

**Files:**
- Modify: `src/app/(app)/profile/page.tsx`
- Modify: `src/features/profile/profile-edit-form.tsx`

- [x] Select `avatar_url` from the profile page query and pass it to the form.
- [x] Render the current avatar image when present, otherwise keep the icon fallback.
- [x] Add an image file picker with preview, upload to Supabase Storage, and update `profiles.avatar_url`.
- [x] Remove the old avatar object after a successful replacement when its path can be resolved.

### Task 5: Verification

**Files:**
- No source edits.

- [x] Run `npm test -- src/features/profile/profile-schemas.test.ts`.
- [x] Run `npm test`.
- [x] Run `npm run lint`.
