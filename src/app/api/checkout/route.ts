import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const facilityId = searchParams.get('facility_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('checkout_records')
    .select('*, item:inventory_items(id, tag_id, name, item_type, color)')
    .order('out_date', { ascending: false })

  if (facilityId) query = query.eq('facility_id', facilityId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  // Mark item as checked out
  await supabase.from('inventory_items').update({ status: 'Checked Out' }).eq('id', body.item_id)

  const { data, error } = await supabase.from('checkout_records').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_log').insert({
    facility_id: body.facility_id,
    action: `Checked out to ${body.person_name}`,
    entity_type: 'checkout',
    entity_id: data.id,
  })

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  // Return an item
  const supabase = await createClient()
  const { id, item_id } = await req.json()

  const { data, error } = await supabase.from('checkout_records').update({
    status: 'Returned',
    return_date: new Date().toISOString().split('T')[0],
  }).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark item available again
  await supabase.from('inventory_items').update({ status: 'Available' }).eq('id', item_id)

  return NextResponse.json(data)
}
