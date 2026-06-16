drop view if exists public.community_profiles;

create view public.community_profiles
with (security_barrier = true)
as
select profiles.id, profiles.nickname, profiles.avatar_url
from public.profiles
where exists (
  select 1
  from public.wash_logs
  where wash_logs.user_id = profiles.id
    and wash_logs.visibility = 'public'
);

revoke all on public.community_profiles from anon;
revoke all on public.community_profiles from authenticated;
grant select on public.community_profiles to anon;
grant select on public.community_profiles to authenticated;

update storage.buckets
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'wash-images';

update storage.buckets
set
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

drop policy if exists "Users can read own wash image objects"
on storage.objects;

create policy "Users can read own wash image objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'wash-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Public wash image objects are readable by anonymous visitors"
on storage.objects;

create policy "Public wash image objects are readable by anonymous visitors"
on storage.objects for select to anon
using (
  bucket_id = 'wash-images'
  and exists (
    select 1
    from public.wash_logs
    where wash_logs.id::text = (storage.foldername(name))[2]
      and wash_logs.visibility = 'public'
  )
);

drop policy if exists "Authenticated users can read public wash image objects"
on storage.objects;

create policy "Authenticated users can read public wash image objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'wash-images'
  and exists (
    select 1
    from public.wash_logs
    where wash_logs.id::text = (storage.foldername(name))[2]
      and wash_logs.visibility = 'public'
  )
);

create index if not exists routine_recommendations_user_recent_idx
on public.routine_recommendations (user_id, created_at desc);
