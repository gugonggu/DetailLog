# Detailog

차량별 세차 기록을 관리하고, AI 세차 루틴을 추천받으며, 공개 기록을 커뮤니티에 공유할 수 있는 반응형 웹 서비스입니다.

Detailog는 단순 CRUD를 넘어 인증, 데이터 권한, 이미지 업로드, AI API, 공개 커뮤니티, 배포 전 보안 보강까지 연결한 풀스택 포트폴리오 프로젝트입니다.

## 핵심 기능

- Supabase Auth 기반 회원가입, 로그인, 로그아웃, 보호 라우트
- 프로필 관리와 Supabase Storage 기반 아바타 업로드
- 차량 등록, 수정, 상세 조회
- 차량별 세차 기록 CRUD와 단계별 작업 메모
- 세차 전후/과정 이미지 업로드, 대표 이미지 지정, 삭제
- OpenAI API Route Handler 기반 AI 세차 루틴 추천
- AI 응답 실패 또는 검증 실패 시 fallback 루틴 제공
- 공개 세차 기록 커뮤니티 피드, 상세 화면, 좋아요, 북마크
- 로그인 상태에 따라 CTA가 달라지는 랜딩 페이지와 공개 커뮤니티 프리뷰

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- Supabase Auth, PostgreSQL, Storage, RLS
- OpenAI Responses API
- Vitest
- Vercel

## 프로젝트 구조

```text
src/app          App Router route groups, pages, route handlers
src/features     Feature-owned UI, schemas, services, tests
src/components   Shared UI components
src/lib          Shared clients and utilities
supabase         Database migrations and Storage/RLS setup
docs             Architecture, decisions, security, portfolio notes
```

## 기술적 포인트

- App Router route group을 `(marketing)`, `(auth)`, `(app)`으로 나누어 공개 영역, 인증 영역, 제품 영역을 분리했습니다.
- Supabase RLS를 최종 권한 경계로 두고, 앱 코드에서도 `user_id`, `visibility` 필터를 명시해 방어선을 이중화했습니다.
- 세차 이미지는 private Storage bucket에 저장하고, 서버에서 signed URL을 발급해 렌더링합니다.
- 공개 커뮤니티는 `visibility = 'public'` 기록만 조회하며, 공개 프로필 view도 공개 기록 작성자만 노출하도록 제한했습니다.
- AI 루틴 API는 서버 Route Handler에서만 OpenAI key를 사용하고, 사용자별 일일 생성 제한을 둡니다.
- 주요 데이터 매핑, 스키마, API fallback, 업로드 정책, 보안 마이그레이션은 Vitest로 검증합니다.

자세한 기술 설명은 [docs/portfolio-technical-summary.md](docs/portfolio-technical-summary.md)를 참고하세요.

## 로컬 실행

```bash
npm ci
npm run dev
```

필요한 환경 변수:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

Supabase 마이그레이션 적용:

```bash
npx supabase db push
```

## 검증

```bash
npm test
npm run lint
npm run build
npm audit --audit-level=moderate
```

최근 검증 결과:

- `npm test`: 18 files, 83 tests passed
- `npm run lint`: No ESLint warnings or errors
- `npm run build`: production build success

`npm audit`에는 Next 내부 PostCSS 관련 moderate advisory가 남아 있습니다. `npm audit fix --force`는 Next를 breaking change 방향으로 바꾸기 때문에 적용하지 않았고, Next 패치 릴리스에서 해결되는지 추적하는 상태입니다.

## 배포 대상

첫 릴리스 목표는 Vercel에 배포되는 웹 서비스입니다. 네이티브 모바일 앱, App Store, Play Store 릴리스 작업은 범위에 포함하지 않습니다.
