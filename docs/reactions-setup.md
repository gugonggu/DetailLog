# Reactions Setup

이 문서는 public wash log의 `like`와 `bookmark` 저장을 위해 Supabase에서 준비할 최소 테이블과 정책을 정리합니다.

## Table

```sql
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wash_log_id uuid not null references public.wash_logs(id) on delete cascade,
  type text not null check (type in ('like', 'bookmark')),
  created_at timestamptz not null default now(),
  constraint reactions_user_wash_log_type_key unique (user_id, wash_log_id, type)
);
```

## Row Level Security

```sql
alter table public.reactions enable row level security;

create policy "Users can read reactions on public wash logs"
on public.reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.wash_logs
    where wash_logs.id = reactions.wash_log_id
      and wash_logs.visibility = 'public'
  )
);

create policy "Users can create own reactions on public wash logs"
on public.reactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.wash_logs
    where wash_logs.id = reactions.wash_log_id
      and wash_logs.visibility = 'public'
  )
);

create policy "Users can delete own reactions on public wash logs"
on public.reactions
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.wash_logs
    where wash_logs.id = reactions.wash_log_id
      and wash_logs.visibility = 'public'
  )
);
```

중복 방지는 `reactions_user_wash_log_type_key` 제약이 담당합니다. 앱에서도 토글 중 버튼을 비활성화하고 insert 전에 public wash log인지 확인하지만, 최종 보장은 데이터베이스 제약과 RLS가 맡습니다.
