# Car Paint Protection Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 차량 등록 및 수정 화면에서 도장면 보호 상태를 명확한 선택 목록으로 입력한다.

**Architecture:** 선택값과 기존 값 호환 로직은 차량 기능의 스키마 모듈에 둔다. 폼은 해당 목록을 렌더링하고 기존 DB 식별자는 유지한다.

**Tech Stack:** Next.js App Router, TypeScript, React Hook Form, Zod, Vitest

---

### Task 1: 선택값 계약

**Files:**
- Modify: `src/features/cars/car-schemas.test.ts`
- Modify: `src/features/cars/schemas.ts`

- [x] 선택 목록과 임의 값 거부 테스트를 작성하고 실패를 확인한다.
- [x] 선택값 상수, Zod enum, 기존 값 호환 함수를 구현한다.
- [x] 차량 스키마 테스트를 통과시킨다.

### Task 2: 폼과 상세 라벨

**Files:**
- Modify: `src/features/cars/car-form.tsx`
- Modify: `src/app/(app)/cars/[carId]/page.tsx`

- [x] 자유 입력을 선택 목록으로 변경한다.
- [x] 신규 기본값을 `잘 모르겠음`으로 설정한다.
- [x] 상세 화면 라벨을 `도장면 보호 상태`로 변경한다.

### Task 3: 전체 검증

**Files:**
- Verify: project

- [x] `npm test`를 실행한다.
- [x] `npm run lint`를 실행한다.
- [x] `npm run build`를 실행한다.
