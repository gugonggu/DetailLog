grant select on public.community_profiles to anon;
grant select on public.wash_logs to anon;
grant select on public.wash_images to anon;
grant select on public.cars to anon;

create policy "Public wash logs are readable by anonymous visitors"
on public.wash_logs for select to anon
using (visibility = 'public');

create policy "Public wash images are readable by anonymous visitors"
on public.wash_images for select to anon
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_images.wash_log_id
      and wash_logs.visibility = 'public'
  )
);

create policy "Public cars are readable by anonymous visitors"
on public.cars for select to anon
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.car_id = cars.id
      and wash_logs.visibility = 'public'
  )
);
