/**
 * stripe-checkout — vytvoří Stripe Checkout Session a vrátí redirect URL.
 *
 * POST /functions/v1/stripe-checkout
 * Headers: Authorization: Bearer <supabase-jwt>
 * Body: { tier: 'starter' | 'growth' | 'pro' | 'portfolio', billing_cycle: 'monthly' | 'yearly' }
 * Response: { url: string }
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cors, json, getPriceId, type Tier } from '../_shared/stripe-config.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const APP_URL = Deno.env.get('APP_URL') ?? 'https://estatiq.app'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const supabaseAnon = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!)
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )
  if (authError || !user) return json({ error: 'Unauthorized' }, 401)

  // ── Parse body ────────────────────────────────────────────────────────────
  let tier: Tier
  let billingCycle: 'monthly' | 'yearly'
  try {
    const body = await req.json()
    tier = body.tier
    billingCycle = body.billing_cycle ?? 'monthly'
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const priceId = getPriceId(tier, billingCycle)
  if (!priceId) {
    return json({ error: `Price ID for ${tier}/${billingCycle} not configured` }, 500)
  }

  // ── Get or create Stripe customer ─────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let customerId: string | undefined = sub?.stripe_customer_id ?? undefined

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    })
    customerId = customer.id

    // Persist early so portal can find it before webhook fires
    await supabase
      .from('subscriptions')
      .update({ stripe_customer_id: customer.id })
      .eq('user_id', user.id)
  }

  // ── Create Checkout Session ───────────────────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard?stripe=success`,
    cancel_url: `${APP_URL}/settings?stripe=cancel`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { user_id: user.id },
    },
    metadata: { user_id: user.id, tier, billing_cycle: billingCycle },
  })

  return json({ url: session.url })
})
