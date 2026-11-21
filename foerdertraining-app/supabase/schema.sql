-- =====================================================================
-- Fördertraining – Buchungssystem
-- Einmal im Supabase-Dashboard unter "SQL Editor" ausführen.
--
-- Sicherheitskonzept:
--  * Eltern (anonym) haben KEINEN direkten Tabellenzugriff.
--    Sie sehen freie Termine nur über get_open_slots() (ohne Personendaten)
--    und buchen/stornieren ausschließlich über geprüfte Funktionen.
--  * Nur Nutzer in der Tabelle "admins" (= du als Trainer) dürfen
--    Termine anlegen und Buchungen mit Kontaktdaten sehen.
--  * Überbuchung ist ausgeschlossen: book_slot() sperrt den Slot-Datensatz
--    während der Prüfung (SELECT ... FOR UPDATE).
-- =====================================================================

create table if not exists public.slots (
  id               uuid primary key default gen_random_uuid(),
  starts_at        timestamptz not null,
  duration_minutes int  not null check (duration_minutes between 10 and 480),
  capacity         int  not null default 1 check (capacity between 1 and 30),
  location         text check (char_length(location) <= 200),
  note             text check (char_length(note) <= 500),
  created_at       timestamptz not null default now()
);
create index if not exists slots_starts_at_idx on public.slots (starts_at);

create table if not exists public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  slot_id             uuid not null references public.slots (id) on delete cascade,
  code                text not null unique,
  parent_name         text not null,
  email               text not null,
  phone               text not null default '',
  child_name          text not null,
  grade_level         text not null default '',
  focus_area          text not null default '',
  message             text not null default '',
  privacy_accepted_at timestamptz not null,
  status              text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at          timestamptz not null default now(),
  cancelled_at        timestamptz
);
create index if not exists bookings_slot_idx on public.bookings (slot_id);

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.slots    enable row level security;
alter table public.bookings enable row level security;
alter table public.admins   enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins manage slots" on public.slots;
create policy "admins manage slots" on public.slots
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage bookings" on public.bookings;
create policy "admins manage bookings" on public.bookings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Öffentliche Funktion: freie Termine (ohne Personendaten)
-- ---------------------------------------------------------------------
create or replace function public.get_open_slots()
returns table (
  id uuid, starts_at timestamptz, duration_minutes int, capacity int,
  booked_count int, location text, note text
)
language sql stable security definer set search_path = public
as $$
  select s.id, s.starts_at, s.duration_minutes, s.capacity,
         (select count(*)::int from public.bookings b
           where b.slot_id = s.id and b.status = 'confirmed') as booked_count,
         s.location, s.note
  from public.slots s
  where s.starts_at > now()
  order by s.starts_at;
$$;

-- ---------------------------------------------------------------------
-- Öffentliche Funktion: Slot buchen (atomar, ohne Überbuchung)
-- ---------------------------------------------------------------------
create or replace function public.book_slot(
  p_slot_id uuid,
  p_parent_name text,
  p_email text,
  p_phone text,
  p_child_name text,
  p_grade_level text,
  p_focus_area text,
  p_message text,
  p_privacy_accepted boolean
)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_slot   public.slots%rowtype;
  v_booked int;
  v_code   text;
begin
  if not coalesce(p_privacy_accepted, false) then
    raise exception 'invalid_input: privacy';
  end if;
  if char_length(trim(coalesce(p_parent_name, ''))) not between 2 and 100
     or char_length(trim(coalesce(p_child_name, ''))) not between 1 and 100
     or coalesce(p_email, '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     or char_length(p_email) > 200
     or char_length(coalesce(p_phone, '')) > 40
     or char_length(coalesce(p_message, '')) > 1000 then
    raise exception 'invalid_input';
  end if;

  select * into v_slot from public.slots where id = p_slot_id for update;
  if not found then
    raise exception 'slot_not_found';
  end if;
  if v_slot.starts_at <= now() then
    raise exception 'slot_in_past';
  end if;

  select count(*) into v_booked from public.bookings
   where slot_id = p_slot_id and status = 'confirmed';
  if v_booked >= v_slot.capacity then
    raise exception 'slot_full';
  end if;

  if exists (select 1 from public.bookings
              where slot_id = p_slot_id and status = 'confirmed'
                and lower(email) = lower(trim(p_email))
                and lower(child_name) = lower(trim(p_child_name))) then
    raise exception 'invalid_input: duplicate';
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.bookings where code = v_code);
  end loop;

  insert into public.bookings (
    slot_id, code, parent_name, email, phone, child_name,
    grade_level, focus_area, message, privacy_accepted_at
  ) values (
    p_slot_id, v_code, trim(p_parent_name), lower(trim(p_email)), trim(coalesce(p_phone, '')),
    trim(p_child_name), coalesce(p_grade_level, ''), coalesce(p_focus_area, ''),
    trim(coalesce(p_message, '')), now()
  );

  return v_code;
end;
$$;

-- ---------------------------------------------------------------------
-- Öffentliche Funktionen: eigene Buchung ansehen / stornieren
-- (Buchungscode + E-Mail müssen zusammenpassen)
-- ---------------------------------------------------------------------
create or replace function public.lookup_booking(p_code text, p_email text)
returns table (code text, child_name text, status text, starts_at timestamptz, duration_minutes int, location text)
language sql stable security definer set search_path = public
as $$
  select b.code, b.child_name, b.status, s.starts_at, s.duration_minutes, s.location
  from public.bookings b join public.slots s on s.id = b.slot_id
  where b.code = upper(trim(p_code)) and b.email = lower(trim(p_email));
$$;

create or replace function public.cancel_booking(p_code text, p_email text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_starts timestamptz;
begin
  select b.id, s.starts_at into v_id, v_starts
  from public.bookings b join public.slots s on s.id = b.slot_id
  where b.code = upper(trim(p_code)) and b.email = lower(trim(p_email))
    and b.status = 'confirmed';
  if not found then
    raise exception 'booking_not_found';
  end if;
  -- Stornofrist: muss zu AppConfig.cancellationHours in der App passen
  if v_starts - now() < interval '24 hours' then
    raise exception 'too_late_to_cancel';
  end if;
  update public.bookings set status = 'cancelled', cancelled_at = now() where id = v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Rechte: anonyme Nutzer dürfen NUR diese Funktionen ausführen
-- ---------------------------------------------------------------------
revoke all on public.slots, public.bookings, public.admins from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_open_slots() to anon, authenticated;
grant execute on function public.book_slot(uuid, text, text, text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.lookup_booking(text, text) to anon, authenticated;
grant execute on function public.cancel_booking(text, text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- NACH dem Anlegen deines Trainer-Logins (Authentication > Users > Add user)
-- die User-ID hier eintragen und diese Zeile ausführen:
-- insert into public.admins (user_id) values ('DEINE-USER-ID');
-- ---------------------------------------------------------------------
