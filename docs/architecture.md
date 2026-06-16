# Architecture

## Goal

Detailog starts as a responsive web MVP on Next.js App Router and Vercel. The initial architecture keeps product surfaces visible while delaying external integrations until their tasks are intentionally scoped.

## App Router Layout

- `src/app/(marketing)`: Public landing route
- `src/app/(auth)`: Authentication routes such as `/login` and `/signup`
- `src/app/(app)`: Signed-in product routes such as `/dashboard`, `/cars`, `/wash`, `/community`, and `/profile`

Route groups keep the URL clean while allowing each area to gain its own layout later.

## Feature-Based Structure

Feature code lives under `src/features`. Each feature can own its components, forms, schemas, hooks, and service helpers. Shared UI primitives live under `src/components/ui`, and cross-feature utilities live under `src/lib`.

The shared UI layer intentionally stays small. `PageHeader` standardizes page hierarchy,
the state components standardize empty, error, and loading surfaces, and
`AppNavigation` owns only the responsive navigation interaction. Business logic and
feature-specific form behavior remain inside their feature folders. The signed-in app
layout keeps server-side authentication while delegating only the mobile hamburger
menu state to the client navigation component.

## Auth Boundary

Supabase Auth is connected through small utilities under `src/lib/supabase`:

- `client.ts`: browser client for form actions such as login, signup, and logout
- `server.ts`: server client for route-level user checks
- `middleware.ts`: session refresh and route redirects

Unauthenticated users are redirected from app routes such as `/dashboard` to `/login`. Authenticated users are redirected away from `/login` and `/signup` to `/dashboard`. The `(app)` route group also checks the user on the server before rendering protected pages.

When middleware sends a user to `/login` with `redirectedFrom`, successful login returns the user to that internal path. Without a safe `redirectedFrom` value, login falls back to `/dashboard`.

Signup stores `nickname` in Supabase Auth user metadata and prepares a matching `profiles` row. When Supabase returns an active session immediately after signup, the client performs a small `profiles` upsert fallback. For email-confirmation signup flows, the reliable creation path is the Supabase database trigger documented in `docs/profile-setup.md`.

The `/profile` route reads the current user's own `profiles` row on the server and lets the user edit only `nickname` through a React Hook Form + Zod form. It intentionally does not include public profile pages, avatar upload, or shared community profile behavior.

애플리케이션 쿼리는 소유권과 공개 범위 필터를 명시하지만, 브라우저 요청은
변조될 수 있으므로 이 필터가 최종 인가 경계는 아닙니다. 연결된 모든 테이블과
Storage 변경 작업에는 Supabase RLS가 필요합니다. 필수 정책 기준안과 열 단위
비공개 제한 사항은 `docs/security-rls.md`에 정리합니다.

## Dashboard

The `/dashboard` route is the signed-in user's lightweight product summary. It reads only the current user's records and shows total car count, total wash log count, the most recent wash log, last wash date, this month's wash count and cost, the latest saved AI routine, and quick links into the main MVP flows.

Dashboard queries intentionally avoid advanced analytics, charts, RPC functions, or new integrations. Counts use Supabase exact count queries where only totals are needed. The monthly wash summary filters `wash_logs.wash_date` from the current Korean-time month start to the next month start and sums returned `cost` values in application code. The latest wash log and latest routine are fetched as single-row queries ordered by their existing date fields.

## Cars

Car management is implemented as the first feature-owned product area under `src/features/cars`. The route surface is:

- `/cars`: authenticated user's own car list
- `/cars/new`: create a car profile
- `/cars/[carId]`: view one owned car
- `/cars/[carId]/edit`: edit one owned car

The app queries the `cars` table with both `id` and `user_id` filters for detail, edit, update, and delete operations. List queries filter by `user_id`. This keeps ownership checks explicit in the application while Supabase Row Level Security remains the required database enforcement layer.

The car form uses React Hook Form and Zod. Feature helpers map the camelCase form field `coatingType` to the database column `coating_type`. This step only manages car profile data and does not introduce wash logs, Supabase Storage, OpenAI calls, or recommendation logic.

## Wash Logs

Wash log CRUD is implemented under `src/features/wash-logs`. The route surface is:

- `/wash`: authenticated user's own wash log list
- `/wash/new`: create a wash log for one owned car
- `/wash/[washLogId]`: view one owned wash log
- `/wash/[washLogId]/edit`: edit one owned wash log

The app queries `wash_logs` with `user_id` filters for list, detail, edit, and delete flows. Create and update operations call Supabase RPC functions so `wash_logs` and ordered `wash_steps` are written in one database transaction. This prevents partial states such as a parent wash log without steps or an edited record whose previous steps were deleted before replacement steps failed to insert.

세차 기록 생성 및 수정 전에 제출된 `car_id`가 현재 사용자의 서버 필터링 차량
목록에 포함되는지 확인합니다. 변조된 요청을 애플리케이션에서 먼저 거부하기
위한 검사이며, 최종 RLS 정책도 `wash_logs.user_id = auth.uid()`와 참조 차량
소유권을 모두 확인해야 합니다.

The `/wash` list supports basic server-side filtering through URL search params:
`keyword`, `car`, `visibility`, `dirtLevel`, `satisfaction`, `from`, and `to`.
The keyword filter searches `title`, `location`, and `memo`. Filter forms use a
plain GET request so filtered views can be refreshed, shared, and revisited without
client-side state.

Required persistence shape:

- `wash_logs`: `id`, `user_id`, `car_id`, `title`, `wash_date`, `location`, `duration_minutes`, `cost`, `weather`, `dirt_level`, `satisfaction`, `memo`, `visibility`, `created_at`, `updated_at`
- `wash_steps`: `id`, `wash_log_id`, `step_type`, `product_name`, `memo`, `step_order`, `created_at`
- `wash_images`: `id`, `wash_log_id`, `object_path`, `image_url`, `image_type`, `is_representative`, `created_at`

Recommended constraints are `visibility in ('private', 'public')`, rating values from `1` to `5`, non-negative `cost`, positive `duration_minutes`, `wash_logs.car_id` referencing `cars(id)`, `wash_steps.wash_log_id` referencing `wash_logs(id)` with cascade delete, `wash_images.wash_log_id` referencing `wash_logs(id)` with cascade delete, and `image_type in ('before', 'after', 'process', 'etc')`. A partial unique index on `wash_images(wash_log_id) where is_representative = true` keeps one representative image per wash log. Supabase Row Level Security remains required: users can manage only `wash_logs` where `user_id = auth.uid()`, and `wash_steps` and `wash_images` access should be limited through ownership of the parent `wash_logs` row.

Wash images are uploaded to the private Supabase Storage bucket `wash-images` using the object path `{userId}/{washLogId}/{timestamp}-{randomId}.{ext}`. The first path segment supports Storage policies that allow users to manage only their own objects. The app stores that path in `wash_images.object_path`, keeps the legacy `image_url` column for compatibility, and renders images with server-generated signed URLs. New wash logs can include before/process/after images during the create flow; the detail page is read-only for images and sends users to the edit page for image add/delete/representative changes. When a multi-image upload partially fails, the client runs a compensation cleanup for rows and objects created during that upload attempt.

## AI Routine Recommendations

AI routine recommendation is implemented under `src/features/routines`. The route surface is:

- `/routine/new`: create an AI wash routine recommendation for one owned car
- `/routine/[routineId]`: view one saved routine recommendation

The app posts validated routine input to `src/app/api/routines/route.ts`. The route handler checks the signed-in user, verifies that the selected `car_id` belongs to that user, calls the OpenAI Responses API with strict JSON Schema output, validates the model response with Zod, and saves the input/result pair to Supabase.

Required persistence shape:

- `routine_recommendations`: `id`, `user_id`, `car_id`, `input` jsonb, `result` jsonb, `created_at`

Recommended constraints are `routine_recommendations.car_id` referencing `cars(id)` with cascade delete and Row Level Security that allows users to manage only rows where `user_id = auth.uid()`.

## Community

Community is implemented as a signed-in product area under `src/features/community`. Anonymous users can see only the limited public preview rendered on the landing page; the full feed, detail interaction surface, likes, and bookmarks require authentication.
The route surface is:

- `/community`: public wash log feed
- `/community/[washLogId]`: public wash log detail
- `/bookmarks`: current user's bookmarked public wash logs

Community queries always use `wash_logs.visibility = 'public'` as the database filter.
The mapper also drops any non-public row before rendering, so private wash logs do not
appear even if a query shape changes later. Detail pages use both `id` and
`visibility = 'public'`; a private or missing record resolves to `notFound()`.

community mapper가 private 행을 제거하는 동작은 회귀 테스트로 보호합니다.
RLS에서도 소유자가 아닌 사용자의 wash log, step, image 조회는 부모의
`visibility = 'public'`인 경우로 제한해야 합니다.

The `/community` feed supports basic server-side filters through the `keyword`,
`dirtLevel`, and `satisfaction` URL search params. The feed remains ordered by
`wash_date` and `created_at` descending as the MVP's latest order. Advanced search,
popularity sorting, and pagination remain out of scope.

The feed query reads public `wash_logs` with `cars` and `wash_images`, then fetches
matching `profiles` rows by `user_id` in a second query. This avoids requiring an
extra database foreign key between `wash_logs.user_id` and `profiles.id` for Supabase
embedded selects. The detail query uses the same public filter and additionally loads
ordered `wash_steps`.

Like and bookmark persistence uses a single `reactions` table:

- `reactions`: `id`, `user_id`, `wash_log_id`, `type`, `created_at`

Recommended constraints are `type in ('like', 'bookmark')`, `reactions.user_id`
referencing `auth.users(id)` with cascade delete, `reactions.wash_log_id`
referencing `wash_logs(id)` with cascade delete, and a unique constraint on
`(user_id, wash_log_id, type)` to prevent duplicate likes or bookmarks. Row Level
Security should allow signed-in users to select reactions for public wash logs, insert
or delete only their own reactions, and only when the parent `wash_logs.visibility` is
`public`.

The feed and detail pages load reaction rows for the rendered public wash log ids and
derive `likeCount`, `bookmarkCount`, `likedByCurrentUser`, and
`bookmarkedByCurrentUser` in the community mapper. `/bookmarks` first loads the
current user's `bookmark` reactions, then fetches only matching public wash logs, so a
record that becomes private no longer appears in saved items. Comments, follow
behavior, and notifications remain out of scope until their own feature tasks are
defined.

## Integration Boundary

Supabase Auth, the minimal `profiles` table, the `cars` table, wash log persistence, wash image Storage uploads, OpenAI-backed routine recommendation, and the public community feed are the external integration surfaces connected so far.
