# ALMAGD Admin — Implementation Spec (New Pratama Booking & Guest System)

> **Audience:** an AI coding agent (e.g. Gemini Flash). Read this entire file before writing any code.
> Follow it literally. When something is not specified, choose the simplest option and log it in `admin/PROGRESS.md` under "Decisions I made".
> A senior reviewer will review your work against this spec after you finish.

---

## 0. Golden rules (read first, obey always)

1. **Only create/modify files inside `/home/omar/Desktop/ALMAGD/admin/`.** Never touch the public website (`/home/omar/Desktop/ALMAGD/src`, `public`, `package.json` at root, `astro.config.mjs`, etc.).
2. **Copy the SQL in section 4 verbatim.** Do not "improve" it. If you believe something is wrong, keep it as-is and write the concern in `PROGRESS.md`.
3. **Work task by task in the order of section 9.** After each task run the task's "Done when" checks. Do not start the next task until the checks pass.
4. **Keep a log** in `admin/PROGRESS.md`: for each task write `- [x] T## — short summary — checks run + result`. Keep a section "Decisions I made" and a section "Open problems".
5. **TypeScript strict mode. No `any`.** No `// @ts-ignore`. No disabled ESLint rules.
6. **Never commit secrets.** `.env.local` must be in `admin/.gitignore`. The service-role key is only used by the import script via environment variables, never in frontend code.
7. **Dates:** dates are strings in `YYYY-MM-DD` format everywhere (DB type `date`). Never do `new Date('2026-10-01')` (timezone bug). Use helpers from `src/lib/dates.ts` (section 6.3) only.
8. **Money:** Indonesian Rupiah, whole integers (`bigint` in DB, `number` in TS). No decimals. Format only with `formatIDR()` from `src/lib/money.ts`.
9. **RTL:** the UI supports Arabic (RTL) and Indonesian (LTR). Use only Tailwind *logical* classes: `ms-* me-* ps-* pe-* start-* end-* text-start text-end border-s border-e rounded-s rounded-e`. **Forbidden:** `ml- mr- pl- pr- left- right- text-left text-right border-l border-r rounded-l rounded-r`.
10. **Every user-visible string goes through `t('key')`.** No hard-coded Arabic/Indonesian/English text in components.
11. If you get stuck on the same error for more than 3 attempts, stop, write it under "Open problems" in `PROGRESS.md`, and move on to the next independent task.

---

## 1. Goal

Replace the Excel workbook `New Villa Pratama 1.xlsx` with a web admin panel where staff:
- record bookings and guest details,
- record payments,
- see a visual room calendar and a "today" dashboard,
- (manager only) see revenue/occupancy reports and export to Excel.

Scope phase 1: **New Pratama only** (24 villas, 72 physical rooms).

## 2. Users & roles

| Role | Code | Can |
|---|---|---|
| Manager (owner) | `manager` | Everything: all data, reports, settings, staff management, delete, view ID photos |
| Reception | `reception` | Create/edit guests & bookings, add payments, view calendar & today page. **Cannot**: delete anything, edit/delete payments, see Reports page, see Settings, view ID photos |

Users are created by the manager in the Supabase dashboard (Authentication → Add user), then a row is added to `staff` (see section 4.3). There is **no public sign-up**.

## 3. Tech stack (use exactly these)

| Concern | Choice |
|---|---|
| Build | Vite 5 + React 18 + TypeScript 5 (strict) |
| Routing | `react-router-dom` ^6.26 |
| Backend | Supabase (Postgres + Auth + Storage), `@supabase/supabase-js` ^2.45 |
| Server state | `@tanstack/react-query` ^5 |
| Forms | `react-hook-form` ^7.53 + `zod` ^3.23 + `@hookform/resolvers` ^3.9 |
| Dates | `date-fns` ^3.6 |
| Charts | `recharts` ^2.12 |
| Styling | Tailwind CSS ^3.4 (+ postcss, autoprefixer) |
| Excel export & import | SheetJS: `"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"` |
| Tests | `vitest` ^2 |
| Local DB | Supabase CLI (already installed at `/home/omar/.npm-global/bin/supabase`) + Docker (installed) |

Do **not** add other UI libraries (no MUI, no Ant, no shadcn CLI). Build small components yourself in `src/components/ui/`.

### 3.1 Brand tokens (from the public site) — put in `tailwind.config.ts` `theme.extend.colors`

```ts
navy: { DEFAULT: '#001E47', dark: '#001330', light: '#163B6B', 100: '#DCE5F2' },
gold: { DEFAULT: '#C88B2C', light: '#DCA54C', dark: '#A46E1B', text: '#945F12' },
mist: '#F8F6F1', stone: '#ECE7DE', ink: '#0A1626', muted: '#536275',
line: '#D8D2C5', danger: '#B3261E', success: '#2E7D4F',
```
Font: copy `/home/omar/Desktop/ALMAGD/public/fonts/ibm-plex-sans-arabic-*.woff2` and `plus-jakarta-sans-*.woff2` into `admin/public/fonts/` and declare `@font-face` in `src/index.css`. Arabic UI uses IBM Plex Sans Arabic; Indonesian uses Plus Jakarta Sans.

Look: clean, white cards on `mist` background, navy sidebar, gold for primary accents/buttons, rounded-xl, subtle shadows. Mobile-first: sidebar becomes a bottom tab bar under 768px.

---

## 4. Database (copy verbatim)

### 4.1 Setup commands

```bash
cd /home/omar/Desktop/ALMAGD/admin
supabase init            # creates supabase/config.toml (answer "N" to any VS Code/Deno prompts)
supabase start           # needs Docker; prints API URL + anon key + service_role key
# put the file from 4.2 at: supabase/migrations/20261024000000_init.sql
supabase db reset        # applies migrations
supabase status          # shows the keys again
```

Create `admin/.env.local` (gitignored):
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from supabase status>
```
Create `admin/.env.example` with the same keys and empty values (committed).

### 4.2 Migration `supabase/migrations/20261024000000_init.sql`

```sql
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
```

### 4.3 Local seed users — `supabase/seed.sql`

Create two local test users so the app can be tested (local only):

```sql
-- local dev only. Passwords: "password123"
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change)
values
 ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111111','authenticated','authenticated',
  'manager@almagd.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', now(), now(), '', '', '', ''),
 ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222222','authenticated','authenticated',
  'reception@almagd.test', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
values
 (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"manager@almagd.test"}','email', now(), now(), now()),
 (gen_random_uuid(),'22222222-2222-2222-2222-222222222222','22222222-2222-2222-2222-222222222222',
  '{"sub":"22222222-2222-2222-2222-222222222222","email":"reception@almagd.test"}','email', now(), now(), now());

insert into public.staff (id, full_name, role) values
 ('11111111-1111-1111-1111-111111111111', 'Manager Test', 'manager'),
 ('22222222-2222-2222-2222-222222222222', 'Reception Test', 'reception');
```

### 4.4 Database tests — `supabase/tests/smoke.sql`

Run with: `psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/smoke.sql`
All must print `PASS`. Copy verbatim:

```sql
begin;
do $$
declare v1 int; v1r1 int; g uuid; b1 uuid; ok boolean;
begin
  select id into v1 from units where name = 'Villa 1';
  select id into v1r1 from units where name = 'Villa 1 - Kamar 1';
  if (select count(*) from units where kind='room') <> 72 then raise exception 'FAIL room count'; end if;
  if (select count(*) from units where kind='villa') <> 24 then raise exception 'FAIL villa count'; end if;
  raise notice 'PASS unit counts';

  insert into guests(full_name) values ('Test Guest') returning id into g;

  -- 1) whole villa booking occupies its 4 rooms
  insert into bookings(guest_id, unit_id, check_in, check_out, source_code, total_amount)
  values (g, v1, '2030-01-10', '2030-01-12', 'walk_in', 2000000) returning id into b1;
  if (select count(*) from room_occupancy where booking_id = b1) <> 4 then raise exception 'FAIL villa occupancy'; end if;
  raise notice 'PASS villa occupies rooms';

  -- 2) booking one of its rooms on overlapping night must fail
  ok := false;
  begin
    insert into bookings(guest_id, unit_id, check_in, check_out, source_code, total_amount)
    values (g, v1r1, '2030-01-11', '2030-01-13', 'walk_in', 300000);
  exception when exclusion_violation then ok := true;
  end;
  if not ok then raise exception 'FAIL double booking allowed'; end if;
  raise notice 'PASS double booking rejected';

  -- 3) check-out day is free
  insert into bookings(guest_id, unit_id, check_in, check_out, source_code, total_amount)
  values (g, v1r1, '2030-01-12', '2030-01-13', 'walk_in', 300000);
  raise notice 'PASS check-out day bookable';

  -- 4) cancelling frees the rooms
  update bookings set status = 'cancelled' where id = b1;
  if exists (select 1 from room_occupancy where booking_id = b1) then raise exception 'FAIL cancel did not free'; end if;
  raise notice 'PASS cancel frees rooms';

  -- 5) available_units excludes Villa 1 when one of its rooms is taken
  if exists (select 1 from available_units('2030-01-12','2030-01-13') where id = v1) then raise exception 'FAIL availability'; end if;
  if not exists (select 1 from available_units('2030-01-12','2030-01-13') where name = 'Villa 1 - Kamar 2') then raise exception 'FAIL availability 2'; end if;
  raise notice 'PASS available_units';

  -- 6) payment overview
  insert into payments(booking_id, amount, method) values (b1, 500000, 'cash');
  if (select payment_status from booking_overview where id = b1) <> 'refund_due' then raise exception 'FAIL overview'; end if;
  raise notice 'PASS booking_overview';
end $$;
rollback;
```

---

## 5. Folder structure (create exactly this)

```
admin/
  IMPLEMENTATION_SPEC.md        (this file — do not edit)
  PROGRESS.md                   (your log)
  README.md                     (how to run locally + deploy; in English)
  .env.example  .gitignore  index.html  package.json  tsconfig.json  tsconfig.node.json
  vite.config.ts  tailwind.config.ts  postcss.config.js
  public/fonts/*.woff2  public/favicon.svg (copy from ../public/favicon.svg)
  scripts/import-excel.mjs
  supabase/config.toml  supabase/migrations/20261024000000_init.sql  supabase/seed.sql  supabase/tests/smoke.sql
  src/
    main.tsx  App.tsx  index.css  vite-env.d.ts
    lib/supabase.ts  lib/database.types.ts  lib/dates.ts  lib/money.ts  lib/errors.ts  lib/exportXlsx.ts
    lib/dates.test.ts  lib/money.test.ts
    i18n/I18nProvider.tsx  i18n/id.ts  i18n/ar.ts
    auth/AuthProvider.tsx  auth/RequireAuth.tsx  auth/RequireManager.tsx
    api/units.ts  api/guests.ts  api/bookings.ts  api/payments.ts  api/calendar.ts  api/reports.ts  api/staff.ts  api/blocks.ts
    components/ui/Button.tsx  Input.tsx  Select.tsx  Textarea.tsx  Field.tsx  Card.tsx  Badge.tsx
                 Modal.tsx  Drawer.tsx  Table.tsx  EmptyState.tsx  Spinner.tsx  Toast.tsx  ConfirmDialog.tsx  StatCard.tsx
    components/layout/AppShell.tsx  Sidebar.tsx  BottomNav.tsx  LanguageToggle.tsx
    components/booking/BookingForm.tsx  GuestPicker.tsx  UnitPicker.tsx  PaymentForm.tsx  PaymentList.tsx
                       StatusBadge.tsx  PaymentStatusBadge.tsx  SourceBadge.tsx
    components/calendar/RoomCalendar.tsx  CalendarToolbar.tsx
    components/guest/GuestForm.tsx  IdPhotoUpload.tsx
    pages/LoginPage.tsx  TodayPage.tsx  CalendarPage.tsx  BookingsPage.tsx  BookingDetailPage.tsx
          NewBookingPage.tsx  GuestsPage.tsx  GuestDetailPage.tsx  ReportsPage.tsx
          SettingsPage.tsx  NotFoundPage.tsx  ConfigErrorPage.tsx
```

`lib/database.types.ts`: generate with `supabase gen types typescript --local > src/lib/database.types.ts` and use `createClient<Database>(...)`.

---

## 6. Shared code contracts

### 6.1 `lib/supabase.ts`
- Read `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. If either is missing, export `supabase = null` and `App.tsx` renders `ConfigErrorPage` ("Supabase is not configured — see README").

### 6.2 `lib/errors.ts`
`export function friendlyError(e: unknown): string` returns an **i18n key**:
| Postgres code / condition | key |
|---|---|
| `23P01` (exclusion_violation) | `errors.unitNotAvailable` |
| `42501` or RLS "row-level security" message | `errors.forbidden` |
| `23514` (check violation) | `errors.invalidData` |
| `23503` (FK violation) | `errors.inUse` |
| network failure / `Failed to fetch` | `errors.network` |
| anything else | `errors.unknown` |

### 6.3 `lib/dates.ts` (+ unit tests)
```ts
export type ISODate = string; // 'YYYY-MM-DD'
export function todayISO(): ISODate                      // local device date
export function addDaysISO(d: ISODate, n: number): ISODate
export function nightsBetween(checkIn: ISODate, checkOut: ISODate): number   // '2026-10-01','2026-10-04' -> 3
export function eachNight(checkIn: ISODate, checkOut: ISODate): ISODate[]    // excludes checkOut
export function parseDateRange(r: string): { start: ISODate; end: ISODate }  // '[2026-10-01,2026-10-04)' -> {start:'2026-10-01', end:'2026-10-04'}
export function formatDateHuman(d: ISODate, locale: 'id' | 'ar'): string    // e.g. 'Sab, 24 Okt 2026' / 'السبت ٢٤ أكتوبر ٢٠٢٦'
export function excelSerialToISO(serial: number): ISODate                   // 46296 -> '2026-10-01'
```
Implement with `date-fns` `parseISO`/`format`/`addDays`/`differenceInCalendarDays`. `excelSerialToISO`: `new Date(Date.UTC(1899, 11, 30) + serial * 86400000).toISOString().slice(0, 10)`.

### 6.4 `lib/money.ts` (+ unit tests)
```ts
export function formatIDR(n: number): string   // 3150000 -> 'Rp 3.150.000' (Intl 'id-ID', currency IDR, 0 decimals)
export function parseIDR(s: string): number    // 'Rp 3.150.000' or '3150000' -> 3150000 ; strips non-digits except leading '-'
```
Money inputs: show formatted with thousand separators while typing; store as number.

### 6.5 Data access (`src/api/*.ts`)
Each file exports plain async functions **and** react-query hooks. Query keys: `['units']`, `['sources']`, `['guests', search]`, `['guest', id]`, `['bookings', filters]`, `['booking', id]`, `['payments', bookingId]`, `['calendar', from, to]`, `['today', date]`, `['report-daily', from, to]`, `['report-source', from, to]`, `['staff']`. After any mutation, invalidate the related keys **and** `['calendar']` and `['today']`.

Key functions:
- `searchGuests(q)`: if `q` length < 2 return latest 20; else `.or('full_name.ilike.%q%,phone.ilike.%q%,id_number.ilike.%q%')` limit 20. Escape `%`, `,`, `(`, `)` in `q`.
- `getAvailableUnits(from, to, excludeBookingId?)`: `supabase.rpc('available_units', {...})`.
- `listBookings(filters)`: select from `booking_overview`; filters: date range overlap (`check_in < to` and `check_out > from`), status, source, payment_status, text search (code or guest_name ilike). Order by `check_in desc`. Paginate 50.
- `getCalendar(from, to)`: from `room_occupancy` select `id, room_id, stay, booking_id, block_id, bookings(code, status, source_code, guests(full_name)), unit_blocks(reason)` with `.overlaps('stay', \`[${from},${to})\`)`.
- `createBooking(input, firstPayment?)`: insert booking → if `firstPayment` insert payment. If the payment insert fails, show error but keep the booking (navigate to its detail page).

---

## 7. Screens (behaviour spec)

Routes (all except `/login` wrapped in `RequireAuth` + `AppShell`):

| Path | Page | Who |
|---|---|---|
| `/login` | LoginPage | public |
| `/` | TodayPage | staff |
| `/calendar` | CalendarPage | staff |
| `/bookings` | BookingsPage | staff |
| `/bookings/new?unit=ID&from=YYYY-MM-DD` | NewBookingPage | staff |
| `/bookings/:id` | BookingDetailPage | staff |
| `/guests` , `/guests/:id` | GuestsPage, GuestDetailPage | staff |
| `/reports` | ReportsPage | manager (`RequireManager`; reception sees 403 message) |
| `/settings` | SettingsPage | manager |

Sidebar hides Reports/Settings for reception. Header shows staff name, role badge, language toggle, logout.

### 7.1 LoginPage
Email + password (`supabase.auth.signInWithPassword`). Logo `../public/images/logo-almagd.png` copied to `admin/public/`. If the user logs in but has no active `staff` row → sign out and show `errors.notStaff`.

### 7.2 TodayPage (`/`)
Date = today (with ◀ ▶ to move days). Show:
- 4 `StatCard`s: **Occupancy** (occupied rooms / 72, %), **Arrivals today**, **Departures today**, **In-house**.
- Manager only extra 2 cards: **Received today** (sum of payments `paid_on = date`, split cash/transfer/app), **Outstanding balance** (sum of `balance > 0` for non-cancelled bookings).
- Lists (cards on mobile, table on desktop): Arrivals (check_in = date, status confirmed) with button **Check-in** (sets status `checked_in`); Departures (check_out = date) with button **Check-out** (sets `checked_out`; if balance > 0 show a ConfirmDialog warning first); Unpaid bookings (`payment_status in (unpaid, partial)` and check_in <= date) sorted by balance desc.

### 7.3 CalendarPage (`/calendar`) — the most important screen
- Toolbar: ◀ / ▶ (move by 7 days), "Today" button, range selector 14 / 30 days, source legend.
- Grid: rows = units grouped by villa: a **villa header row** (bold, `group_label`, shows bar if the *whole villa* is booked) then its room rows; then "Kamar Lepas" group. Columns = days. First column (unit name) and header row (day number + weekday, today highlighted gold, weekends tinted) are **sticky**. Horizontal scroll on small screens.
- Implement with CSS grid: `grid-template-columns: 180px repeat(N, minmax(44px, 1fr))`. A booking bar is a div placed with `gridColumn: \`${startCol} / ${endCol}\`` on its row, clipped to the visible range, color = source color, text = `code · guest name`. Cancelled bookings are not shown. Blocks shown as striped grey with reason.
- Villa bookings: show the bar on the villa header row and a light tint on each child room row (child rows get the same occupancy rows from DB; render them as a thin tint instead of a full bar when `booking.unit_id` is the villa).
- Click empty cell → navigate `/bookings/new?unit=<roomId>&from=<date>`. Click bar → `/bookings/:id`.
- Must render 96 rows × 30 days smoothly (no per-cell queries; one `getCalendar` call).

### 7.4 NewBookingPage / BookingForm
Single page, sections in order:
1. **Guest** — `GuestPicker`: search box (debounce 300ms) showing name, phone, last stay; pick existing OR "+ New guest" which expands inline `GuestForm` fields. Show a red banner if the picked guest has tag `blacklist`, gold badge if `vip`.
2. **Stay** — check-in, check-out (date inputs; default check-out = check-in + 1), shows "N nights". Adults, children.
3. **Unit** — `UnitPicker`: loads `available_units(check_in, check_out)`; grouped select (villa then its rooms). Unavailable units never appear. If the preselected unit from the URL is not available, show warning `booking.unitTaken`.
4. **Price** — toggle "per night" / "total". Per night × nights = total (computed, read-only). Source (select from `booking_sources`), OTA reference (shown only when source ≠ walk_in), due date (optional), notes.
5. **First payment (optional)** — amount (default = total), method, reference.

Validation (zod): guest required; check_out > check_in; unit required; total ≥ 0; adults ≥ 1; first payment amount > 0 if entered. Submit button disabled while saving. On `23P01` show `errors.unitNotAvailable` and refetch available units. On success → toast + navigate to detail page.

### 7.5 BookingDetailPage
Header: code, status badge, payment status badge, unit, dates, nights, guest (link). Money card: total / paid / balance. Actions: Edit (same form prefilled; `available_units` called with `p_exclude_booking`), Check-in, Check-out, Cancel (ConfirmDialog, sets `cancelled`), Mark no-show, Delete (manager only, ConfirmDialog). Payments list + "Add payment" (`PaymentForm` in a Modal; negative amount allowed with explicit "Refund" toggle). Manager can edit/delete payments. Show "Needs review" banner if `needs_review`, with a button (manager) to clear it. Manager sees a collapsible **History** from `audit_log` for this booking.

### 7.6 BookingsPage
Filter bar: date range, status, source, payment status, search. Table columns: code, guest, unit, check-in, check-out, nights, source badge, total, balance, status. Row click → detail. Button **Export to Excel** (current filters, all pages) via `lib/exportXlsx.ts`.

### 7.7 GuestsPage / GuestDetailPage
List with search, columns: name, phone, nationality, # stays, last stay, tags. Detail: editable `GuestForm` (name*, phone, email, nationality, ID type, ID number, tags vip/blacklist, notes), stay history (bookings of this guest), total spent (sum of paid). `IdPhotoUpload`: any staff can upload (path `guest-ids/<guestId>/<timestamp>.<ext>`, max 5 MB, jpg/png/webp, `upsert: false`), then set `guests.id_photo_path`. Only manager sees the photo (signed URL, 60s) and a delete button; reception sees "Photo on file ✓".

### 7.8 ReportsPage (manager)
Period picker: this month (default), last month, this quarter, this year, custom. Data from `report_daily` and `report_by_source`. Show:
- KPI cards: Revenue (sum revenue), Occupancy % (sum occupied / sum (total − blocked)), ADR (revenue / occupied room-nights), RevPAR (revenue / sum total rooms), Payments received (cash/transfer/app/other).
- Line chart: daily occupancy %. Bar chart: revenue per day (or per month if range > 62 days — aggregate client-side). Pie/donut: revenue by source. Table: per month rows (Month, Revenue, Cash, Transfer, App, Room-nights, Occupancy %).
- Buttons: **Export Excel** (sheets: Daily, By source, Monthly), **Print / PDF** (`window.print()` with a print stylesheet hiding nav).

Note: "revenue" = booking value allocated per night (same as the Excel). "Payments received" = cash actually recorded. Label both clearly.

### 7.9 SettingsPage (manager)
Tabs: **Units** (edit default_rate, active toggle), **Sources** (label, color, active), **Blocks** (list + create block: unit, start, end, reason; delete), **Staff** (list staff, change role, active toggle; text explaining new users are added in Supabase dashboard then here by entering their user UUID + name + role).

---

## 8. i18n

- `I18nProvider` with `lang: 'id' | 'ar'`, default `'id'`, persisted in `localStorage('almagd.lang')`. Sets `document.documentElement.lang` and `dir` (`rtl` for ar).
- `t(key, vars?)` with nested keys and `{var}` interpolation. `id.ts` is the source of truth; `ar.ts` must have **exactly the same keys** — add a vitest test that compares key sets.
- Numbers/currency always in Latin digits (`id-ID` format) in both languages, for consistency with receipts. Dates use the selected locale.

Required glossary (use these exact translations):

| key concept | Indonesian | Arabic |
|---|---|---|
| Booking | Booking | حجز |
| Guest | Tamu | الضيف |
| Check-in / Check-out | Check-in / Check-out | الوصول / المغادرة |
| Night(s) | Malam | ليلة / ليالٍ |
| Villa / Room | Villa / Kamar | فيلا / غرفة |
| Source | Sumber | المصدر |
| Total / Paid / Balance | Total / Dibayar / Sisa | الإجمالي / المدفوع / المتبقي |
| Paid in full / Partial / Unpaid / Refund due | Lunas / Dibayar Sebagian / Belum Bayar / Perlu Refund | مدفوع بالكامل / مدفوع جزئياً / غير مدفوع / يستحق استرجاع |
| Confirmed / Checked-in / Checked-out / Cancelled / No-show | Terkonfirmasi / Menginap / Sudah Check-out / Batal / Tidak Datang | مؤكد / مقيم / غادر / ملغى / لم يحضر |
| Cash / Transfer / App / Other | Tunai / Transfer / Aplikasi / Lainnya | نقداً / تحويل / عبر التطبيق / أخرى |
| Available / Occupied / Blocked | Tersedia / Terisi / Diblokir | متاح / مشغول / مغلق |
| Occupancy / Revenue | Hunian / Pendapatan | الإشغال / الإيرادات |
| Today / Calendar / Reports / Settings | Hari Ini / Kalender / Laporan / Pengaturan | اليوم / التقويم / التقارير / الإعدادات |
| Unit not available for these dates | Unit tidak tersedia pada tanggal ini | الوحدة غير متاحة في هذه التواريخ |

---

## 9. Excel import — `scripts/import-excel.mjs`

Run: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-excel.mjs "../New Villa Pratama 1.xlsx" [--commit]`
Without `--commit` = **dry run** (no writes, only report). Always writes `scripts/import-report.md`.

- Read only sheets `INPUT BOOKING` and `INPUT BAYAR`: `XLSX.readFile(path, { sheets: ['INPUT BOOKING','INPUT BAYAR'], cellDates: false })`, then `XLSX.utils.sheet_to_json(ws, { header: 1, raw: true })`. Dates arrive as serial numbers → `excelSerialToISO` (copy the function into the script).
- **INPUT BOOKING**: data starts at row index 4 (5th row). Columns (0-based): 0 Kode, 1 Nama tamu, 2 Villa/Kamar, 3 Check-in, 4 Check-out, 5 Sumber, 6 Total, 7 Jatuh tempo, 8 Status, 9 Catatan, 21 Referensi lama. **Ignore all other columns** (they are formulas, some contain `#REF!`).
  - Skip rows where col0 is empty, or col0 === 'Kode' (repeated header), or col2 empty.
  - Unit: match col2 to `units.name` exactly (after trim). No match → report & skip.
  - Source map: `Walk-in→walk_in, Tiket.com→tiket, Booking.com→booking, Agoda→agoda, Traveloka→traveloka, else→other`.
  - Status: `Batal→cancelled`; `Aktif` → `checked_out` if check_out <= today, `checked_in` if check_in <= today < check_out, else `confirmed`.
  - Guest: if name empty → `guest_id = null`, `needs_review = true`. Else dedupe by `trim().toUpperCase()` name; create one guest per unique name (store name in Title Case).
  - Insert with explicit `code` = col0 and `legacy_ref` = col21.
  - On error `23P01` (overlap) → do not insert; list in report under "Conflicts".
- **INPUT BAYAR**: data from row index 4. Columns: 0 Kode booking, 2 Tanggal bayar, 3 Jumlah, 4 Metode, 5 Catatan. Skip empty col0/col3. Method map `Cash→cash, Transfer→transfer, Aplikasi→app, else→other`. Booking matched by code; missing → report.
- After commit: call `rpc('reset_booking_code_seq')`.
- Report contents: counts (read / inserted / skipped), list of bookings without guest name, unknown units, conflicts, orphan payments, and bookings where sum(payments) ≠ total.
- Script must be **idempotent**: if a booking `code` already exists, skip it (and its payments) and count as "already imported".

---

## 10. Task list (do in order)

| ID | Task | Done when |
|---|---|---|
| T01 | Scaffold `admin/` with Vite React TS, Tailwind, deps from section 3, `.gitignore` (node_modules, dist, .env.local, supabase/.temp), README skeleton, PROGRESS.md | `npm run build` passes; `npm run dev` shows a page |
| T02 | Supabase local: `supabase init`, migration 4.2, seed 4.3, tests 4.4, `supabase start`, `supabase db reset` | smoke.sql prints 7× PASS; `select count(*) from units` = 96 |
| T03 | Generate `database.types.ts`; `lib/supabase.ts`, `dates.ts`, `money.ts`, `errors.ts` + vitest tests | `npx vitest run` green; `npx tsc --noEmit` clean |
| T04 | i18n provider + id/ar dictionaries + key-parity test | test green; toggling switches dir rtl/ltr |
| T05 | Auth: AuthProvider (session + staff row + role), RequireAuth, RequireManager, LoginPage, ConfigErrorPage | can log in as both seed users; non-staff rejected |
| T06 | UI kit (`components/ui/*`) + AppShell, Sidebar, BottomNav, LanguageToggle | pages navigable on desktop & 375px width, both languages |
| T07 | `api/*` functions + hooks | type-checks; manual call from a page works |
| T08 | GuestsPage, GuestDetailPage, GuestForm, IdPhotoUpload | create/edit/search guests; reception cannot view photo |
| T09 | BookingForm, GuestPicker, UnitPicker, NewBookingPage | create booking; attempting overlap shows translated error |
| T10 | BookingDetailPage, PaymentForm, PaymentList, status actions, edit, history | full lifecycle works; balance updates |
| T11 | BookingsPage with filters + Excel export | export opens in Excel/LibreOffice with correct numbers |
| T12 | CalendarPage | 30-day view renders 96 rows; click empty cell / bar navigates correctly; villa bars correct |
| T13 | TodayPage | numbers match DB for a test date; check-in/out buttons work |
| T14 | ReportsPage + exports + print CSS | KPIs match a manual SQL check; reception blocked |
| T15 | SettingsPage (units, sources, blocks, staff) | creating a block hides the unit from UnitPicker and shows on calendar |
| T16 | Import script; run dry-run on the real Excel file, then `--commit` on local DB | report generated; imported ~141 bookings; calendar shows Oct 2026 data |
| T17 | Polish: loading/empty/error states on every page, toasts, keyboard focus, `README.md` complete (local run, deploy to Cloudflare Pages + Supabase cloud: `supabase link` + `supabase db push`, env vars, creating users) | `npm run build`, `npx tsc --noEmit`, `npx vitest run`, smoke.sql all pass |

## 11. Definition of done (reviewer checklist)

- [ ] No files changed outside `admin/` (`git status` at repo root shows only `admin/`).
- [ ] SQL migration identical to section 4.2 (diff-able).
- [ ] smoke.sql 7× PASS, vitest green, `tsc --noEmit` clean, `npm run build` clean.
- [ ] No forbidden physical Tailwind classes: `grep -rnE "\b(ml|mr|pl|pr)-[0-9]|\b(left|right)-[0-9]|text-(left|right)\b" src` returns nothing.
- [ ] No hard-coded UI text (spot check), `ar.ts` / `id.ts` key parity test passes.
- [ ] No `any`, no `@ts-ignore`, no service-role key in `src/`.
- [ ] Reception user: cannot open /reports, /settings, cannot delete, cannot see ID photo.
- [ ] Double booking impossible from UI; villa booking blocks its rooms on the calendar.
- [ ] Import report present; numbers sane.
- [ ] PROGRESS.md complete with decisions & open problems.
