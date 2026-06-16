-- Add 'growth' tier (349 Kč, 7 properties) to subscription_tier enum.
-- This fills the gap between starter (3) and pro (15) for landlords with 4–7 units.
alter type subscription_tier add value if not exists 'growth' after 'starter';
