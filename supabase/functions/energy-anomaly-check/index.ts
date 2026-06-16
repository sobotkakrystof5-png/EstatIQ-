/**
 * energy-anomaly-check — DB webhook handler for INSERT into energy_readings
 *
 * Payload (sent by tr_energy_anomaly_webhook Postgres trigger via pg_net):
 *   { type: 'INSERT', table: 'energy_readings', schema: 'public',
 *     record: { id, property_id, type, consumption, period_year, period_month, … },
 *     old_record: null }
 *
 * Flow:
 *   1. Validate Bearer token (service_role_key)
 *   2. Skip if consumption is null
 *   3. Call check_energy_anomaly() — returns (is_anomaly, anomaly_percent, avg_consumption)
 *   4. If anomaly → INSERT notification for the property owner
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface WebhookPayload {
  type:       'INSERT' | 'UPDATE' | 'DELETE'
  table:      string
  schema:     string
  record:     EnergyReadingRecord
  old_record: null
}

interface EnergyReadingRecord {
  id:           string
  property_id:  string
  type:         string
  consumption:  number | null
  period_year:  number
  period_month: number
  [key: string]: unknown
}

interface AnomalyResult {
  is_anomaly:      boolean
  anomaly_percent: number
  avg_consumption: number
}

const ENERGY_LABELS: Record<string, string> = {
  elektrina:    'Elektřina',
  plyn:         'Plyn',
  voda_studena: 'Studená voda',
  voda_tepla:   'Teplá voda',
  teplo:        'Teplo',
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405)
  }

  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  if (payload.type !== 'INSERT' || !payload.record) {
    return json({ skipped: 'not an INSERT' })
  }

  const r = payload.record

  if (r.consumption === null || r.consumption === undefined) {
    return json({ skipped: 'consumption is null' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { data: anomalyRows, error: anomalyErr } = await supabase
    .rpc('check_energy_anomaly', {
      p_property_id: r.property_id,
      p_type:        r.type,
      p_consumption: r.consumption,
      p_year:        r.period_year,
      p_month:       r.period_month,
    })

  if (anomalyErr) {
    console.error('[energy-anomaly-check] rpc error', anomalyErr.message)
    return json({ error: anomalyErr.message }, 500)
  }

  const result = (anomalyRows as AnomalyResult[])?.[0]
  if (!result?.is_anomaly) {
    return json({ anomaly: false, avg_consumption: result?.avg_consumption ?? null })
  }

  const { data: property, error: propErr } = await supabase
    .from('properties')
    .select('name, owner_id')
    .eq('id', r.property_id)
    .single()

  if (propErr || !property) {
    console.error('[energy-anomaly-check] property fetch error', propErr?.message)
    return json({ error: 'property not found' }, 500)
  }

  const typeLabel = ENERGY_LABELS[r.type] ?? r.type
  const pct       = result.anomaly_percent

  const { error: notifErr } = await supabase
    .from('notifications')
    .insert({
      user_id:   property.owner_id,
      type:      'energy_anomaly',
      channel:   'in_app',
      title:     'Neobvyklá spotřeba energií',
      body:      `${typeLabel} na ${property.name} je o ${pct} % vyšší než průměr posledních 12 měsíců.`,
      ref_table: 'energy_readings',
      ref_id:    r.id,
      metadata:  { reading_id: r.id, anomaly_percent: pct },
    })

  if (notifErr) {
    console.error('[energy-anomaly-check] notification insert error', notifErr.message)
    return json({ error: notifErr.message }, 500)
  }

  console.log(`[energy-anomaly-check] anomaly: ${typeLabel} @ ${property.name} +${pct}%`)
  return json({ anomaly: true, anomaly_percent: pct, property: property.name })
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
