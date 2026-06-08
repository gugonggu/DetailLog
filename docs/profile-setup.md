# Profile Setup

이 문서는 기본 profile 기능을 위해 Supabase에서 수동으로 준비해야 하는 최소 설정을 정리합니다.

## Table

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null check (char_length(nickname) between 2 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`id`는 `auth.users.id`와 1:1로 맞춥니다. 현재 앱은 `nickname`, `email`, `created_at`만 읽고 `nickname`만 수정합니다.

## Signup Trigger

이 trigger가 signup 후 profile row 생성을 보장합니다. 이메일 인증이 켜져 있으면 signup 직후 브라우저 세션이 없을 수 있으므로, 앱 코드만으로는 insert를 항상 보장하기 어렵습니다.

```sql
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'nickname', 'Detailer')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();
```

## Row Level Security

```sql
alter table public.profiles enable row level security;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

현재 단계에서는 public profile page와 avatar upload를 만들지 않습니다. 다른 사용자의 profile read policy도 추가하지 않습니다.
