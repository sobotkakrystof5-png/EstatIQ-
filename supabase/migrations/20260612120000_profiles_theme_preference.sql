-- Add theme_preference to profiles
-- Stores user's preferred theme ('light' | 'dark' | 'system')

alter table public.profiles
  add column if not exists theme_preference text not null default 'system';
