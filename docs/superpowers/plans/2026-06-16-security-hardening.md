# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Detailog before deployment by reducing public data exposure, tightening uploads, limiting AI API abuse, and addressing dependency audit findings.

**Architecture:** Keep the existing Supabase Auth/RLS architecture. Add a security migration for public profile scoping, private wash image storage, object read policies, bucket upload constraints, and routine quota enforcement support. Update app code to sign wash image URLs server-side and validate upload files before sending them to Supabase Storage.

**Tech Stack:** Next.js App Router, TypeScript, Supabase PostgreSQL/RLS/Storage, Vitest, npm audit.

---

### Task 1: Supabase Security Migration

**Files:**
- Create: `supabase/migrations/20260616002000_security_hardening.sql`
- Modify: `src/lib/supabase/schema.test.ts`

- [x] Restrict `community_profiles` to users with at least one public wash log.
- [x] Convert `wash-images` bucket to private and set upload MIME/size limits.
- [x] Add storage object select policies for own wash images and public wash-log images.
- [x] Add avatar bucket MIME/size limits.
- [x] Add `routine_recommendations_user_recent_idx` for rate limit checks.

### Task 2: Signed Wash Image URLs

**Files:**
- Modify: `src/features/wash-images/wash-image-service.ts`
- Test: `src/features/wash-images/wash-image-service.test.ts`
- Modify server pages that render wash/community images.

- [x] Add helpers to sign wash image URLs from stored object paths.
- [x] Use signed URLs on wash detail, community list/detail, bookmarks, landing preview.
- [x] Keep DB schema stable by continuing to store canonical object URL/path-derived URL.

### Task 3: Upload Validation

**Files:**
- Create: `src/features/uploads/image-upload-policy.ts`
- Test: `src/features/uploads/image-upload-policy.test.ts`
- Modify: `src/features/profile/profile-edit-form.tsx`
- Modify: `src/features/wash-images/wash-image-manager.tsx`

- [x] Add shared allowlist and size validation.
- [x] Reject oversized or unsupported files before preview/upload.
- [x] Align input accept values with allowed MIME types.

### Task 4: Routine API Rate Limit

**Files:**
- Modify: `src/app/api/routines/route.ts`
- Test: `src/app/api/routines/route.test.ts`

- [x] Add per-user daily routine creation limit using existing table rows.
- [x] Return 429 before OpenAI call when limit is exceeded.
- [x] Keep fallback behavior unchanged for valid requests.

### Task 5: Dependency Audit And Verification

**Files:**
- Modify: `package-lock.json` if `npm audit fix` can safely update transitive dependencies.

- [x] Run `npm.cmd audit fix`.
- [x] Run focused tests.
- [x] Run `npm.cmd test`.
- [x] Run `npm.cmd run lint`.
- [x] Run `npm.cmd run build`.
- [x] Re-run `npm.cmd audit --audit-level=moderate` and report remaining framework-level advisories.
