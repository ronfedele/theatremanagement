import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const itemId = new URL(req.url).searchParams.get('item_id')
  if (!itemId) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('item_photos')
    .select('*')
    .eq('item_id', itemId)
    .order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const formData = await req.formData()
  const file = formData.get('file') as File
  const itemId = formData.get('item_id') as string
  const facilityId = formData.get('facility_id') as string
  const label = formData.get('label') as string || ''
  const isPrimary = formData.get('is_primary') === 'true'

  if (!file || !itemId || !facilityId) {
    return NextResponse.json({ error: 'file, item_id and facility_id are required' }, { status: 400 })
  }

  // Check photo count limit
  const { count } = await supabase.from('item_photos').select('*', { count: 'exact', head: true }).eq('item_id', itemId)
  if ((count || 0) >= 6) return NextResponse.json({ error: 'Maximum 6 photos per item' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `${facilityId}/${itemId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('item-photos').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('item-photos').getPublicUrl(path)

  // If setting as primary, unset others
  if (isPrimary) {
    await supabase.from('item_photos').update({ is_primary: false }).eq('item_id', itemId)
  }

  const { data: photo, error } = await supabase.from('item_photos').insert({
    item_id: itemId,
    facility_id: facilityId,
    storage_path: path,
    public_url: publicUrl,
    label,
    is_primary: isPrimary || (count === 0), // first photo is auto-primary
    sort_order: count || 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(photo, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { id, storage_path } = await req.json()

  await supabase.storage.from('item-photos').remove([storage_path])
  const { error } = await supabase.from('item_photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  // Set a photo as primary
  const supabase = await createClient()
  const { id, item_id } = await req.json()
  await supabase.from('item_photos').update({ is_primary: false }).eq('item_id', item_id)
  const { error } = await supabase.from('item_photos').update({ is_primary: true }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
