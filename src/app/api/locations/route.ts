import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const facilityId = new URL(req.url).searchParams.get('facility_id')

  let query = supabase.from('locations').select('*').order('sort_order').order('name')
  if (facilityId) query = query.eq('facility_id', facilityId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  if (!body.facility_id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('user_profiles').select('facility_id').eq('id', user.id).single()
    body.facility_id = profile?.facility_id
  }

  const { data, error } = await supabase.from('locations').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await supabase.from('locations').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { id } = await req.json()

  // Check no items assigned
  const { count: itemCount } = await supabase.from('inventory_items').select('*', { count: 'exact', head: true })
    .or(`storage_location_id.eq.${id},current_location_id.eq.${id}`)
  if ((itemCount || 0) > 0) return NextResponse.json({ error: 'Cannot delete: items are assigned to this location' }, { status: 400 })

  // Check no children
  const { count: childCount } = await supabase.from('locations').select('*', { count: 'exact', head: true }).eq('parent_id', id)
  if ((childCount || 0) > 0) return NextResponse.json({ error: 'Cannot delete: location has sub-locations' }, { status: 400 })

  const { error } = await supabase.from('locations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
