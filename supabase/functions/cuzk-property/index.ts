/**
 * cuzk-property — proxy pro ČÚZK WSDP SOAP API
 *
 * Přijímá: POST { ku_code: string, lv: string }
 * Vrací:   CuzkPropertyResult (viz src/features/properties/cuzk.ts)
 *
 * Env vars (Supabase Secrets nebo .env.local):
 *   CUZK_USERNAME  – přihlašovací jméno do ČÚZK WSDP
 *   CUZK_PASSWORD  – heslo do ČÚZK WSDP
 *
 * STAV (fáze 1): Skutečné WSDP volání NENÍ implementováno.
 *   Ověřili jsme veřejné WSDL (https://wsdptrial.cuzk.gov.cz/.../vyhledat_v29.wsdl)
 *   a operace, které jsme původně použili (GetListVlastnictviByKuKod, elementy
 *   katuzeKod/lvCislo) v reálném API neexistují — byly odhadnuté a nefunkční.
 *   Skutečné WSDP operace (najdiParcelu, najdiOS, …) vyžadují placený účet
 *   a plnou WSDL/XSD dokumentaci k ověření přesné struktury request/response.
 *
 * TODO(fáze 2): Implementovat skutečné SOAP volání, jakmile budou k dispozici
 *   reálné přístupové údaje a kompletní dokumentace WSDP (ne trial WSDL).
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const username = Deno.env.get('CUZK_USERNAME')
    const password = Deno.env.get('CUZK_PASSWORD')

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'ČÚZK credentials not configured' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as { ku_code?: string; lv?: string }
    if (!body.ku_code || !body.lv) {
      return new Response(JSON.stringify({ error: 'ku_code and lv are required' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({ error: 'ČÚZK WSDP integrace zatím není implementována (plánováno na Fázi 2).' }),
      { status: 501, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
