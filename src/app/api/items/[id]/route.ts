import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`*, photos:item_photos(*), storage_location:locations!storage_location_id(*), current_location:locations!current_location_id(*)`)
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()
  delete body.id
  delete body.created_at
  delete body.photos
  delete body.storage_location
  delete body.current_location

  const { data, error } = await supabase.from('inventory_items').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('activity_log').insert({
    facility_id: data.facility_id,
    action: `Updated ${data.item_type}: ${data.name}`,
    entity_type: 'inventory_item',
    entity_id: id,
  })

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Delete photos from storage first
  const { data: photos } = await supabase.from('item_photos').select('storage_path').eq('item_id', id)
  if (photos?.length) {
    await supabase.storage.from('item-photos').remove(photos.map(p => p.storage_path))
  }

  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
