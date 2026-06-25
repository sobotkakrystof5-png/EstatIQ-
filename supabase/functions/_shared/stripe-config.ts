/**
 * Shared Stripe config used by all stripe-* Edge Functions.
 *
 * Unit limits must stay in sync with CLAUDE.md §4 and DB migration
 * 20260613000001_add_growth_tier.sql.
 */

export type Tier = 'free' | 'starter' | 'growth' | 'pro' | 'portfolio'

export const TIER_UNIT_LIMITS: Record<Tier, number> = {
  free: 1,
  starter: 3,
  growth: 7,
  pro: 10,
  portfolio: 30,
}

/** Build Price ID → Tier map from Supabase secrets at runtime. */
export function buildPriceMap(): Record<string, Tier> {
  const pairs: Array<[string | undefined, Tier]> = [
    [Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY'), 'starter'],
    [Deno.env.get('STRIPE_PRICE_STARTER_YEARLY'), 'starter'],
    [Deno.env.get('STRIPE_PRICE_GROWTH_MONTHLY'), 'growth'],
    [Deno.env.get('STRIPE_PRICE_GROWTH_YEARLY'), 'growth'],
    [Deno.env.get('STRIPE_PRICE_PRO_MONTHLY'), 'pro'],
    [Deno.env.get('STRIPE_PRICE_PRO_YEARLY'), 'pro'],
    [Deno.env.get('STRIPE_PRICE_PORTFOLIO_MONTHLY'), 'portfolio'],
    [Deno.env.get('STRIPE_PRICE_PORTFOLIO_YEARLY'), 'portfolio'],
  ]
  const map: Record<string, Tier> = {}
  for (const [priceId, tier] of pairs) {
    if (priceId) map[priceId] = tier
  }
  return map
}

/** Return the correct Price ID for a given tier + billing cycle. */
export function getPriceId(tier: Tier, billingCycle: 'monthly' | 'yearly'): string | null {
  const key = `STRIPE_PRICE_${tier.toUpperCase()}_${billingCycle.toUpperCase()}`
  return Deno.env.get(key) ?? null
}

// Allowed origins loaded from env (comma-separated) or sensible defaults.
// Set ALLOWED_ORIGINS in Supabase secrets for production.
const ALLOWED_ORIGINS: string[] = (
  Deno.env.get('ALLOWED_ORIGINS') ??
  'https://estat-iq.vercel.app,http://localhost:5173,http://localhost:3000'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function resolveOrigin(requestOrigin: string | null): string {
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin
  return ALLOWED_ORIGINS[0]
}

export function json(body: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': resolveOrigin(origin),
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Vary': 'Origin',
    },
  })
}

export function cors(origin: string | null = null): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': resolveOrigin(origin),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Vary': 'Origin',
    },
  })
}
