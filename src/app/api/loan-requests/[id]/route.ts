import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('loan_requests')
    .select(`*, item:inventory_items(*), from_facility:facilities!from_facility_id(*), to_facility:facilities!to_facility_id(*)`)
    .eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()
  const { action, approved_by, notes } = body

  // Get the loan request
  const { data: lr, error: lrErr } = await supabase.from('loan_requests').select('*, item:inventory_items(id, name, facility_id)').eq('id', id).single()
  if (lrErr) return NextResponse.json({ error: lrErr.message }, { status: 404 })

  let updates: Record<string, unknown> = {}
  let itemStatusUpdate: string | null = null

  switch (action) {
    case 'approve':
      updates = { status: 'Approved', approved_by, notes: notes || lr.notes }
      break
    case 'decline':
      updates = { status: 'Declined', notes: notes || lr.notes }
      break
    case 'checkout':
      updates = { status: 'Checked-Out', checkout_date: new Date().toISOString().split('T')[0] }
      itemStatusUpdate = 'On Loan'
      break
    case 'checkin':
      updates = { status: 'Returned', checkin_date: new Date().toISOString().split('T')[0] }
      itemStatusUpdate = 'Available'
      break
    case 'cancel':
      updates = { status: 'Declined', notes: 'Cancelled by requester' }
      break
    default:
      // Direct field update
      updates = body
      delete updates.action
  }

  const { data, error } = await supabase.from('loan_requests').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update item status if needed
  if (itemStatusUpdate && lr.item) {
    await supabase.from('inventory_items').update({ status: itemStatusUpdate }).eq('id', (lr.item as any).id)
  }

  // Log
  await supabase.from('activity_log').insert({
    facility_id: (lr.item as any)?.facility_id,
    action: `Loan ${action}: ${(lr.item as any)?.name} — ${data.status}`,
    entity_type: 'loan_request',
    entity_id: id,
  })

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('loan_requests').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
