import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CustomizeClient from './CustomizeClient'

export default async function CustomizePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.facility_id) redirect('/dashboard')
  const { data: rows } = await supabase.from('dropdown_lists').select('list_key,values').eq('facility_id', profile.facility_id)
  const dropdowns: Record<string, string[]> = {}
  rows?.forEach(r => { dropdowns[r.list_key] = r.values })
  return <CustomizeClient initialDropdowns={dropdowns} facilityId={profile.facility_id} />
}
