import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LoansClient from '../incoming/LoansClient'

export default async function LoansOutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.facility_id) redirect('/dashboard')

  const { data: loans } = await supabase
    .from('loan_requests')
    .select(`*, item:inventory_items(tag_id,name,item_type,color,condition,status), to_facility:facilities!to_facility_id(name,type)`)
    .eq('from_facility_id', profile.facility_id)
    .order('created_at', { ascending: false })

  return <LoansClient loans={loans||[]} facilityId={profile.facility_id} userName={profile.full_name||profile.email} direction="outgoing" />
}
