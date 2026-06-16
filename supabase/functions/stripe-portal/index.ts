/**
 * stripe-portal — vytvoří Stripe Customer Portal session a vrátí redirect URL.
 * Uživatel zde může upgradovat, downgradovat nebo zrušit předplatné.
 *
 * POST /functions/v1/stripe-portal
 * Headers: Authorization: Bearer <supabase-jwt>
 * Response: { url: string }
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cors, json } from '../_shared/stripe-config.ts'

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

  // ── Lookup Stripe customer ────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const customerId = sub?.stripe_customer_id
  if (!customerId) {
    return json({ error: 'No Stripe customer found. Complete a checkout first.' }, 400)
  }

  // ── Create Portal Session ─────────────────────────────────────────────────
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/settings`,
  })

  return json({ url: session.url })
})
