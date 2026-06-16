-- Storage bucket for energy meter reading photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'energy-photos',
  'energy-photos',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;

-- Authenticated users can upload their own photos
create policy "energy_photos_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'energy-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read (public bucket — QR/link sharing friendly)
create policy "energy_photos_select"
  on storage.objects for select
  to public
  using (bucket_id = 'energy-photos');

-- Owner can delete their own photos
create policy "energy_photos_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'energy-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
