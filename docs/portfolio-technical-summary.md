# Detailog Portfolio Technical Summary

## 프로젝트 개요

Detailog는 차량별 세차 기록을 관리하고, AI 세차 루틴을 추천받으며, 공개 기록을 커뮤니티에 공유할 수 있는 반응형 웹 서비스입니다.

이 프로젝트의 목표는 단순한 CRUD 앱이 아니라 실제 배포를 고려한 풀스택 제품 흐름을 구현하는 것이었습니다. 인증, 데이터 권한, 이미지 업로드, AI API, 공개/비공개 데이터 경계, 배포 전 보안 보강을 한 프로젝트 안에서 연결했습니다.

## 핵심 기능

### 인증과 프로필

- Supabase Auth로 회원가입, 로그인, 로그아웃을 구현했습니다.
- middleware와 app layout에서 보호 라우트를 확인해 비로그인 사용자를 `/login`으로 보냅니다.
- 프로필은 `profiles` 테이블에 저장하고, 사용자는 닉네임과 아바타를 관리할 수 있습니다.
- 아바타는 Supabase Storage `avatars` bucket에 사용자 ID 기반 경로로 업로드합니다.

### 차량 관리

- 사용자는 차량을 등록하고, 수정하고, 상세 정보를 확인할 수 있습니다.
- 모든 차량 쿼리는 `user_id = auth.uid()` 기준의 RLS 정책으로 보호됩니다.
- 앱 코드에서도 `user_id` 필터를 명시해 잘못된 클라이언트 요청을 먼저 걸러냅니다.

### 세차 기록 관리

- 차량별 세차 기록을 생성, 조회, 수정, 삭제할 수 있습니다.
- 세차 날짜, 위치, 비용, 날씨, 오염도, 만족도, 메모, 공개 여부를 기록합니다.
- 세차 단계는 `wash_steps` child table로 관리하며, 순서가 있는 작업 로그를 저장합니다.
- 세차 이미지는 `wash_images` metadata table과 Supabase Storage를 함께 사용합니다.

### 이미지 업로드

- 세차 이미지는 `{userId}/{washLogId}/{timestamp}-{randomId}.{ext}` 경로로 저장합니다.
- Storage object path의 첫 번째 segment를 사용자 ID로 고정해 RLS 정책에서 소유자를 판별할 수 있게 했습니다.
- 업로드 파일은 JPG, PNG, WEBP만 허용합니다.
- 아바타는 2MB, 세차 이미지는 5MB 제한을 둡니다.
- 세차 이미지는 private bucket에 저장하고, 서버에서 signed URL을 발급해 렌더링합니다.

### AI 루틴 추천

- `/api/routines` Route Handler에서 OpenAI Responses API를 호출합니다.
- OpenAI API key는 서버 환경 변수로만 사용하고 클라이언트에 노출하지 않습니다.
- 입력은 Zod schema로 검증하고, OpenAI 응답도 Zod로 다시 검증합니다.
- AI 응답이 JSON이 아니거나 스키마에 맞지 않으면 안전한 fallback 루틴을 제공합니다.
- 사용자별 하루 10회 생성 제한을 두어 비용 남용을 줄였습니다.

### 커뮤니티

- 사용자는 세차 기록을 `public`으로 설정해 커뮤니티에 공유할 수 있습니다.
- 커뮤니티 피드와 상세 화면은 `visibility = 'public'`인 기록만 조회합니다.
- 좋아요와 북마크는 `reactions` table에서 `like`, `bookmark` type으로 관리합니다.
- 북마크 페이지는 현재 사용자가 저장한 공개 기록만 보여주며, 기록이 비공개로 바뀌면 목록에서 제외됩니다.
- 랜딩 페이지는 비로그인 사용자도 최근 공개 기록을 미리 볼 수 있게 설계했습니다.

## 기술적 의사결정

### 1. Next.js App Router와 route group 분리

라우트는 세 영역으로 나눴습니다.

```text
src/app/(marketing)  공개 랜딩
src/app/(auth)       로그인, 회원가입
src/app/(app)        로그인 후 제품 화면
```

이 구조는 URL을 깔끔하게 유지하면서도 공개 화면, 인증 화면, 제품 화면의 layout과 접근 제어를 분리하기 좋았습니다.

### 2. Feature 기반 폴더 구조

기능별 UI, schema, service, test를 `src/features` 아래에 모았습니다.

예를 들어 세차 이미지 기능은 다음처럼 나뉩니다.

```text
src/features/wash-images/wash-image-manager.tsx
src/features/wash-images/wash-image-service.ts
src/features/wash-images/wash-image-service.test.ts
src/features/wash-images/types.ts
```

이 방식은 App Router page가 데이터 로딩과 routing을 맡고, feature module이 실제 도메인 로직을 갖도록 역할을 분리합니다.

### 3. Supabase RLS를 최종 권한 경계로 사용

앱 코드의 `user_id` 필터는 사용자 경험과 1차 방어를 위한 것입니다. 최종 데이터 보호는 Supabase RLS가 담당합니다.

대표 정책 방향:

- 사용자는 본인 `profiles`, `cars`, `wash_logs`, `routine_recommendations`만 수정할 수 있습니다.
- `wash_steps`, `wash_images`는 parent `wash_logs`의 소유권 또는 공개 여부를 기준으로 접근합니다.
- 익명 사용자는 랜딩 프리뷰에 필요한 공개 데이터만 읽을 수 있습니다.
- 공개 프로필 view는 공개 세차 기록을 가진 사용자만 노출합니다.

### 4. Public URL 대신 signed URL 사용

초기에는 `wash-images` bucket을 public으로 두면 구현이 단순했습니다. 하지만 private 세차 기록의 이미지 URL을 아는 사용자가 파일에 직접 접근할 수 있다는 문제가 있었습니다.

최종 구조는 다음처럼 바꿨습니다.

- `wash-images` bucket은 private
- DB에는 기존 image URL 형태를 저장해 object path를 추출할 수 있게 유지
- 서버 컴포넌트에서 `createSignedUrl`로 임시 URL 발급
- 커뮤니티, 북마크, 랜딩, 세차 상세 화면은 signed URL을 렌더링

이 변경으로 DB RLS와 Storage 접근 제어가 서로 어긋나지 않게 맞췄습니다.

### 5. AI API fallback 설계

AI 기능은 외부 API와 모델 응답에 의존하기 때문에 실패 가능성을 기본 전제로 두었습니다.

처리 방식:

- OpenAI 응답은 strict JSON Schema로 요청
- 응답 본문은 다시 Zod로 검증
- JSON parse 실패, schema mismatch, API 오류는 fallback 루틴으로 전환
- fallback 여부와 이유를 응답에 포함
- 서버 로그에는 fallback reason을 남김

이렇게 해서 AI 기능이 실패해도 사용자는 루틴 생성 흐름을 계속 경험할 수 있습니다.

### 6. 비용 보호를 위한 rate limit

AI 루틴은 실제 비용이 발생할 수 있는 기능입니다. 그래서 `/api/routines`에서 저장된 `routine_recommendations` row 수를 기준으로 사용자별 일일 10회 제한을 둡니다.

제한 초과 시 OpenAI 호출 전에 `429`를 반환합니다.

## 보안 처리

### 인증과 라우트 보호

- middleware에서 보호 route prefix를 검사합니다.
- 비로그인 사용자는 `/login`으로 이동합니다.
- 로그인 사용자가 `/login`, `/signup`에 접근하면 `/dashboard`로 이동합니다.
- App route group layout에서도 서버에서 `auth.getUser()`를 확인합니다.

### RLS 정책

주요 table은 모두 RLS를 활성화했습니다.

- `profiles`
- `cars`
- `wash_logs`
- `wash_steps`
- `wash_images`
- `routine_recommendations`
- `reactions`

정책은 “본인 데이터 수정”과 “공개 기록 읽기”를 명확히 분리했습니다.

### Storage 정책

- `avatars`: 사용자 ID 폴더에만 upload/update/delete 가능
- `wash-images`: 사용자 ID 폴더에만 upload/update/delete 가능
- `wash-images`: 본인 이미지 또는 공개 wash log에 연결된 이미지만 select 가능
- bucket level에서 MIME type과 file size 제한 적용

### 공개 데이터 최소화

랜딩 페이지는 공개 기록 preview를 보여주지만, 익명 사용자가 읽을 수 있는 범위는 제한했습니다.

- 공개 wash log
- 공개 wash log에 연결된 car summary
- 공개 wash log에 연결된 image metadata
- 공개 기록 작성자의 nickname/avatar view

`profiles` table 전체를 직접 공개하지 않고 `community_profiles` view를 사용합니다.

### 환경 변수

클라이언트에 노출되는 값:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

서버 전용 값:

```text
OPENAI_API_KEY
```

`service_role` key는 브라우저 코드에서 사용하지 않습니다.

## 트러블슈팅 기록

### 1. `profiles.avatar_url does not exist`

문제:

프로필 화면에서 avatar upload UI를 붙였지만 실제 Supabase DB에는 `avatar_url` column이 없어 조회가 실패했습니다.

해결:

- `profiles.avatar_url` column 추가 migration 작성
- `community_profiles` view에 `avatar_url` 포함
- Supabase remote project에 migration 적용
- profile edit form에서 upload 후 `avatar_url`을 update/upsert하도록 변경

배운 점:

로컬 코드 변경만으로는 Supabase schema가 바뀌지 않습니다. Storage나 DB column이 필요한 기능은 migration과 실제 remote 적용 여부를 함께 확인해야 합니다.

### 2. 공개 랜딩과 RLS 충돌

문제:

랜딩 페이지에서 비로그인 사용자에게 공개 커뮤니티 preview를 보여주려면 anon role이 일부 데이터를 읽을 수 있어야 했습니다. 하지만 무작정 grant를 열면 private 데이터 노출 위험이 생깁니다.

해결:

- `wash_logs.visibility = 'public'` 조건의 anon select policy 추가
- `cars`, `wash_images`도 공개 wash log에 연결된 row만 읽도록 제한
- `community_profiles` view는 공개 기록 작성자만 노출하도록 재정의

배운 점:

공개 페이지를 만들 때는 “페이지에 필요한 데이터”와 “테이블 전체”를 분리해야 합니다. 가능하면 table 직접 공개보다 제한된 view와 RLS 조건을 사용하는 편이 안전합니다.

### 3. Public Storage bucket의 private 이미지 노출

문제:

DB RLS로 private wash log row는 막아도, public bucket에 저장된 이미지 URL을 아는 사용자는 파일에 직접 접근할 수 있었습니다.

해결:

- `wash-images` bucket을 private으로 전환
- Storage object select policy 추가
- 서버에서 signed URL을 발급해 이미지 렌더링
- community, bookmarks, landing, wash detail 화면에 signed URL helper 적용

배운 점:

DB RLS와 Storage 공개성은 별개의 보안 경계입니다. 비공개 파일을 다룰 때는 private bucket과 signed URL이 필요합니다.

### 4. Next Route Handler export 제한

문제:

`src/app/api/routines/route.ts`에서 테스트용 helper를 export했더니 production build에서 Route Handler가 허용하지 않는 export라고 실패했습니다.

해결:

- rate limit helper를 `src/features/routines/routine-rate-limit.ts`로 분리
- route handler와 test가 해당 module을 공유하도록 변경

배운 점:

App Router route 파일은 `GET`, `POST`, `dynamic`, `revalidate` 등 Next가 허용하는 export만 가져야 합니다. 테스트 가능한 순수 함수는 feature module로 분리하는 편이 안전합니다.

### 5. `npm audit` 취약점 처리

문제:

배포 전 `npm audit`에서 `vite`, `js-yaml`, `postcss` advisory가 발견됐습니다.

해결:

- `npm audit fix`로 자동 수정 가능한 dev dependency를 업데이트
- `npm audit fix --force`는 Next를 breaking change 방향으로 바꿔 적용하지 않음
- 남은 PostCSS advisory는 Next 내부 dependency라 framework patch를 추적하는 것으로 정리

배운 점:

모든 audit fix를 무조건 적용하면 오히려 앱을 깨뜨릴 수 있습니다. 운영 영향, dev dependency 여부, framework dependency 여부를 구분해 판단해야 합니다.

## 테스트 전략

테스트는 UI snapshot보다 비즈니스 로직과 보안 경계에 가까운 부분을 중심으로 작성했습니다.

- schema validation
- database row mapping
- dashboard summary calculation
- community public/private filtering
- signed URL helper
- image upload policy
- routine fallback reason
- routine daily rate limit
- Supabase migration security checks

주요 검증 명령:

```bash
npm test
npm run lint
npm run build
npm audit --audit-level=moderate
```

## 포트폴리오에서 강조할 점

- 인증, RLS, Storage, AI API, 커뮤니티까지 연결한 풀스택 구현 경험
- 공개/비공개 데이터 경계를 실제 보안 정책으로 설계한 경험
- AI 기능 실패를 fallback으로 처리한 제품 안정성 설계
- public bucket 문제를 private bucket + signed URL로 개선한 보안 개선 경험
- 단순 구현이 아니라 테스트, 빌드, audit, Supabase remote migration까지 확인한 배포 준비 과정

## 개선 여지

- 커뮤니티 pagination과 정렬 옵션 추가
- AI 루틴 생성 이력 검색
- 이미지 최적화와 CDN 캐시 정책 개선
- Playwright 기반 E2E 테스트 추가
- 배포 후 error monitoring과 analytics 연결
