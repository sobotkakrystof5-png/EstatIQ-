-- ─────────────────────────────────────────────────────────────────────────────
-- Subscription enforcement — step 3.5
--
-- What this migration adds:
--   1. keep subscriptions.unit_count in sync (trigger on properties)
--   2. RLS WITH CHECK on properties INSERT — DB-level limit guard
--   3. RLS policy: block write ops when subscription is not active
--   4. public.get_subscription_usage() — safe helper for the frontend upgrade CTA
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Keep unit_count in sync ────────────────────────────────────────────────
--
-- Fires after INSERT / UPDATE(archived_at) / DELETE on properties.
-- Uses a single recalculate approach (idempotent, safe against race conditions).

create or replace function public.sync_subscription_unit_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner_id uuid;
begin
  -- Determine which owner's count to refresh
  v_owner_id := coalesce(new.owner_id, old.owner_id);

  update public.subscriptions
  set unit_count = (
    select count(*)
    from public.properties
    where owner_id = v_owner_id
      and archived_at is null
  )
  where user_id = v_owner_id;

  return coalesce(new, old);
end;
$$;

-- Drop old trigger if it exists from a previous attempt, then recreate
drop trigger if exists sync_unit_count_on_properties on public.properties;

create trigger sync_unit_count_on_properties
  after insert or delete or update of archived_at
  on public.properties
  for each row execute function public.sync_subscription_unit_count();


-- ── 2. RLS WITH CHECK — enforce unit_limit on INSERT ─────────────────────────
--
-- The BEFORE INSERT trigger (check_property_unit_limit) already raises an
-- exception, but RLS WITH CHECK adds a second, independent guard that fires
-- even if the trigger is somehow bypassed (e.g. service-role inserts that
-- skip triggers in some Postgres versions, or future trigger removal).
--
-- Logic: allow INSERT only when active property count is strictly below limit.

drop policy if exists "Vlastník vytváří nemovitost" on public.properties;

create policy "Vlastník vytváří nemovitost"
  on public.properties for insert
  with check (
    owner_id = auth.uid()
    and (
      select coalesce(
        (
          select count(*)
          from public.properties
          where owner_id = auth.uid()
            and archived_at is null
        ) < s.unit_limit,
        false
      )
      from public.subscriptions s
      where s.user_id = auth.uid()
      order by s.created_at desc
      limit 1
    )
  );


-- ── 3. Block writes when subscription is not active ──────────────────────────
--
-- past_due / canceled / paused → read-only mode.
-- Super-admin / service_role bypass naturally (they don't go through RLS).

create or replace function public.subscription_is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = auth.uid()
      and status in ('active', 'trialing')
    limit 1
  );
$$;

-- Properties UPDATE (edit details, archive/unarchive)
drop policy if exists "Vlastník a správce upravují nemovitost" on public.properties;

create policy "Vlastník a správce upravují nemovitost"
  on public.properties for update
  using (
    owner_id = auth.uid()
    or organization_id in (select public.my_organization_ids())
  )
  with check (
    (
      owner_id = auth.uid()
      or organization_id in (select public.my_organization_ids())
    )
    and public.subscription_is_active()
  );

-- Properties DELETE (soft-delete is UPDATE archived_at, so this covers hard-delete guard)
drop policy if exists "Vlastník maže nemovitost" on public.properties;

create policy "Vlastník maže nemovitost"
  on public.properties for delete
  using (
    owner_id = auth.uid()
    and public.subscription_is_active()
  );


-- ── 4. Frontend usage helper ─────────────────────────────────────────────────
--
-- Returns {unit_count, unit_limit, tier, status} for the current user's
-- subscription. The UI uses this to render the upgrade CTA and progress bar.
-- Returns a single row; if no subscription exists, returns safe defaults.

create or replace function public.get_subscription_usage()
returns table (
  unit_count  integer,
  unit_limit  integer,
  tier        subscription_tier,
  status      subscription_status
) language sql stable security definer set search_path = public as $$
  select
    s.unit_count,
    s.unit_limit,
    s.tier,
    s.status
  from public.subscriptions s
  where s.user_id = auth.uid()
  order by s.created_at desc
  limit 1;
$$;

-- Grant execute to authenticated users
grant execute on function public.get_subscription_usage() to authenticated;
grant execute on function public.subscription_is_active() to authenticated;
