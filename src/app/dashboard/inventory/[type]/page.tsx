import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import InventoryClient from './InventoryClient'

export default async function InventoryPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.facility_id) redirect('/dashboard')

  const typeMap: Record<string, string> = {
    costumes: 'Costume', props: 'Prop', wigs: 'Wig', jewelry: 'Jewelry', equipment: 'Equipment'
  }
  const itemType = typeMap[type]
  if (!itemType) redirect('/dashboard')

  // Load items with photos and location
  const { data: items } = await supabase
    .from('inventory_items')
    .select(`
      *,
      photos:item_photos(id,storage_path,public_url,label,is_primary,sort_order),
      storage_location:locations!storage_location_id(id,name,type,icon,parent_id)
    `)
    .eq('facility_id', profile.facility_id)
    .eq('item_type', itemType)
    .order('tag_id')

  // Load locations for picker
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('facility_id', profile.facility_id)
    .order('sort_order')

  // Load dropdown lists
  const { data: dropdownRows } = await supabase
    .from('dropdown_lists')
    .select('list_key,values')
    .eq('facility_id', profile.facility_id)

  const dropdowns: Record<string, string[]> = {}
  dropdownRows?.forEach(row => { dropdowns[row.list_key] = row.values })

  return (
    <InventoryClient
      initialItems={items || []}
      itemType={itemType}
      facilityId={profile.facility_id}
      locations={locations || []}
      dropdowns={dropdowns}
    />
  )
}
