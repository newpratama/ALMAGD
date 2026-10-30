-- =========================================================
-- ALMAGD admin — initial schema
-- =========================================================
create extension if not exists btree_gist;
create extension if not exists pg_trgm;

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ---------- staff ----------
create table public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('manager','reception')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where id = auth.uid() and active);
$$;

create or replace function public.is_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where id = auth.uid() and active and role = 'manager');
$$;

-- ---------- units (villas + rooms) ----------
-- kind='villa' : a whole villa, bookable as one unit, has child rooms
-- kind='room'  : a physical room. parent_id = its villa, or NULL for "Kamar Lepas" rooms
create table public.units (
  id serial primary key,
  name text not null unique,
  kind text not null check (kind in ('villa','room')),
  parent_id int references public.units(id),
  group_label text not null,
  sort_order int not null default 0,
  default_rate bigint check (default_rate is null or default_rate >= 0),
  active boolean not null default true,
  check (kind = 'room' or parent_id is null)
);

do $$
declare
  counts int[] := array[4,4,3,2,3,3,3,3,3,3,3,3,3,3,3,3,3,2,3,3,2,2,1,1];
  v int; k int; vid int;
begin
  for v in 1..24 loop
    insert into public.units(name, kind, group_label, sort_order)
      values ('Villa ' || v, 'villa', 'Villa ' || v, v * 10) returning id into vid;
    for k in 1..counts[v] loop
      insert into public.units(name, kind, parent_id, group_label, sort_order)
        values ('Villa ' || v || ' - Kamar ' || k, 'room', vid, 'Villa ' || v, v * 10 + k);
    end loop;
  end loop;
  for k in 1..6 loop
    insert into public.units(name, kind, group_label, sort_order)
      values ('Kamar Lepas ' || k, 'room', 'Kamar Lepas', 1000 + k);
  end loop;
end $$;
-- result: 24 villas + 72 rooms

-- ---------- booking sources ----------
create table public.booking_sources (
  code text primary key,
  label text not null,
  color text not null default '#536275',
  sort_order int not null default 0,
  active boolean not null default true
);
insert into public.booking_sources(code, label, color, sort_order) values
  ('walk_in',   'Walk-in',     '#2E7D4F', 1),
  ('tiket',     'Tiket.com',   '#0064D2', 2),
  ('booking',   'Booking.com', '#003580', 3),
  ('agoda',     'Agoda',       '#B0287A', 4),
  ('traveloka', 'Traveloka',   '#1BA0E2', 5),
  ('other',     'Lainnya',     '#536275', 6);

-- ---------- guests ----------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  phone text,
  email text,
  nationality text,
  id_type text check (id_type in ('ktp','passport','sim','other')),
  id_number text,
  id_photo_path text,
  tags text[] not null default '{}',          -- allowed values: 'vip', 'blacklist'
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);
create index guests_name_trgm on public.guests using gin (full_name gin_trgm_ops);
create index guests_phone_idx on public.guests (phone);
create trigger guests_updated before update on public.guests
  for each row execute function public.set_updated_at();

-- ---------- bookings ----------
create sequence public.booking_code_seq;
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('B' || lpad(nextval('public.booking_code_seq')::text, 5, '0')),
  guest_id uuid references public.guests(id),
  unit_id int not null references public.units(id),
  check_in date not null,
  check_out date not null,
  adults int not null default 1 check (adults >= 0),
  children int not null default 0 check (children >= 0),
  source_code text not null references public.booking_sources(code),
  ota_reference text,
  total_amount bigint not null check (total_amount >= 0),
  due_date date,
  status text not null default 'confirmed'
    check (status in ('confirmed','checked_in','checked_out','cancelled','no_show')),
  notes text,
  legacy_ref text,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);
create index bookings_dates_idx on public.bookings (check_in, check_out);
create index bookings_guest_idx on public.bookings (guest_id);
create trigger bookings_updated before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------- unit blocks (maintenance / broken) ----------
create table public.unit_blocks (
  id uuid primary key default gen_random_uuid(),
  unit_id int not null references public.units(id),
  start_date date not null,
  end_date date not null,               -- exclusive, like check_out
  reason text not null,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  check (end_date > start_date)
);

-- ---------- room occupancy (THE anti double-booking table) ----------
-- One row per physical room per booking/block. Filled ONLY by triggers.
-- stay = [check_in, check_out)  -> the check-out day is free for a new guest.
create table public.room_occupancy (
  id bigserial primary key,
  room_id int not null references public.units(id),
  stay daterange not null,
  booking_id uuid references public.bookings(id) on delete cascade,
  block_id uuid references public.unit_blocks(id) on delete cascade,
  check ((booking_id is null) <> (block_id is null)),
  constraint no_double_booking exclude using gist (room_id with =, stay with &&)
);
create index room_occupancy_booking_idx on public.room_occupancy (booking_id);

create or replace function public.sync_booking_occupancy() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from room_occupancy where booking_id = new.id;
  if new.status not in ('cancelled','no_show') then
    insert into room_occupancy(room_id, stay, booking_id)
    select r.id, daterange(new.check_in, new.check_out, '[)'), new.id
    from units r
    where r.kind = 'room' and (r.id = new.unit_id or r.parent_id = new.unit_id);
  end if;
  return new;
end $$;
create trigger bookings_occupancy
  after insert or update of unit_id, check_in, check_out, status on public.bookings
  for each row execute function public.sync_booking_occupancy();

create or replace function public.sync_block_occupancy() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from room_occupancy where block_id = new.id;
  insert into room_occupancy(room_id, stay, block_id)
  select r.id, daterange(new.start_date, new.end_date, '[)'), new.id
  from units r
  where r.kind = 'room' and (r.id = new.unit_id or r.parent_id = new.unit_id);
  return new;
end $$;
create trigger blocks_occupancy
  after insert or update on public.unit_blocks
  for each row execute function public.sync_block_occupancy();

-- ---------- payments ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  paid_on date not null default current_date,
  amount bigint not null check (amount <> 0),     -- negative = refund
  method text not null check (method in ('cash','transfer','app','other')),
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
create index payments_booking_idx on public.payments (booking_id);
create index payments_date_idx on public.payments (paid_on);

-- ---------- audit log ----------
create table public.audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor uuid,
  table_name text not null,
  row_id text not null,
  action text not null,
  old_data jsonb,
  new_data jsonb
);

create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into audit_log(actor, table_name, row_id, action, old_data)
    values (auth.uid(), tg_table_name, old.id::text, tg_op, to_jsonb(old));
    return old;
  elsif tg_op = 'UPDATE' then
    insert into audit_log(actor, table_name, row_id, action, old_data, new_data)
    values (auth.uid(), tg_table_name, new.id::text, tg_op, to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into audit_log(actor, table_name, row_id, action, new_data)
    values (auth.uid(), tg_table_name, new.id::text, tg_op, to_jsonb(new));
    return new;
  end if;
end $$;
create trigger audit_guests   after insert or update or delete on public.guests      for each row execute function public.audit_trigger();
create trigger audit_bookings after insert or update or delete on public.bookings    for each row execute function public.audit_trigger();
create trigger audit_payments after insert or update or delete on public.payments    for each row execute function public.audit_trigger();
create trigger audit_blocks   after insert or update or delete on public.unit_blocks for each row execute function public.audit_trigger();

-- ---------- read view ----------
create view public.booking_overview with (security_invoker = true) as
select
  b.*,
  (b.check_out - b.check_in) as nights,
  coalesce(p.paid, 0)::bigint as paid,
  (b.total_amount - coalesce(p.paid, 0))::bigint as balance,
  case
    when b.status = 'cancelled' and coalesce(p.paid, 0) > 0 then 'refund_due'
    when b.status = 'cancelled' then 'cancelled'
    when coalesce(p.paid, 0) >= b.total_amount then 'paid'
    when coalesce(p.paid, 0) > 0 then 'partial'
    else 'unpaid'
  end as payment_status,
  g.full_name as guest_name,
  g.phone as guest_phone,
  g.tags as guest_tags,
  u.name as unit_name,
  u.kind as unit_kind
from public.bookings b
left join (select booking_id, sum(amount) as paid from public.payments group by booking_id) p
  on p.booking_id = b.id
left join public.guests g on g.id = b.guest_id
join public.units u on u.id = b.unit_id;

-- ---------- RPC: available units for a date range ----------
create or replace function public.available_units(p_from date, p_to date, p_exclude_booking uuid default null)
returns setof public.units
language sql stable security invoker set search_path = public as $$
  select u.* from units u
  where u.active
    and not exists (
      select 1 from units r
      join room_occupancy o on o.room_id = r.id
      where r.kind = 'room'
        and (r.id = u.id or r.parent_id = u.id)
        and o.stay && daterange(p_from, p_to, '[)')
        and (p_exclude_booking is null or o.booking_id is distinct from p_exclude_booking)
    )
  order by u.sort_order;
$$;

-- ---------- RPC: reports (manager only) ----------
create or replace function public.report_daily(p_from date, p_to date)
returns table(
  day date, rooms_total int, rooms_occupied int, rooms_blocked int, revenue numeric,
  paid_cash bigint, paid_transfer bigint, paid_app bigint, paid_other bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_manager() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  with days as (select d::date as day from generate_series(p_from, p_to, interval '1 day') d)
  select
    d.day,
    (select count(*)::int from units where kind = 'room' and active),
    (select count(*)::int from room_occupancy o where o.booking_id is not null and o.stay @> d.day),
    (select count(*)::int from room_occupancy o where o.block_id is not null and o.stay @> d.day),
    (select coalesce(sum(b.total_amount::numeric / (b.check_out - b.check_in)), 0)
       from bookings b
      where b.status not in ('cancelled','no_show') and d.day >= b.check_in and d.day < b.check_out),
    (select coalesce(sum(amount), 0)::bigint from payments p where p.paid_on = d.day and p.method = 'cash'),
    (select coalesce(sum(amount), 0)::bigint from payments p where p.paid_on = d.day and p.method = 'transfer'),
    (select coalesce(sum(amount), 0)::bigint from payments p where p.paid_on = d.day and p.method = 'app'),
    (select coalesce(sum(amount), 0)::bigint from payments p where p.paid_on = d.day and p.method = 'other')
  from days d
  order by d.day;
end $$;

create or replace function public.report_by_source(p_from date, p_to date)
returns table(source_code text, label text, color text, bookings int, nights int, revenue numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_manager() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  with n as (
    select b.id, b.source_code, gs::date as day,
           b.total_amount::numeric / (b.check_out - b.check_in) as rate
    from bookings b
    cross join generate_series(greatest(b.check_in, p_from), least(b.check_out - 1, p_to), interval '1 day') gs
    where b.status not in ('cancelled','no_show')
  )
  select s.code, s.label, s.color,
         count(distinct n.id)::int, count(n.day)::int, coalesce(sum(n.rate), 0)
  from booking_sources s
  left join n on n.source_code = s.code
  group by s.code, s.label, s.color, s.sort_order
  order by s.sort_order;
end $$;

-- used once by the import script (service role only)
create or replace function public.reset_booking_code_seq() returns void
language sql security definer set search_path = public as $$
  select setval('public.booking_code_seq',
    greatest(1, coalesce((select max(substring(code from 2)::int) from bookings where code ~ '^B[0-9]+$'), 1)));
$$;
revoke execute on function public.reset_booking_code_seq() from public, anon, authenticated;
grant execute on function public.reset_booking_code_seq() to service_role;

-- ---------- Row Level Security ----------
alter table public.staff           enable row level security;
alter table public.units           enable row level security;
alter table public.booking_sources enable row level security;
alter table public.guests          enable row level security;
alter table public.bookings        enable row level security;
alter table public.unit_blocks     enable row level security;
alter table public.room_occupancy  enable row level security;
alter table public.payments        enable row level security;
alter table public.audit_log       enable row level security;

create policy staff_select on public.staff for select to authenticated using (id = auth.uid() or public.is_manager());
create policy staff_write  on public.staff for all    to authenticated using (public.is_manager()) with check (public.is_manager());

create policy units_select on public.units for select to authenticated using (public.is_staff());
create policy units_write  on public.units for all    to authenticated using (public.is_manager()) with check (public.is_manager());

create policy sources_select on public.booking_sources for select to authenticated using (public.is_staff());
create policy sources_write  on public.booking_sources for all    to authenticated using (public.is_manager()) with check (public.is_manager());

create policy guests_select on public.guests for select to authenticated using (public.is_staff());
create policy guests_insert on public.guests for insert to authenticated with check (public.is_staff());
create policy guests_update on public.guests for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy guests_delete on public.guests for delete to authenticated using (public.is_manager());

create policy bookings_select on public.bookings for select to authenticated using (public.is_staff());
create policy bookings_insert on public.bookings for insert to authenticated with check (public.is_staff());
create policy bookings_update on public.bookings for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy bookings_delete on public.bookings for delete to authenticated using (public.is_manager());

create policy blocks_select on public.unit_blocks for select to authenticated using (public.is_staff());
create policy blocks_write  on public.unit_blocks for all    to authenticated using (public.is_manager()) with check (public.is_manager());

create policy occupancy_select on public.room_occupancy for select to authenticated using (public.is_staff());

create policy payments_select on public.payments for select to authenticated using (public.is_staff());
create policy payments_insert on public.payments for insert to authenticated with check (public.is_staff());
create policy payments_update on public.payments for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy payments_delete on public.payments for delete to authenticated using (public.is_manager());

create policy audit_select on public.audit_log for select to authenticated using (public.is_manager());

-- ---------- Storage: guest ID photos (private) ----------
insert into storage.buckets (id, name, public) values ('guest-ids', 'guest-ids', false)
on conflict (id) do nothing;

create policy guest_ids_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'guest-ids' and public.is_staff());
create policy guest_ids_select on storage.objects for select to authenticated
  using (bucket_id = 'guest-ids' and public.is_manager());
create policy guest_ids_delete on storage.objects for delete to authenticated
  using (bucket_id = 'guest-ids' and public.is_manager());
