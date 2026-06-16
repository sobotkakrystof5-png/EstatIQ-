create type payment_status as enum ('pending', 'paid', 'overdue', 'canceled');
create type payment_type   as enum ('rent', 'deposit', 'utilities', 'repair', 'other');
create type tax_deductible as enum ('yes', 'no', 'pausal_30');

create table public.payments (
  id              uuid primary key default uuid_generate_v4(),
  lease_id        uuid not null references public.leases(id) on delete cascade,
  type            payment_type not null default 'rent',
  status          payment_status not null default 'pending',
  amount          numeric(10,2) not null,
  due_date        date not null,
  paid_at         timestamptz,
  paid_amount     numeric(10,2),
  variable_symbol text,
  qr_payload      text,
  reminder_t_minus5_sent_at timestamptz,
  reminder_t_plus7_sent_at  timestamptz,
  reminder_t_plus14_sent_at timestamptz,
  note            text,
  period_year     smallint,
  period_month    smallint check (period_month between 1 and 12),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(lease_id, type, period_year, period_month)
);

create index idx_payments_lease      on public.payments(lease_id);
create index idx_payments_status     on public.payments(status);
create index idx_payments_due_date   on public.payments(due_date);
create index idx_payments_period     on public.payments(period_year, period_month);

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create or replace function public.auto_mark_overdue()
returns trigger language plpgsql as $$
begin
  if new.status = 'pending' and new.due_date < current_date then
    new.status := 'overdue';
  end if;
  return new;
end;
$$;

create trigger payments_auto_overdue
  before insert or update on public.payments
  for each row execute function public.auto_mark_overdue();

create type expense_category as enum (
  'opravy', 'pojistne', 'sluzby', 'sprava',
  'danove_poplatky', 'energie', 'reklama', 'jine'
);

create table public.expenses (
  id              uuid primary key default uuid_generate_v4(),
  property_id     uuid not null references public.properties(id) on delete cascade,
  lease_id        uuid references public.leases(id) on delete set null,
  category        expense_category not null default 'jine',
  description     text not null,
  amount          numeric(10,2) not null,
  tax_deductible  tax_deductible not null default 'yes',
  invoice_number  text,
  supplier        text,
  expense_date    date not null,
  receipt_url     text,
  period_year     smallint,
  period_month    smallint check (period_month between 1 and 12),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_expenses_property on public.expenses(property_id);
create index idx_expenses_date     on public.expenses(expense_date);
create index idx_expenses_period   on public.expenses(period_year, period_month);

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;
alter table public.expenses enable row level security;

create policy "Vlastník vidí platby svých nájmů"
  on public.payments for select
  using (
    lease_id in (
      select l.id from public.leases l
      where l.property_id in (select public.my_property_ids())
    )
  );

create policy "Nájemník vidí vlastní platby"
  on public.payments for select
  using (
    lease_id in (
      select l.id from public.leases l
      join public.tenants t on t.id = l.tenant_id
      where t.user_id = auth.uid()
    )
  );

create policy "Vlastník spravuje platby"
  on public.payments for all
  using (
    lease_id in (
      select l.id from public.leases l
      where l.property_id in (select public.my_property_ids())
    )
  );

create policy "Vlastník vidí výdaje svých nemovitostí"
  on public.expenses for select
  using (property_id in (select public.my_property_ids()));

create policy "Vlastník spravuje výdaje"
  on public.expenses for all
  using (property_id in (select public.my_property_ids()))
  with check (property_id in (select public.my_property_ids()));
