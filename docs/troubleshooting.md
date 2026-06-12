# Troubleshooting

## Dependencies Do Not Install

Check the Node.js version first:

```bash
node --version
npm --version
```

Use an active LTS version of Node.js. Then retry:

```bash
npm install
```

## Development Server Does Not Start

Run:

```bash
npm run dev
```

If port `3000` is already in use, Next.js usually offers another port. Open the URL printed in the terminal.

## Tailwind Styles Do Not Apply

Check that `src/app/globals.css` is imported by `src/app/layout.tsx`, and confirm the route files live under `src/app`.

## Build Fails After Adding Integrations

Confirm required environment variables exist in `.env.local` and Vercel project settings. Supabase Auth requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 다른 사용자의 데이터 변경 요청이 성공함

애플리케이션 필터는 Supabase RLS를 대체하지 않습니다.
`docs/security-rls.md`의 정책을 적용하고 검증합니다. 실제 인증 계정 두 개로
테스트하여 직접 Supabase 요청을 보내더라도 다른 계정의 `profiles`, `cars`,
`wash_logs`, `wash_steps`, `wash_images`, `routine_recommendations`를 수정하거나
삭제할 수 없는지 확인합니다.

세차 기록과 AI routine에서는 `car_id`를 다른 사용자의 차량으로 바꾼 요청도
거부되는지 확인합니다. community에서는 기존 public 세차 기록을 private으로
바꾼 뒤 `/community`, `/community/[washLogId]`, `/bookmarks`에서 사라지는지
확인합니다.

## Private 세차 이미지가 URL로 계속 열림

현재 `wash-images` bucket은 public URL을 사용합니다. 데이터베이스 RLS는
`wash_images` 행을 숨길 수 있지만 이미 알려진 public object URL 접근을 막을
수 없습니다. 이미지 자체의 비공개 보장이 필요하면 private Storage bucket과
서버 발급 signed URL이 필요합니다. Storage 변경 정책은 별도로 upload, update,
delete를 인증 사용자의 소유 경로로 제한해야 합니다.

## Build Fails With useSearchParams

If a client component uses `useSearchParams()` inside an App Router page, wrap that client component in `Suspense`. Next.js can otherwise fail prerendering with a missing suspense boundary error.

## Supabase Nested Select Type Looks Like an Array

Supabase nested selects can infer a joined relation as an array even when the relationship is conceptually one row, for example `wash_logs` selecting `cars(id,name,brand,model)`. Keep the feature mapper defensive by accepting either a single object or an array and normalizing it before returning the app-facing type.

## Vitest Cannot Resolve Next Alias In Feature Helpers

When a feature helper is imported by Vitest directly, prefer relative imports between nearby feature modules unless the test runner is configured with the Next.js `@/` alias. This keeps helper tests runnable with the current `vitest run` setup.
