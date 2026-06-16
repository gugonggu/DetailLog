# Detailog Portfolio Troubleshooting Notes

이 문서는 Detailog를 MVP 수준에서 실제 배포 가능한 서비스에 가깝게 다듬으면서 발견한 기술적 문제와 개선 내용을 정리한 기록입니다.

## 1. 세차 기록 저장 트랜잭션 문제

### 문제

세차 기록은 `wash_logs` 부모 row와 `wash_steps` 자식 row를 함께 저장합니다. 기존 구현은 클라이언트에서 다음 순서로 여러 요청을 보냈습니다.

```text
create: wash_logs insert -> wash_steps insert
update: wash_logs update -> wash_steps delete -> wash_steps insert
```

이 구조에서는 중간 요청이 실패할 경우 데이터가 부분적으로만 반영될 수 있습니다.

- 생성 중 `wash_steps` insert가 실패하면 세차 기록만 남을 수 있습니다.
- 수정 중 기존 step을 삭제한 뒤 새 step 저장이 실패하면 step 목록이 비어버릴 수 있습니다.
- 네트워크 오류, RLS 오류, validation 누락이 생겼을 때 복구 로직이 클라이언트에 흩어집니다.

### 개선

Supabase RPC(Postgres function)를 추가해 세차 기록과 step 저장을 데이터베이스 트랜잭션 안에서 처리하도록 변경했습니다.

- `create_wash_log_with_steps`: 세차 기록 생성과 step 생성을 하나의 RPC로 처리
- `update_wash_log_with_steps`: 세차 기록 수정, 기존 step 삭제, 새 step 생성을 하나의 RPC로 처리
- `auth.uid()`와 `p_user_id`를 비교해 호출자가 본인 데이터만 변경 가능하도록 방어
- `car_id`가 호출자 소유인지 function 내부에서 검증
- `p_steps`가 비어 있거나 배열이 아니면 예외 발생
- step 저장 실패 시 전체 함수 실행이 실패해 부모 row만 남거나 step이 비는 상태를 방지

관련 파일:

```text
supabase/migrations/20260616003000_wash_log_transactions_and_object_paths.sql
src/features/wash-logs/wash-log-form.tsx
src/features/wash-logs/wash-log-service.ts
src/features/wash-logs/wash-log-schemas.test.ts
```

단순 CRUD 구현에서 끝내지 않고 부모-자식 데이터의 원자성을 고려했습니다. 클라이언트 보상 처리보다 데이터베이스 트랜잭션이 더 적합한 영역을 구분했고, Supabase RPC를 통해 RLS 기반 서비스에서도 일관성 있는 저장 흐름을 만들었습니다.

## 2. 랜딩 이미지 외부 의존성 제거

### 문제

랜딩 페이지 hero 이미지가 `source.unsplash.com` 외부 URL에 의존하고 있었습니다. 외부 이미지 URL은 빠르게 구현하기에는 좋지만 실제 배포 서비스에서는 다음 문제가 생길 수 있습니다.

- 외부 서비스 응답 지연으로 첫 화면 로딩 품질이 흔들릴 수 있습니다.
- 이미지 제공 방식이 바뀌거나 요청이 실패하면 랜딩 첫 화면이 깨질 수 있습니다.
- 시연 환경에서 네트워크 상태에 따라 화면 완성도가 달라질 수 있습니다.

### 개선

프로젝트 내부 `public/images/landing-hero.svg` 자산을 추가하고 랜딩 hero 배경을 로컬 asset으로 변경했습니다.

관련 파일:

```text
public/images/landing-hero.svg
src/features/landing/landing-page.tsx
```

첫 화면은 서비스 신뢰도와 직결되기 때문에 외부 임시 이미지 의존성을 제거했습니다. 배포 결과물이 네트워크와 외부 이미지 제공 정책에 덜 흔들리도록 정적 자산을 프로젝트 안에 포함했습니다.

## 3. 세차 이미지 저장 구조 개선

### 문제

`wash-images` bucket을 private으로 전환한 뒤에도 DB에는 public URL 형태의 `image_url`이 저장되어 있었습니다. 화면에서는 URL에서 storage path를 추출한 뒤 signed URL을 다시 발급했습니다.

동작은 가능하지만 구조적으로는 어색했습니다.

- private bucket에서는 public URL이 정본 데이터가 되기 어렵습니다.
- URL 파싱 규칙이 바뀌면 signed URL 발급이 깨질 수 있습니다.
- DB row가 실제 Storage object의 identity가 아니라 과거 표시 URL에 가까운 값을 저장하게 됩니다.

### 개선

`wash_images.object_path` 컬럼을 추가하고 앱의 이미지 렌더링, 삭제, signed URL 발급 기준을 object path 중심으로 변경했습니다.

- 신규 업로드는 `object_path`에 `{userId}/{washLogId}/{timestamp}-{randomId}.{ext}` 값을 저장
- legacy 호환을 위해 기존 `image_url` 컬럼은 유지하되, 새 데이터는 public URL 대신 object path를 저장
- 기존 public URL 데이터는 migration에서 object path로 backfill
- 화면 조회 시 `object_path`를 우선 사용하고, legacy row만 `image_url`에서 path를 추출
- 삭제 시 signed URL이 아니라 `objectPath` 기준으로 Storage object 제거

관련 파일:

```text
supabase/migrations/20260616003000_wash_log_transactions_and_object_paths.sql
src/features/wash-images/wash-image-manager.tsx
src/features/wash-images/wash-image-service.ts
src/features/wash-images/types.ts
src/features/wash-images/wash-image-service.test.ts
src/features/community/community-service.ts
src/app/(app)/wash/[washLogId]/page.tsx
```

Storage object의 식별자와 화면 표시용 URL을 분리했습니다. private bucket에서는 object path를 영속 데이터로 저장하고, signed URL은 렌더링 시점에 발급되는 임시 값으로 다루는 편이 더 자연스럽습니다.

## 4. 이미지 여러 장 업로드 중 부분 실패

### 문제

여러 장의 세차 이미지를 순차 업로드할 때 중간 파일에서 실패하면, 앞서 성공한 파일과 DB row가 그대로 남을 수 있었습니다. Storage upload와 DB insert는 서로 다른 요청이기 때문에 데이터베이스 트랜잭션만으로는 파일 저장소까지 함께 rollback할 수 없습니다.

예상 가능한 실패 지점은 다음과 같습니다.

- 두 번째 파일의 Storage upload 실패
- Storage upload는 성공했지만 `wash_images` insert 실패
- 네트워크 오류 또는 RLS 오류로 후속 요청 실패

### 개선

업로드 세션 동안 생성된 `uploadedObjectPaths`와 `insertedImageIds`를 추적하고, 실패 시 `cleanupPartialWashImageUpload` helper로 이번 시도에서 만들어진 DB row와 Storage object를 정리하도록 변경했습니다.

- upload 실패: 이미 insert된 row와 업로드된 object 정리
- insert 실패: 현재 파일 object까지 포함해 업로드된 object 정리, 이전 row 정리
- cleanup helper는 서비스 레이어에 두고 Vitest로 호출 대상 bucket/table을 검증

관련 파일:

```text
src/features/wash-images/wash-image-manager.tsx
src/features/wash-images/wash-image-service.ts
src/features/wash-images/wash-image-service.test.ts
```

Storage와 DB를 완전한 단일 트랜잭션으로 묶을 수 없는 상황에서 보상 트랜잭션 방식으로 일관성을 높였습니다. 실패 가능성을 숨기지 않고, 실패 이후 남을 수 있는 찌꺼기 데이터를 정리하는 정책을 명시적으로 구현했습니다.

## 5. 커뮤니티 공개 범위와 시연 데이터 정책

### 문제

`/community`는 공개 기록을 보여주지만 앱 영역 안에 있기 때문에 로그인 흐름이 필요합니다. 이 의도가 문서에 분명하지 않으면 “공개 커뮤니티인데 왜 로그인해야 하는가?”라는 질문이 생길 수 있습니다. 또한 실제 데이터가 부족하면 기능은 충분해도 스크린샷과 데모 영상에서 제품 완성도가 약해 보일 수 있습니다.

### 개선

- 비로그인 사용자는 `/` 랜딩에서 최근 공개 기록 preview만 볼 수 있도록 정책을 명확히 했습니다.
- 전체 커뮤니티 탐색, 좋아요, 북마크는 사용자 맥락이 필요하므로 로그인 후 제품 영역에서 사용하도록 문서화했습니다.
- 시연용 데이터 기준을 README에 추가했습니다.
- 랜딩 기능 카피를 실제 구현 상태에 맞게 `AI 세차 루틴 추천`으로 강화했습니다.

공개 범위를 무조건 넓히기보다 인증, 반응 데이터, 개인정보 노출 범위를 기준으로 공개 preview와 로그인 후 제품 영역을 분리했습니다. 시연용 데이터 기준을 별도로 둬 기능 구현뿐 아니라 제품처럼 보이는 첫인상까지 관리할 수 있게 했습니다.

## 6. 세차 기록 생성 후 별도 이미지 업로드 흐름

### 문제

기존 흐름은 세차 기록을 먼저 저장한 뒤 상세 페이지에서 이미지를 따로 업로드하는 방식이었습니다. 실제 사용자는 세차 기록을 작성하는 순간 세차 전, 과정, 세차 후 이미지를 함께 남기고 싶어 하기 때문에 이 흐름은 자연스럽지 않았습니다. 또한 상세 페이지가 조회 화면과 관리 화면 역할을 동시에 가져 사용 목적이 흐려졌습니다.

### 개선

- `/wash/new` 생성 폼에서 세차 이미지 선택, 타입 지정, 대표 이미지 지정을 함께 처리하도록 변경했습니다.
- 기록 생성 RPC가 성공하면 반환된 `washLogId`로 선택 이미지를 즉시 업로드합니다.
- 이미지 업로드 실패 시 방금 만든 세차 기록을 삭제해 사용자가 부분 저장 상태를 만나지 않도록 했습니다.
- `/wash/[washLogId]` 상세 페이지는 읽기 전용 갤러리로 바꾸고, 이미지 추가/삭제/대표 지정은 `/wash/[washLogId]/edit` 수정 화면으로 이동했습니다.
- 기존 상세 페이지 이미지 관리 로직은 수정 화면에서 재사용하되, 공통 업로드 helper를 통해 생성/수정 흐름의 업로드 정책을 맞췄습니다.

데이터 모델만 구현한 CRUD에서 한 단계 더 나아가 사용자가 실제로 기록을 남기는 순간의 흐름을 기준으로 UX를 재설계했습니다. 조회 화면과 편집 화면의 책임을 분리했고, 생성 시 이미지 업로드 실패에 대한 보상 처리까지 연결했습니다.

## 검증

이번 개선은 schema, mapper, migration 테스트를 함께 추가해 회귀를 줄였습니다.

```bash
npm test -- src/features/wash-logs/wash-log-schemas.test.ts src/features/wash-images/wash-image-service.test.ts src/lib/supabase/schema.test.ts
npm test
npm run lint
npm run build
```

Supabase 실제 환경에는 다음 migration을 적용해야 합니다.

```text
supabase/migrations/20260616003000_wash_log_transactions_and_object_paths.sql
```
