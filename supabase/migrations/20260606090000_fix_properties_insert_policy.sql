-- Fix: INSERT policy na `properties` reálně nasazená v DB neodpovídala
-- zamýšlenému `with check (owner_id = auth.uid())` z migrace
-- 20260603175937_properties.sql → každý insert padal na RLS (SQLSTATE 42501),
-- i když vkládaný owner_id == auth.uid().
--
-- Tato migrace je idempotentní: odstraní JAKOUKOLI stávající INSERT policy
-- na public.properties (ať se jmenuje jakkoli) a znovu ji vytvoří správně.

do $$
declare r record;
begin
  for r in
    select polname
    from pg_policy
    where polrelid = 'public.properties'::regclass
      and polcmd = 'a'  -- 'a' = INSERT
  loop
    execute format('drop policy %I on public.properties', r.polname);
  end loop;
end $$;

create policy "Vlastník vytváří nemovitost"
  on public.properties for insert
  with check (owner_id = auth.uid());
