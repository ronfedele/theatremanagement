'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import InventoryClient from './InventoryClient'

const TYPE_MAP: Record<string, string> = {
  costumes:'Costume', props:'Prop', wigs:'Wig', jewelry:'Jewelry', equipment:'Equipment'
}

export default function InventoryPage() {
  const params    = useParams()
  const type      = params.type as string
  const itemType  = TYPE_MAP[type]
  const supabase  = createClient()

  const [facilityId,   setFacilityId]   = useState<string|null>(null)
  const [items,        setItems]         = useState<any[]>([])
  const [locations,    setLocations]     = useState<any[]>([])
  const [dropdowns,    setDropdowns]     = useState<Record<string,string[]>>({})
  const [productions,  setProductions]   = useState<string[]>([])
  const [loading,      setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      if (!itemType) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: prof } = await supabase.from('user_profiles').select('facility_id').eq('id', session.user.id).single()
      if (!prof?.facility_id) return
      const fid = prof.facility_id
      setFacilityId(fid)

      const [itemsRes, locsRes, ddRes, prodRes] = await Promise.all([
        supabase.from('inventory_items')
          .select('*, photos:item_photos(id,storage_path,public_url,label,is_primary,sort_order), storage_location:locations!storage_location_id(id,name,type,icon,parent_id)')
          .eq('facility_id', fid).eq('item_type', itemType).order('tag_id'),
        supabase.from('locations').select('*').eq('facility_id', fid).order('sort_order'),
        supabase.from('dropdown_lists').select('list_key,values').eq('facility_id', fid),
        // Get unique productions from checkout_records
        supabase.from('checkout_records').select('production').eq('facility_id', fid).not('production','is',null),
      ])

      setItems(itemsRes.data || [])
      setLocations(locsRes.data || [])

      const dd: Record<string,string[]> = {}
      ;(ddRes.data || []).forEach((r:any) => { dd[r.list_key] = r.values })
      setDropdowns(dd)

      // Build unique sorted production list
      const prods = [...new Set((prodRes.data || []).map((r:any) => r.production).filter(Boolean))] as string[]
      prods.sort()
      setProductions(prods)

      setLoading(false)
    }
    load()
  }, [type])

  if (!itemType) return (
    <div style={{padding:'2rem',fontFamily:"'DM Mono',monospace",fontSize:'.7rem',color:'#c4344e'}}>
      Unknown inventory type: {type}
    </div>
  )

  if (loading) return (
    <div style={{padding:'2rem',fontFamily:"'DM Mono',monospace",fontSize:'.65rem',color:'#8a6f30',letterSpacing:'.1em',textTransform:'uppercase'}}>
      Loading {itemType}s…
    </div>
  )

  if (!facilityId) return (
    <div style={{padding:'2rem',fontFamily:"'DM Mono',monospace",fontSize:'.65rem',color:'#c4344e'}}>
      No facility assigned to your account.
    </div>
  )

  return (
    <InventoryClient
      initialItems={items}
      itemType={itemType}
      facilityId={facilityId}
      locations={locations}
      dropdowns={dropdowns}
      productions={productions}
    />
  )
}
