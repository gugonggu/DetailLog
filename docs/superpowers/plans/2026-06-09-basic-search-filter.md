# Basic Search And Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 세차 기록과 커뮤니티 목록에 URL search params 기반 기본 검색·필터를 추가한다.

**Architecture:** 각 feature에 URL 값을 검증하는 순수 파서와 서버 렌더링 filter form을 둔다. App Router 페이지는 파싱된 값으로 기존 Supabase query를 확장하고, 활성 필터 여부에 따라 빈 상태를 구분한다.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase, Vitest

---

### Task 1: 필터 파서

**Files:**
- Create: `src/features/wash-logs/wash-log-filters.ts`
- Create: `src/features/wash-logs/wash-log-filters.test.ts`
- Create: `src/features/community/community-filters.ts`
- Create: `src/features/community/community-filters.test.ts`

- [ ] 실패 테스트로 허용 값, 잘못된 값, 활성 필터 판정을 정의한다.
- [ ] 테스트 실패를 확인한다.
- [ ] 최소 파서를 구현한다.
- [ ] 필터 파서 테스트 통과를 확인한다.

### Task 2: 반응형 filter form

**Files:**
- Create: `src/features/wash-logs/wash-log-filter-form.tsx`
- Create: `src/features/community/community-filter-form.tsx`

- [ ] 모바일 한 열, 넓은 화면 여러 열의 GET form을 구현한다.
- [ ] 적용 버튼과 초기화 링크를 제공한다.

### Task 3: 목록 query와 빈 상태

**Files:**
- Modify: `src/app/(app)/wash/page.tsx`
- Modify: `src/app/(app)/community/page.tsx`

- [ ] URL search params를 파싱한다.
- [ ] 파싱된 조건을 기존 Supabase query에 적용한다.
- [ ] 활성 필터에서 결과가 없을 때 전용 빈 상태를 표시한다.

### Task 4: 문서와 검증

**Files:**
- Modify: `docs/architecture.md`

- [ ] 필터 전략과 지원 파라미터를 문서화한다.
- [ ] `npm test`, `npm run lint`, `npm run build`를 실행한다.
