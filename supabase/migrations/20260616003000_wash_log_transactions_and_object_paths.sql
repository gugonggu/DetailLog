alter table public.wash_images
add column if not exists object_path text;

update public.wash_images
set object_path = case
  when image_url like '%/storage/v1/object/public/wash-images/%'
    then split_part(split_part(image_url, '/storage/v1/object/public/wash-images/', 2), '?', 1)
  when image_url like '%/storage/v1/object/sign/wash-images/%'
    then split_part(split_part(image_url, '/storage/v1/object/sign/wash-images/', 2), '?', 1)
  else image_url
end
where object_path is null;

alter table public.wash_images
alter column object_path set not null;

create index if not exists wash_images_object_path_idx
on public.wash_images (object_path);

create or replace function public.create_wash_log_with_steps(
  p_user_id uuid,
  p_car_id uuid,
  p_title text,
  p_wash_date date,
  p_location text,
  p_duration_minutes integer,
  p_cost numeric,
  p_weather text,
  p_dirt_level integer,
  p_satisfaction integer,
  p_memo text,
  p_visibility text,
  p_steps jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_wash_log_id uuid;
begin
  if p_user_id <> auth.uid() then
    raise exception 'Cannot create a wash log for another user.';
  end if;

  if p_steps is null or jsonb_typeof(p_steps) <> 'array' or jsonb_array_length(p_steps) = 0 then
    raise exception 'At least one wash step is required.';
  end if;

  if not exists (
    select 1
    from public.cars
    where cars.id = p_car_id
      and cars.user_id = auth.uid()
  ) then
    raise exception 'Selected car does not belong to the current user.';
  end if;

  insert into public.wash_logs (
    user_id,
    car_id,
    title,
    wash_date,
    location,
    duration_minutes,
    cost,
    weather,
    dirt_level,
    satisfaction,
    memo,
    visibility
  )
  values (
    p_user_id,
    p_car_id,
    p_title,
    p_wash_date,
    p_location,
    p_duration_minutes,
    p_cost,
    p_weather,
    p_dirt_level,
    p_satisfaction,
    p_memo,
    p_visibility
  )
  returning id into v_wash_log_id;

  insert into public.wash_steps (
    wash_log_id,
    step_type,
    product_name,
    memo,
    step_order
  )
  select
    v_wash_log_id,
    trim(step->>'step_type'),
    nullif(trim(coalesce(step->>'product_name', '')), ''),
    nullif(trim(coalesce(step->>'memo', '')), ''),
    coalesce((step->>'step_order')::integer, ordinal_position::integer)
  from jsonb_array_elements(p_steps) with ordinality as steps(step, ordinal_position);

  return v_wash_log_id;
end;
$$;

create or replace function public.update_wash_log_with_steps(
  p_wash_log_id uuid,
  p_user_id uuid,
  p_car_id uuid,
  p_title text,
  p_wash_date date,
  p_location text,
  p_duration_minutes integer,
  p_cost numeric,
  p_weather text,
  p_dirt_level integer,
  p_satisfaction integer,
  p_memo text,
  p_visibility text,
  p_steps jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_user_id <> auth.uid() then
    raise exception 'Cannot update a wash log for another user.';
  end if;

  if p_steps is null or jsonb_typeof(p_steps) <> 'array' or jsonb_array_length(p_steps) = 0 then
    raise exception 'At least one wash step is required.';
  end if;

  if not exists (
    select 1
    from public.wash_logs
    where wash_logs.id = p_wash_log_id
      and wash_logs.user_id = auth.uid()
  ) then
    raise exception 'Wash log does not belong to the current user.';
  end if;

  if not exists (
    select 1
    from public.cars
    where cars.id = p_car_id
      and cars.user_id = auth.uid()
  ) then
    raise exception 'Selected car does not belong to the current user.';
  end if;

  update public.wash_logs
  set
    car_id = p_car_id,
    title = p_title,
    wash_date = p_wash_date,
    location = p_location,
    duration_minutes = p_duration_minutes,
    cost = p_cost,
    weather = p_weather,
    dirt_level = p_dirt_level,
    satisfaction = p_satisfaction,
    memo = p_memo,
    visibility = p_visibility
  where id = p_wash_log_id
    and user_id = auth.uid();

  delete from public.wash_steps
  where wash_log_id = p_wash_log_id;

  insert into public.wash_steps (
    wash_log_id,
    step_type,
    product_name,
    memo,
    step_order
  )
  select
    p_wash_log_id,
    trim(step->>'step_type'),
    nullif(trim(coalesce(step->>'product_name', '')), ''),
    nullif(trim(coalesce(step->>'memo', '')), ''),
    coalesce((step->>'step_order')::integer, ordinal_position::integer)
  from jsonb_array_elements(p_steps) with ordinality as steps(step, ordinal_position);

  return p_wash_log_id;
end;
$$;

grant execute on function public.create_wash_log_with_steps(
  uuid,
  uuid,
  text,
  date,
  text,
  integer,
  numeric,
  text,
  integer,
  integer,
  text,
  text,
  jsonb
) to authenticated;

grant execute on function public.update_wash_log_with_steps(
  uuid,
  uuid,
  uuid,
  text,
  date,
  text,
  integer,
  numeric,
  text,
  integer,
  integer,
  text,
  text,
  jsonb
) to authenticated;
