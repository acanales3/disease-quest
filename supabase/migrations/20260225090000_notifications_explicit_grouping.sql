alter table public.notifications
  add column if not exists type text,
  add column if not exists actor_user_id uuid,
  add column if not exists is_read boolean not null default false,
  add column if not exists metadata jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notifications_actor_user_id_fkey'
  ) then
    alter table public.notifications
      add constraint notifications_actor_user_id_fkey
      foreign key (actor_user_id)
      references public.users(id)
      on delete set null;
  end if;
end $$;

create index if not exists notifications_user_id_is_read_idx
  on public.notifications (user_id, is_read, timestamp_sent desc);

create index if not exists notifications_type_idx
  on public.notifications (type);
