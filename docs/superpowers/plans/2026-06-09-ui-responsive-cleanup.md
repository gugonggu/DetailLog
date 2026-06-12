# Detailog UI Responsive Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 주요 Detailog 화면을 토스풍의 현대적인 제품 UI로 정돈하고 모바일 내비게이션, 공통 상태 UI, 읽기 쉬운 폼을 제공한다.

**Architecture:** 인증과 데이터 흐름은 유지하고 `src/components/ui`에 반복이 명확한 layout 및 state component만 추가한다. 기존 page와 feature form은 이 component와 공통 Tailwind 규칙을 적용하며, 모바일 메뉴의 열림 상태만 client component로 격리한다.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, React, lucide-react, Vitest

---

### Task 1: 공통 UI 기반과 모바일 내비게이션

**Files:**
- Create: `src/components/ui/page-header.tsx`
- Create: `src/components/ui/states.tsx`
- Create: `src/components/ui/app-navigation.tsx`
- Create: `src/components/ui/ui-components.test.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: 공통 component의 class contract를 검증하는 failing test 작성**
- [ ] **Step 2: `npm test -- src/components/ui/ui-components.test.ts`를 실행해 component 부재로 실패 확인**
- [ ] **Step 3: `PageHeader`, `EmptyState`, `ErrorState`, `LoadingCard`, `AppNavigation` 최소 구현**
- [ ] **Step 4: 공통 배경, focus, selection 및 card utility style 정리**
- [ ] **Step 5: app layout에 desktop navigation과 mobile hamburger 적용**
- [ ] **Step 6: 관련 test 실행 후 통과 확인**

### Task 2: 주요 목록 및 요약 페이지 정리

**Files:**
- Modify: `src/features/landing/landing-page.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/cars/page.tsx`
- Modify: `src/app/(app)/wash/page.tsx`
- Modify: `src/app/(app)/community/page.tsx`
- Modify: `src/app/(app)/bookmarks/page.tsx`
- Modify: `src/app/(app)/profile/page.tsx`
- Modify: `src/features/community/community-feed-card.tsx`

- [ ] **Step 1: 페이지별 깨진 한글과 반복 header/state 위치 목록 확인**
- [ ] **Step 2: `PageHeader`, `EmptyState`, `ErrorState`를 주요 페이지에 적용**
- [ ] **Step 3: 카드 radius, padding, hover, metric hierarchy를 공통 규칙으로 정리**
- [ ] **Step 4: landing과 profile의 모바일 action 및 grid 동작 정리**
- [ ] **Step 5: 검색·필터 business logic과 query가 유지됐는지 diff 검토**

### Task 3: 폼 가독성과 제출 상태 정리

**Files:**
- Modify: `src/app/(app)/routine/new/page.tsx`
- Modify: `src/features/cars/car-form.tsx`
- Modify: `src/features/wash-logs/wash-log-form.tsx`
- Modify: `src/features/routines/routine-form.tsx`
- Modify: `src/features/profile/profile-edit-form.tsx`
- Modify: `src/features/wash-logs/wash-log-filter-form.tsx`
- Modify: `src/features/community/community-filter-form.tsx`

- [ ] **Step 1: 폼의 깨진 한글, label/helper/error 상태를 기존 schema 의미와 대조**
- [ ] **Step 2: form container와 section hierarchy를 일관되게 정리**
- [ ] **Step 3: input focus ring, error text, helper text 및 모바일 submit button 적용**
- [ ] **Step 4: field name, register binding, submit handler가 바뀌지 않았는지 diff 검토**

### Task 4: Loading UI와 문서 정리

**Files:**
- Create: `src/app/(app)/bookmarks/loading.tsx`
- Create: `src/app/(app)/routine/new/loading.tsx`
- Modify: `src/app/(app)/dashboard/loading.tsx`
- Modify: `src/app/(app)/cars/loading.tsx`
- Modify: `src/app/(app)/wash/loading.tsx`
- Modify: `src/app/(app)/community/loading.tsx`
- Modify: `src/app/(app)/profile/loading.tsx`
- Modify: `docs/architecture.md`

- [ ] **Step 1: 공통 `LoadingCard`를 기존 loading route에 적용**
- [ ] **Step 2: `/bookmarks`, `/routine/new` loading route 추가**
- [ ] **Step 3: `docs/architecture.md`에 공통 UI 경계와 모바일 navigation 결정 기록**

### Task 5: 검증

**Files:**
- Verify only

- [ ] **Step 1: `npm test` 실행**
- [ ] **Step 2: `npm run build` 실행**
- [ ] **Step 3: 개발 서버 실행 후 Browser로 `/`, `/dashboard`, `/cars`, `/wash`, `/routine/new`, `/community`, `/bookmarks`, `/profile` 확인**
- [ ] **Step 4: 390px mobile viewport에서 hamburger, single-column cards, full-width actions, overflow 확인**
- [ ] **Step 5: 1440px desktop viewport에서 header, grid, card hierarchy 확인**
- [ ] **Step 6: git diff로 business logic 변경 여부와 기존 사용자 변경 보존 확인**
