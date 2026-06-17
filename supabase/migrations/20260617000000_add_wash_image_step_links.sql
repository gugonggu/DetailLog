alter table public.wash_images
add column if not exists wash_step_id uuid references public.wash_steps(id) on delete cascade;

create index if not exists wash_images_wash_step_id_idx
on public.wash_images (wash_step_id);
