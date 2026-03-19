import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const direction = searchParams.get('direction') // 'in' | 'out' | 'all'
  const facilityId = searchParams.get('facility_id')
  const status = searchParams.get('status')

  let query = supabase.from('loan_requests').select(`
    *,
    item:inventory_items(id, tag_id, name, item_type, status, colors),
    from_facility:facilities!from_facility_id(id, name, type),
    to_facility:facilities!to_facility_id(id, name, type)
  `).order('created_at', { ascending: false })

  if (facilityId) {
    if (direction === 'in') query = query.eq('to_facility_id', facilityId)
    else if (direction === 'out') query = query.eq('from_facility_id', facilityId)
    else query = query.or(`from_facility_id.eq.${facilityId},to_facility_id.eq.${facilityId}`)
  }
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase.from('loan_requests').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
