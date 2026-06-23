import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const [row] = await sql`
      SELECT COUNT(*)::int AS count FROM waitlist_subscribers
    ` as [{ count: number }]

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    return res.status(200).json({ count: row.count })
  } catch (err) {
    console.error('waitlist-count error:', err)
    return res.status(500).json({ count: 0 })
  }
}
