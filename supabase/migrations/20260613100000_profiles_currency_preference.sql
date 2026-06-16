-- Add currency_preference to profiles
-- Stores user's preferred display currency ('CZK' | 'EUR' | 'USD' | 'GBP' | 'PLN')

alter table public.profiles
  add column if not exists currency_preference text not null default 'CZK';
