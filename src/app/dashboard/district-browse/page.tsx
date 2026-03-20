'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function DistrictBrowsePage() {
  const [items, setItems]   = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [selected, setSelected] = useState<string>('')
  const [loading, setLoading]   = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: prof } = await supabase.from('user_profiles').select('facility_id,district_id').eq('id',session.user.id).single()
      if (!prof) return
      // Get peer facilities this facility can view
      const { data: peers } = await supabase.from('facility_share_settings')
        .select('owner_facility_id, facilities!owner_facility_id(id,name)')
        .eq('peer_facility_id', prof.facility_id)
        .eq('can_view', true)
      setFacilities((peers||[]).map((p:any) => p.facilities).filter(Boolean))
    }
    load()
  }, [])

  async function browse(fid: string) {
    setSelected(fid)
    setLoading(true)
    const { data } = await supabase.from('inventory_items')
      .select('id,tag_id,name,item_type,status,color,size,ok_to_loan')
      .eq('facility_id', fid)
      .eq('status','Available')
      .order('name')
    setItems(data||[])
    setLoading(false)
  }

  const icon: Record<string,string> = { Costume:'👗',Prop:'🎭',Wig:'💈',Jewelry:'💍',Equipment:'💡' }

  return (
    <div>
      <PageHeader title="🏫 Browse District" subtitle="View Shared Inventories"/>
      {facilities.length === 0 ? (
        <EmptyState icon="🔗" text="No peer facilities have shared their inventory with you yet. Go to Sharing Settings to connect."/>
      ) : (
        <>
          <div style={{display:'flex',gap:'.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
            {facilities.map((f:any) => (
              <button key={f.id} onClick={()=>browse(f.id)} style={{fontFamily:"'DM Mono',monospace",fontSize:'.62rem',letterSpacing:'.08em',textTransform:'uppercase',padding:'.4rem .9rem',background:selected===f.id?'#c9a84c':'transparent',color:selected===f.id?'#0e0c08':'#9a8e72',border:'1px solid rgba(201,168,76,.3)',borderRadius:2,cursor:'pointer'}}>
                {f.name}
              </button>
            ))}
          </div>
          {loading ? <Loading/> : (
            <div style={{display:'grid',gap:'.4rem'}}>
              {items.map(item => (
                <div key={item.id} style={{background:'#0e0c08',border:'1px solid rgba(201,168,76,.1)',borderRadius:2,padding:'.65rem 1rem',display:'flex',alignItems:'center',gap:'.8rem'}}>
                  <span style={{fontSize:'1.2rem'}}>{icon[item.item_type]||'📦'}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'.9rem',color:'#e6dfc8'}}>{item.name}</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#5a5038'}}>{item.tag_id} · {item.color} · Size {item.size||'—'}</div>
                  </div>
                  {item.ok_to_loan && <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.54rem',color:'#6aaa5a',background:'rgba(106,170,90,.12)',border:'1px solid rgba(106,170,90,.3)',padding:'2px 6px',borderRadius:7}}>Loanable</span>}
                </div>
              ))}
              {selected && items.length===0 && !loading && <EmptyState icon="📦" text="No available items at this facility."/>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Shared helpers ─────────────────────────────────────────────
function PageHeader({ title, subtitle, action }: { title:string; subtitle:string; action?:{label:string;href:string} }) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'1.2rem',paddingBottom:'.9rem',borderBottom:'1px solid rgba(201,168,76,.12)'}}>
      <div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',letterSpacing:'.16em',color:'#5a5038',textTransform:'uppercase',marginBottom:'.18rem'}}>{subtitle}</div>
        <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.5rem',fontWeight:700,color:'#c9a84c',margin:0}}>{title}</h1>
      </div>
      {action&&<a href={action.href} style={{fontFamily:"'DM Mono',monospace",fontSize:'.62rem',letterSpacing:'.1em',textTransform:'uppercase',padding:'.42rem .85rem',background:'#c9a84c',color:'#0e0c08',fontWeight:500,borderRadius:2,textDecoration:'none'}}>{action.label}</a>}
    </div>
  )
}
function Loading() {
  return <div style={{padding:'2rem',textAlign:'center',fontFamily:"'DM Mono',monospace",fontSize:'.65rem',color:'#5a5038',letterSpacing:'.1em',textTransform:'uppercase'}}>Loading…</div>
}
function EmptyState({ icon, text }: { icon:string; text:string }) {
  return (
    <div style={{textAlign:'center',padding:'3rem 1rem',color:'#5a5038'}}>
      <div style={{fontSize:'3rem',opacity:.25,marginBottom:'.8rem'}}>{icon}</div>
      <p style={{fontFamily:"'DM Mono',monospace",fontSize:'.7rem',letterSpacing:'.08em',margin:0}}>{text}</p>
    </div>
  )
}
