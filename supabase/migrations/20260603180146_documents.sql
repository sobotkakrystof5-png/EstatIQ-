create type document_category as enum (
  'najemni_smlouva',
  'predavaci_protokol',
  'pojistka',
  'faktura',
  'korespondence',
  'revize',
  'jine'
);

create table public.documents (
  id              uuid primary key default uuid_generate_v4(),
  property_id     uuid references public.properties(id) on delete cascade,
  lease_id        uuid references public.leases(id) on delete set null,
  uploaded_by     uuid not null references public.profiles(id),
  category        document_category not null default 'jine',
  name            text not null,
  file_url        text not null,
  file_size       bigint,
  mime_type       text,
  expires_at      date,
  alert_60_sent_at  timestamptz,
  alert_30_sent_at  timestamptz,
  alert_14_sent_at  timestamptz,
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_documents_property   on public.documents(property_id);
create index idx_documents_lease      on public.documents(lease_id);
create index idx_documents_category   on public.documents(category);
create index idx_documents_expires    on public.documents(expires_at) where expires_at is not null;

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

create policy "Vlastník vidí dokumenty svých nemovitostí"
  on public.documents for select
  using (
    property_id in (select public.my_property_ids())
    or uploaded_by = auth.uid()
  );

create policy "Nájemník vidí dokumenty svého nájmu"
  on public.documents for select
  using (
    lease_id in (
      select l.id from public.leases l
      join public.tenants t on t.id = l.tenant_id
      where t.user_id = auth.uid()
    )
  );

create policy "Vlastník nahrává a maže dokumenty"
  on public.documents for all
  using (
    property_id in (select public.my_property_ids())
    or uploaded_by = auth.uid()
  )
  with check (uploaded_by = auth.uid());
