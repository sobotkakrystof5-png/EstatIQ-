import { supabase } from './supabase'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Not authenticated')
  return token
}

async function callEdgeFunction(path: string, body: Record<string, unknown>): Promise<{ url: string }> {
  const token = await getAuthToken()
  const res = await fetch(`${FUNCTIONS_URL}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Edge Function error ${res.status}`)
  }
  return res.json()
}

/** Redirects to Stripe Checkout for the given tier + billing cycle. */
export async function redirectToCheckout(
  tier: 'starter' | 'growth' | 'pro' | 'portfolio',
  billingCycle: 'monthly' | 'yearly',
): Promise<void> {
  const { url } = await callEdgeFunction('stripe-checkout', { tier, billing_cycle: billingCycle })
  window.location.href = url
}

/** Redirects to Stripe Customer Portal (manage / cancel subscription). */
export async function redirectToPortal(): Promise<void> {
  const { url } = await callEdgeFunction('stripe-portal', {})
  window.location.href = url
}
