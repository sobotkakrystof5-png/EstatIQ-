-- Fix: INSERT ... RETURNING selhávalo na RLS, protože SELECT policy používala
-- self-referenční subquery (my_property_ids() čte z properties se snaphotem
-- před insertem → nový řádek tam ještě není → RETURNING policy vrátila false).
--
-- Řešení: SELECT policy přepsána tak, aby přímo porovnávala sloupce
-- bez zpětného čtení z tabulky properties.

drop policy if exists "Vlastník a správce vidí nemovitost" on public.properties;

-- Použití security definer funkce my_organization_ids() zabraňuje rekurzi:
-- přímý SELECT z organization_members by spustil jejich RLS (která čte sebe sama).
create policy "Vlastník a správce vidí nemovitost"
  on public.properties for select
  using (
    owner_id = auth.uid()
    or organization_id in (select public.my_organization_ids())
  );
