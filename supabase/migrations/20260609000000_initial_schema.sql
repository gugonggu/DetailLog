create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null check (char_length(nickname) between 2 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  brand text not null check (char_length(brand) between 1 and 60),
  model text not null check (char_length(model) between 1 and 60),
  year integer not null check (year between 1886 and 2200),
  color text not null check (char_length(color) between 1 and 60),
  coating_type text not null check (char_length(coating_type) between 1 and 60),
  memo text check (memo is null or char_length(memo) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wash_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  car_id uuid not null references public.cars(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  wash_date date not null,
  location text check (location is null or char_length(location) <= 80),
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  cost numeric not null default 0 check (cost between 0 and 10000000),
  weather text check (weather is null or char_length(weather) <= 80),
  dirt_level integer not null check (dirt_level between 1 and 5),
  satisfaction integer not null check (satisfaction between 1 and 5),
  memo text check (memo is null or char_length(memo) <= 1000),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wash_steps (
  id uuid primary key default gen_random_uuid(),
  wash_log_id uuid not null references public.wash_logs(id) on delete cascade,
  step_type text not null check (char_length(step_type) between 1 and 60),
  product_name text check (product_name is null or char_length(product_name) <= 80),
  memo text check (memo is null or char_length(memo) <= 300),
  step_order integer not null check (step_order > 0),
  created_at timestamptz not null default now(),
  unique (wash_log_id, step_order)
);

create table public.wash_images (
  id uuid primary key default gen_random_uuid(),
  wash_log_id uuid not null references public.wash_logs(id) on delete cascade,
  image_url text not null,
  image_type text not null check (image_type in ('before', 'after', 'process', 'etc')),
  is_representative boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index wash_images_one_representative_per_log
on public.wash_images (wash_log_id)
where is_representative;

create table public.routine_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  car_id uuid not null references public.cars(id) on delete cascade,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wash_log_id uuid not null references public.wash_logs(id) on delete cascade,
  type text not null check (type in ('like', 'bookmark')),
  created_at timestamptz not null default now(),
  unique (user_id, wash_log_id, type)
);

create index cars_user_id_idx on public.cars (user_id);
create index wash_logs_user_id_wash_date_idx on public.wash_logs (user_id, wash_date desc);
create index wash_logs_public_wash_date_idx on public.wash_logs (wash_date desc) where visibility = 'public';
create index wash_steps_wash_log_id_idx on public.wash_steps (wash_log_id);
create index wash_images_wash_log_id_idx on public.wash_images (wash_log_id);
create index routine_recommendations_user_id_created_at_idx on public.routine_recommendations (user_id, created_at desc);
create index reactions_wash_log_id_idx on public.reactions (wash_log_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger cars_set_updated_at
before update on public.cars
for each row execute function public.set_updated_at();

create trigger wash_logs_set_updated_at
before update on public.wash_logs
for each row execute function public.set_updated_at();

create function public.handle_new_user_profile()
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

insert into public.profiles (id, email, nickname)
select
  id,
  coalesce(email, ''),
  coalesce(nullif(trim(raw_user_meta_data->>'nickname'), ''), 'Detailer')
from auth.users
on conflict (id) do nothing;

create view public.community_profiles
with (security_barrier = true)
as
select id, nickname
from public.profiles;

revoke all on public.community_profiles from anon;
grant select on public.community_profiles to authenticated;

revoke all on public.profiles from anon;
revoke all on public.cars from anon;
revoke all on public.wash_logs from anon;
revoke all on public.wash_steps from anon;
revoke all on public.wash_images from anon;
revoke all on public.routine_recommendations from anon;
revoke all on public.reactions from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.cars to authenticated;
grant select, insert, update, delete on public.wash_logs to authenticated;
grant select, insert, update, delete on public.wash_steps to authenticated;
grant select, insert, update, delete on public.wash_images to authenticated;
grant select, insert, delete on public.routine_recommendations to authenticated;
grant select, insert, delete on public.reactions to authenticated;

alter table public.profiles enable row level security;
alter table public.cars enable row level security;
alter table public.wash_logs enable row level security;
alter table public.wash_steps enable row level security;
alter table public.wash_images enable row level security;
alter table public.routine_recommendations enable row level security;
alter table public.reactions enable row level security;

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

create policy "Users can read own or public wash logs"
on public.wash_logs for select to authenticated
using (user_id = auth.uid() or visibility = 'public');

create policy "Users can insert own wash logs for own cars"
on public.wash_logs for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.cars
    where cars.id = wash_logs.car_id and cars.user_id = auth.uid()
  )
);

create policy "Users can update own wash logs for own cars"
on public.wash_logs for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.cars
    where cars.id = wash_logs.car_id and cars.user_id = auth.uid()
  )
);

create policy "Users can delete own wash logs"
on public.wash_logs for delete to authenticated
using (user_id = auth.uid());

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
    where wash_logs.id = wash_steps.wash_log_id and wash_logs.user_id = auth.uid()
  )
);

create policy "Users can update steps for own wash logs"
on public.wash_steps for update to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_steps.wash_log_id and wash_logs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_steps.wash_log_id and wash_logs.user_id = auth.uid()
  )
);

create policy "Users can delete steps for own wash logs"
on public.wash_steps for delete to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_steps.wash_log_id and wash_logs.user_id = auth.uid()
  )
);

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
    where wash_logs.id = wash_images.wash_log_id and wash_logs.user_id = auth.uid()
  )
);

create policy "Users can update images for own wash logs"
on public.wash_images for update to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_images.wash_log_id and wash_logs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_images.wash_log_id and wash_logs.user_id = auth.uid()
  )
);

create policy "Users can delete images for own wash logs"
on public.wash_images for delete to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_images.wash_log_id and wash_logs.user_id = auth.uid()
  )
);

create policy "Users can read own routines"
on public.routine_recommendations for select to authenticated
using (user_id = auth.uid());

create policy "Users can insert own routines for own cars"
on public.routine_recommendations for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.cars
    where cars.id = routine_recommendations.car_id and cars.user_id = auth.uid()
  )
);

create policy "Users can delete own routines"
on public.routine_recommendations for delete to authenticated
using (user_id = auth.uid());

create policy "Users can read reactions on public wash logs"
on public.reactions for select to authenticated
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = reactions.wash_log_id and wash_logs.visibility = 'public'
  )
);

create policy "Users can create own reactions on public wash logs"
on public.reactions for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.wash_logs
    where wash_logs.id = reactions.wash_log_id and wash_logs.visibility = 'public'
  )
);

create policy "Users can delete own reactions on public wash logs"
on public.reactions for delete to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.wash_logs
    where wash_logs.id = reactions.wash_log_id and wash_logs.visibility = 'public'
  )
);

insert into storage.buckets (id, name, public)
values ('wash-images', 'wash-images', true)
on conflict (id) do update set public = excluded.public;

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
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'wash-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own wash image objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'wash-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
