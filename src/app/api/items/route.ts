import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const search = searchParams.get('search')
  const status = searchParams.get('status')
  const facilityId = searchParams.get('facility_id')

  let query = supabase
    .from('inventory_items')
    .select(`*, photos:item_photos(*), storage_location:locations!storage_location_id(*), current_location:locations!current_location_id(*)`)
    .order('created_at', { ascending: false })

  if (type) query = query.eq('item_type', type)
  if (status) query = query.eq('status', status)
  if (facilityId) query = query.eq('facility_id', facilityId)
  if (search) query = query.or(`name.ilike.%${search}%,tag_id.ilike.%${search}%,color.ilike.%${search}%,description.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  // Get user's facility_id if not provided
  if (!body.facility_id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('user_profiles').select('facility_id').eq('id', user.id).single()
    body.facility_id = profile?.facility_id
  }

  const { data, error } = await supabase.from('inventory_items').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity
  await supabase.from('activity_log').insert({
    facility_id: body.facility_id,
    action: `Added ${body.item_type}: ${body.name}`,
    entity_type: 'inventory_item',
    entity_id: data.id,
  })

  return NextResponse.json(data, { status: 201 })
}
