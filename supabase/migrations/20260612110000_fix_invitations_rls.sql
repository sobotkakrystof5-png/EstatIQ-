-- Oprava RLS pro tabulku invitations:
--
-- Původní SELECT policy "Kdokoli může číst pending pozvánku dle tokenu" je funkční pro
-- anonymní uživatele, ale jen pokud má role anon právo SELECT.
-- UPDATE pozvánky (přijetí) probíhá nyní výhradně v Edge Function se service role —
-- klientské RLS update policies jsou pro tento případ zbytečné, ale necháváme je pro
-- případ manuálního revokování pronajímatelem.
--
-- Explicitně povolíme anon SELECT, aby fetchInvite() z nepřihlášeného prohlížeče fungovalo.

grant select on public.invitations to anon;

-- Stávající policy "Kdokoli může číst pending pozvánku dle tokenu" povoluje SELECT
-- pro libovolnou roli (including anon), ale Postgres prochází políticas jen pokud
-- je role vůbec v ACL tabulky. Grant výše to zajišťuje.
--
-- Nic dalšího není potřeba — UPDATE nyní obstarává Edge Function se service role,
-- která RLS obchází přímo. Žádná nová UPDATE policy pro anon není přidávána,
-- protože by to otevřelo bezpečnostní riziko (anon by mohl měnit libovolné pending
-- pozvánky, pokud by znal id).
