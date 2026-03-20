import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const facilityId = new URL(req.url).searchParams.get('facility_id')
  if (!facilityId) return NextResponse.json({ error: 'facility_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('dropdown_lists')
    .select('*')
    .eq('facility_id', facilityId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Convert array of rows to a keyed object for easy client use
  const result: Record<string, string[]> = {}
  data?.forEach(row => { result[row.list_key] = row.values })
  return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { facility_id, list_key, values } = await req.json()
  if (!facility_id || !list_key) return NextResponse.json({ error: 'facility_id and list_key required' }, { status: 400 })

  const { data, error } = await supabase
    .from('dropdown_lists')
    .upsert({ facility_id, list_key, values, updated_at: new Date().toISOString() }, { onConflict: 'facility_id,list_key' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
