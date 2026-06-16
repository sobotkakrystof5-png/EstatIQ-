/**
 * payment-scheduler — HTTP wrapper around generate_monthly_payments()
 *
 * Allows manual triggering and external automation via HTTP POST.
 * The same function is called automatically by pg_cron on the 1st of each month.
 *
 * Body (optional JSON): { "year": 2026, "month": 1 }
 * Defaults to the current month in Europe/Prague timezone.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SchedulerBody {
  year?: number
  month?: number
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405)
  }

  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let body: SchedulerBody = {}
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      body = await req.json()
    }
  } catch {
    // empty body is fine — defaults apply inside the DB function
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase.rpc('generate_monthly_payments', {
    p_year:  body.year  ?? null,
    p_month: body.month ?? null,
  })

  if (error) {
    console.error('[payment-scheduler]', error.message)
    return json({ error: error.message }, 500)
  }

  console.log('[payment-scheduler]', JSON.stringify(data))
  return json(data)
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
