# Supabase Database Setup

Detailog의 대시보드, 차량, 세차 기록, AI 루틴, 커뮤니티, 북마크, 프로필 기능은
`supabase/migrations/20260609000000_initial_schema.sql`의 데이터베이스 객체를 사용합니다.

## 원격 프로젝트 적용

Supabase CLI에 로그인한 뒤 현재 프로젝트에 마이그레이션을 적용합니다.

```bash
npx supabase login
npx supabase link --project-ref hhfjlephjzsylzcbhspg
npx supabase db push
```

CLI 대신 Supabase Dashboard의 SQL Editor를 사용하는 경우에는
`supabase/migrations/20260609000000_initial_schema.sql` 전체를 한 번 실행합니다.

마이그레이션은 다음 항목을 생성합니다.

- `profiles`, `cars`, `wash_logs`, `wash_steps`, `wash_images`
- `routine_recommendations`, `reactions`
- 커뮤니티 닉네임 조회 전용 `community_profiles` view
- 가입 시 프로필을 생성하는 `on_auth_user_created_profile` trigger
- 모든 앱 테이블의 RLS 정책
- 공개 `wash-images` Storage bucket과 소유자별 변경 정책

## 적용 확인

적용 후 로그인한 상태에서 다음 화면을 확인합니다.

1. `/dashboard`에서 DB 조회 오류가 표시되지 않는지 확인합니다.
2. `/profile`에서 프로필을 조회하고 닉네임을 저장합니다.
3. `/cars`에서 차량을 생성, 조회, 수정, 삭제합니다.
4. `/wash`에서 세차 기록과 단계를 생성, 조회, 수정, 삭제합니다.
5. `/community`와 `/bookmarks`에서 공개 기록, 좋아요, 북마크를 확인합니다.

`Could not find the table 'public.*' in the schema cache` 오류가 계속되면
마이그레이션이 현재 `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`과 동일한 프로젝트에
적용됐는지 먼저 확인합니다.
