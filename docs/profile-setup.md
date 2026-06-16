# Profile Setup

이 문서는 기본 profile 기능과 avatar upload를 위해 Supabase에서 준비해야 하는 최소 설정을 정리합니다.

## Table

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null check (char_length(nickname) between 2 and 30),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`id`는 `auth.users.id`와 1:1로 맞춥니다. 앱은 `nickname`, `email`, `created_at`, `avatar_url`을 읽고, 프로필 편집 화면에서 `nickname`과 `avatar_url`을 수정합니다.

## Signup Trigger

Signup 직후 기본 profile row를 생성합니다.

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
    coalesce(nullif(trim(new.raw_user_meta_data->>'nickname'), ''), 'Detailer')
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

## Avatar Storage

Avatar files use a public `avatars` Storage bucket. Object paths are user-scoped:

```text
{user_id}/avatar-{timestamp}-{random_id}.{extension}
```

```sql
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

create policy "Users can upload own avatars"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own avatar objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own avatar objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

`community_profiles` 뷰는 커뮤니티 화면에서 공개 프로필 정보를 표시할 수 있도록 `id`, `nickname`, `avatar_url`을 노출합니다.
