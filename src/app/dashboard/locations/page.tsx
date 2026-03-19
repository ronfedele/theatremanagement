import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LocationsClient from './LocationsClient'

export default async function LocationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.facility_id) redirect('/dashboard')
  const { data: locations } = await supabase.from('locations').select('*').eq('facility_id', profile.facility_id).order('sort_order')
  return <LocationsClient initialLocations={locations||[]} facilityId={profile.facility_id} />
}
