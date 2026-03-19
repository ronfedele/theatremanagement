import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AppShell from '@/components/AppShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch context data
  let district = null
  let facility = null

  if (profile.district_id) {
    const { data } = await supabase.from('districts').select('*').eq('id', profile.district_id).single()
    district = data
  }
  if (profile.facility_id) {
    const { data } = await supabase.from('facilities').select('*').eq('id', profile.facility_id).single()
    facility = data
  }

  // Pending loan count for badge
  let pendingLoans = 0
  if (profile.facility_id) {
    const { count } = await supabase
      .from('loan_requests')
      .select('id', { count: 'exact', head: true })
      .eq('to_facility_id', profile.facility_id)
      .eq('status', 'Pending')
    pendingLoans = count || 0
  }

  return (
    <AppShell
      profile={profile}
      district={district}
      facility={facility}
      pendingLoans={pendingLoans}
    >
      {children}
    </AppShell>
  )
}
