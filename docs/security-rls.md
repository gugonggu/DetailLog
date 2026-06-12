# Security And RLS

이 문서는 Detailog MVP에서 Supabase에 수동으로 적용해야 하는 최소 권한 정책을
정리합니다. 애플리케이션의 `user_id` 및 `visibility` 필터는 빠른 실패와 명확한
동작을 위한 방어 계층이며, 최종 권한 보장은 반드시 RLS가 담당해야 합니다.

정책 적용 전 기존 정책 이름과 충돌하지 않는지 확인하고, 테스트 Supabase
프로젝트에서 먼저 검증합니다.

## 기본 원칙

- `profiles`, `cars`, `wash_logs`, `routine_recommendations`의 변경은
  `auth.uid()`가 소유자인 행으로 제한합니다.
- `wash_steps`, `wash_images`의 변경은 부모 `wash_logs.user_id`가
  `auth.uid()`인 경우로 제한합니다.
- community 조회는 `wash_logs.visibility = 'public'`인 부모를 통해서만
  허용합니다.
- `reactions` 변경은 본인의 반응이며 부모 wash log가 public인 경우로
  제한합니다.
- `service_role` key는 브라우저나 `NEXT_PUBLIC_*` 환경 변수에 두지 않습니다.

## 테이블 RLS 활성화

```sql
alter table public.profiles enable row level security;
alter table public.cars enable row level security;
alter table public.wash_logs enable row level security;
alter table public.wash_steps enable row level security;
alter table public.wash_images enable row level security;
alter table public.routine_recommendations enable row level security;
alter table public.reactions enable row level security;
```

## Profiles

```sql
create policy "Users can read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (id = auth.uid());

create policy "Users can update own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());
```

RLS는 열 단위 접근을 제한하지 못합니다. community에서 다른 사용자의
`nickname`만 제공하려면 `id`, `nickname`만 노출하는 제한된
`community_profiles` view 또는 RPC를 사용해야 합니다. 다른 사용자의
`profiles` 행을 직접 select하도록 허용하면 `email`도 조회될 수 있으므로
금지합니다.

## Cars

```sql
create policy "Users can read own cars"
on public.cars for select to authenticated
using (user_id = auth.uid());

create policy "Users can insert own cars"
on public.cars for insert to authenticated
with check (user_id = auth.uid());

create policy "Users can update own cars"
on public.cars for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own cars"
on public.cars for delete to authenticated
using (user_id = auth.uid());
```

community에서 공개할 차량 요약은 `id`, `name`, `brand`, `model`만 노출하는
별도 view 또는 RPC가 안전합니다. public wash log를 이유로 `cars` 행 전체를
select 허용하면 `memo`, `color`, `coating_type` 등도 직접 조회될 수 있습니다.

## Wash Logs

```sql
create policy "Users can read own or public wash logs"
on public.wash_logs for select to authenticated
using (user_id = auth.uid() or visibility = 'public');

create policy "Users can insert own wash logs for own cars"
on public.wash_logs for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.cars
    where cars.id = wash_logs.car_id
      and cars.user_id = auth.uid()
  )
);

create policy "Users can update own wash logs for own cars"
on public.wash_logs for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.cars
    where cars.id = wash_logs.car_id
      and cars.user_id = auth.uid()
  )
);

create policy "Users can delete own wash logs"
on public.wash_logs for delete to authenticated
using (user_id = auth.uid());
```

## Wash Steps

```sql
create policy "Users can read steps for own or public wash logs"
on public.wash_steps for select to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_steps.wash_log_id
      and (wash_logs.user_id = auth.uid() or wash_logs.visibility = 'public')
  )
);

create policy "Users can insert steps for own wash logs"
on public.wash_steps for insert to authenticated
with check (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_steps.wash_log_id
      and wash_logs.user_id = auth.uid()
  )
);

create policy "Users can update steps for own wash logs"
on public.wash_steps for update to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_steps.wash_log_id
      and wash_logs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_steps.wash_log_id
      and wash_logs.user_id = auth.uid()
  )
);

create policy "Users can delete steps for own wash logs"
on public.wash_steps for delete to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_steps.wash_log_id
      and wash_logs.user_id = auth.uid()
  )
);
```

## Wash Images

`wash_images` 정책은 `wash_steps`와 동일한 부모 소유권 구조를 사용합니다.

```sql
create policy "Users can read images for own or public wash logs"
on public.wash_images for select to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_images.wash_log_id
      and (wash_logs.user_id = auth.uid() or wash_logs.visibility = 'public')
  )
);

create policy "Users can insert images for own wash logs"
on public.wash_images for insert to authenticated
with check (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_images.wash_log_id
      and wash_logs.user_id = auth.uid()
  )
);

create policy "Users can update images for own wash logs"
on public.wash_images for update to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_images.wash_log_id
      and wash_logs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_images.wash_log_id
      and wash_logs.user_id = auth.uid()
  )
);

create policy "Users can delete images for own wash logs"
on public.wash_images for delete to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_images.wash_log_id
      and wash_logs.user_id = auth.uid()
  )
);
```

## AI Routines

```sql
create policy "Users can read own routines"
on public.routine_recommendations for select to authenticated
using (user_id = auth.uid());

create policy "Users can insert own routines for own cars"
on public.routine_recommendations for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.cars
    where cars.id = routine_recommendations.car_id
      and cars.user_id = auth.uid()
  )
);

create policy "Users can update own routines for own cars"
on public.routine_recommendations for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.cars
    where cars.id = routine_recommendations.car_id
      and cars.user_id = auth.uid()
  )
);

create policy "Users can delete own routines"
on public.routine_recommendations for delete to authenticated
using (user_id = auth.uid());
```

## Reactions

`docs/reactions-setup.md`의 정책을 적용합니다. 핵심 조건은 select가 public
wash log로 제한되고, insert/delete는 `user_id = auth.uid()`이며 부모 wash
log가 public인 경우로 제한되는 것입니다.

## Storage

현재 object path는 `{userId}/{washLogId}/{fileName}` 형식입니다.

```sql
create policy "Users can upload own wash images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'wash-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own wash image objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'wash-images'
  and owner_id = auth.uid()::text
)
with check (
  bucket_id = 'wash-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own wash image objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'wash-images'
  and owner_id = auth.uid()::text
);
```

`wash-images`가 public bucket이면 private wash log의 이미지도 URL을 아는
사용자가 직접 열 수 있습니다. private 이미지 자체의 비공개 보장이 필요하면
bucket을 private으로 전환하고, 소유자 또는 public 부모 기록에 대해서만
server-side signed URL을 발급하는 별도 작업이 필요합니다.

