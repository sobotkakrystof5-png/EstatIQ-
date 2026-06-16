/**
 * stripe-webhook — přijímá Stripe webhook události a synchronizuje
 * stav předplatného do tabulky public.subscriptions.
 *
 * Registruj v Stripe Dashboard → Webhooks → Add endpoint:
 *   URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 *   Events:
 *     - checkout.session.completed
 *     - customer.subscription.created
 *     - customer.subscription.updated
 *     - customer.subscription.deleted
 */

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildPriceMap, TIER_UNIT_LIMITS, type Tier } from '../_shared/stripe-config.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

function ok(msg = 'ok'): Response {
  return new Response(JSON.stringify({ received: true, msg }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function err(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return err('Method Not Allowed', 405)

  // ── Verify Stripe signature ───────────────────────────────────────────────
  const sig = req.headers.get('stripe-signature')
  if (!sig) return err('Missing stripe-signature', 400)

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET)
  } catch (e) {
    return err(`Webhook signature verification failed: ${(e as Error).message}`, 400)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const priceMap = buildPriceMap()

  // ── Handle events ─────────────────────────────────────────────────────────
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const userId = session.metadata?.user_id
      if (!userId) return err('Missing user_id in metadata')

      const stripeSubId = session.subscription as string
      const customerId = session.customer as string

      // Fetch full subscription from Stripe to get price + period
      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId)
      const priceId = stripeSub.items.data[0]?.price.id
      const tier = (priceMap[priceId] ?? 'free') as Tier

      await supabase
        .from('subscriptions')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubId,
          tier,
          status: stripeSub.status,
          unit_limit: TIER_UNIT_LIMITS[tier],
          billing_cycle: stripeSub.items.data[0]?.price.recurring?.interval === 'year'
            ? 'yearly'
            : 'monthly',
          current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
          canceled_at: null,
        })
        .eq('user_id', userId)

      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const stripeSub = event.data.object as Stripe.Subscription
      const userId = stripeSub.metadata?.user_id
      if (!userId) break

      const priceId = stripeSub.items.data[0]?.price.id
      const tier = (priceMap[priceId] ?? 'free') as Tier

      await supabase
        .from('subscriptions')
        .update({
          stripe_subscription_id: stripeSub.id,
          tier,
          status: stripeSub.status,
          unit_limit: TIER_UNIT_LIMITS[tier],
          billing_cycle: stripeSub.items.data[0]?.price.recurring?.interval === 'year'
            ? 'yearly'
            : 'monthly',
          current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
          canceled_at: stripeSub.cancel_at
            ? new Date(stripeSub.cancel_at * 1000).toISOString()
            : null,
        })
        .eq('user_id', userId)

      break
    }

    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object as Stripe.Subscription
      const userId = stripeSub.metadata?.user_id
      if (!userId) break

      // Downgrade to free — data zůstávají, jen se sníží limit
      await supabase
        .from('subscriptions')
        .update({
          tier: 'free',
          status: 'canceled',
          unit_limit: 1,
          stripe_subscription_id: null,
          canceled_at: new Date().toISOString(),
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        })
        .eq('user_id', userId)

      break
    }

    default:
      // Ignoruj ostatní události
      break
  }

  return ok()
})
