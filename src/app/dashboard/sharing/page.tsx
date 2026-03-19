import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SharingClient from './SharingClient'

export default async function SharingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.facility_id) redirect('/dashboard')

  const { data: myFac } = await supabase.from('facilities').select('*, district:districts(name)').eq('id', profile.facility_id).single()
  const { data: peers } = await supabase.from('facilities').select('id,name,type').eq('district_id', myFac?.district_id).neq('id', profile.facility_id)
  const { data: settings } = await supabase.from('facility_share_settings').select('*').eq('owner_facility_id', profile.facility_id)

  const settingsMap: Record<string, any> = {}
  settings?.forEach(s => { settingsMap[s.peer_facility_id] = s })

  return <SharingClient facilityId={profile.facility_id} facilityName={myFac?.name||''} districtName={(myFac as any)?.district?.name||''} peers={peers||[]} initialSettings={settingsMap} />
}
