-- Allow authenticated users to create their own in-app notifications.
-- Needed for client-side energy anomaly detection (Fáze 1).
-- TODO(fáze 2): move anomaly notification creation to Edge Function (service role) and remove this policy.
create policy "Uživatel vytváří vlastní notifikace"
  on public.notifications for insert
  with check (user_id = auth.uid());
