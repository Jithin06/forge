-- Forge database schema (SPEC.md section 5.2 and 5.3).
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Access model: row-level security is ON for every table and there are NO
-- policies, and the anon/authenticated roles have no table or function
-- privileges. Only the server, using the service role key, reads or writes.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- spaces
create table if not exists public.spaces (
  id          text primary key,
  doc         jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- --------------------------------------------------------- staff_members
create table if not exists public.staff_members (
  email     text not null,
  space_id  text not null references public.spaces(id) on delete cascade,
  primary key (email, space_id)
);

-- -------------------------------------------------------------- profiles
create table if not exists public.profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  audience      text check (audience in
                  ('viterbi_undergrad','viterbi_grad','usc_undergrad_other','usc_grad_other')),
  experience    text check (experience in ('never','basic_tools','workshop'))
);

-- ----------------------------------------------------------------- plans
create table if not exists public.plans (
  id             text primary key,               -- short random string, made in code
  created_at     timestamptz not null default now(),
  user_id        uuid references auth.users(id) on delete set null,
  idea_text      text not null,
  answers        jsonb not null default '{}'::jsonb,
  audience       text not null,
  experience     text not null,
  had_image      boolean not null default false,
  plan           jsonb not null,
  space_ids      text[] not null default '{}',
  cost_low_usd   numeric,
  cost_high_usd  numeric,
  input_tokens   integer not null default 0,
  output_tokens  integer not null default 0
);
create index if not exists plans_user_idx on public.plans(user_id);

-- ----------------------------------------------------------- scrap_items
create table if not exists public.scrap_items (
  id                 uuid primary key default gen_random_uuid(),
  space_id           text not null references public.spaces(id) on delete cascade,
  material_category  text not null,
  title              text not null,
  description        text not null default '',
  size_note          text,
  condition          text not null check (condition in ('good','usable','rough')),
  restrictions       text[] not null default '{}',
  photo_url          text,
  status             text not null default 'available'
                       check (status in ('available','reserved','picked_up','removed')),
  posted_by          text not null,
  posted_at          timestamptz not null default now(),
  expires_at         timestamptz not null default now() + interval '30 days',
  -- Rule 3: unknown plastic always carries the heat restriction.
  constraint unknown_plastic_restricted check (
    material_category <> 'unknown_plastic'
    or 'Not for laser cutting or heating' = any(restrictions)
  )
);
create index if not exists scrap_items_space_status_idx on public.scrap_items(space_id, status);
create index if not exists scrap_items_category_status_idx on public.scrap_items(material_category, status);

-- ---------------------------------------------------------- scrap_claims
create table if not exists public.scrap_claims (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.scrap_items(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  plan_id     text references public.plans(id) on delete set null,
  created_at  timestamptz not null default now(),
  hold_until  timestamptz not null default now() + interval '48 hours',
  status      text not null default 'active'
                check (status in ('active','picked_up','expired','cancelled'))
);
-- One active claim per item, enforced by the database as a backstop.
create unique index if not exists scrap_claims_one_active_per_item
  on public.scrap_claims(item_id) where status = 'active';
create index if not exists scrap_claims_user_status_idx on public.scrap_claims(user_id, status);

-- ------------------------------------------------- row-level security
alter table public.spaces        enable row level security;
alter table public.staff_members enable row level security;
alter table public.profiles      enable row level security;
alter table public.plans         enable row level security;
alter table public.scrap_items   enable row level security;
alter table public.scrap_claims  enable row level security;

-- No policies are created on purpose. Also remove the default grants so the
-- public key gets "permission denied" rather than an empty list.
revoke all on table
  public.spaces, public.staff_members, public.profiles,
  public.plans, public.scrap_items, public.scrap_claims
  from anon, authenticated;
grant all on table
  public.spaces, public.staff_members, public.profiles,
  public.plans, public.scrap_items, public.scrap_claims
  to service_role;

-- -------------------------------------------- expire holds (rule 5.3.2)
-- Called on read by the server. Returns items whose hold lapsed to available.
create or replace function public.expire_holds(p_item uuid default null)
returns void
language sql
set search_path = public
as $$
  with expired as (
    update public.scrap_claims
       set status = 'expired'
     where status = 'active'
       and hold_until < now()
       and (p_item is null or item_id = p_item)
    returning item_id
  )
  update public.scrap_items i
     set status = 'available'
   where i.status = 'reserved'
     and i.id in (select item_id from expired);
$$;

-- --------------------------------------------- atomic claim (rule 5.3.1)
-- Raises ALREADY_CLAIMED or TOO_MANY_CLAIMS; the server maps them to 409.
create or replace function public.claim_scrap(
  p_item_id uuid,
  p_user_id uuid,
  p_plan_id text default null
)
returns public.scrap_claims
language plpgsql
set search_path = public
as $$
declare
  v_claim public.scrap_claims;
  v_active int;
begin
  -- Serialise claims by the same user so the 3-claim limit cannot be raced.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  perform public.expire_holds(p_item_id);
  update public.scrap_claims
     set status = 'expired'
   where user_id = p_user_id and status = 'active' and hold_until < now();

  select count(*) into v_active
    from public.scrap_claims
   where user_id = p_user_id and status = 'active';
  if v_active >= 3 then
    raise exception 'TOO_MANY_CLAIMS' using errcode = 'P0001';
  end if;

  -- Flip available -> reserved only if still available. The row lock taken
  -- by UPDATE makes concurrent claimers wait, then see 'reserved' and fail.
  update public.scrap_items
     set status = 'reserved'
   where id = p_item_id
     and status = 'available'
     and expires_at > now();
  if not found then
    raise exception 'ALREADY_CLAIMED' using errcode = 'P0001';
  end if;

  insert into public.scrap_claims (item_id, user_id, plan_id)
  values (p_item_id, p_user_id, p_plan_id)
  returning * into v_claim;

  return v_claim;
end;
$$;

revoke all on function public.expire_holds(uuid) from public, anon, authenticated;
revoke all on function public.claim_scrap(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.expire_holds(uuid) to service_role;
grant execute on function public.claim_scrap(uuid, uuid, text) to service_role;

-- ------------------------------------------------ impact counter (5.3.6)
create or replace view public.impact as
  select count(*)::int as items_picked_up
    from public.scrap_items
   where status = 'picked_up';
alter view public.impact set (security_invoker = true);
revoke all on public.impact from anon, authenticated;
grant select on public.impact to service_role;

-- ------------------------------------------------------ storage bucket
-- Public read so photo URLs work in <img>. No storage policies are added, so
-- only the service role (staff routes on the server) can upload.
insert into storage.buckets (id, name, public)
values ('scrap-photos', 'scrap-photos', true)
on conflict (id) do nothing;
