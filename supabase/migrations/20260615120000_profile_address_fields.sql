-- Add address and preference fields to profiles
alter table public.profiles
  add column if not exists country            text default 'CZ',
  add column if not exists city               text,
  add column if not exists street             text,
  add column if not exists house_number       text,
  add column if not exists preferred_currency text not null default 'CZK';

-- Update the signup trigger to capture new fields from user metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, email, full_name, phone,
    country, city, street, house_number, preferred_currency
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'country', 'CZ'),
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'street',
    new.raw_user_meta_data->>'house_number',
    coalesce(new.raw_user_meta_data->>'preferred_currency', 'CZK')
  );
  return new;
end;
$$;
