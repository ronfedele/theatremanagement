'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats]     = useState<any>({})
  const [recent, setRecent]   = useState<any[]>([])
  const [loans, setLoans]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const uid = session.user.id

      const { data: prof } = await supabase.from('user_profiles').select('*').eq('id', uid).single()
      if (!prof) return
      setProfile(prof)

      if (prof.role === 'facility_manager' && prof.facility_id) {
        const fid = prof.facility_id
        const [itemsRes, loansInRes] = await Promise.all([
          supabase.from('inventory_items').select('id,status,needs_repair,item_type').eq('facility_id', fid),
          supabase.from('loan_requests').select('id,status').eq('to_facility_id', fid).eq('status','Pending'),
        ])
        const all = itemsRes.data || []
        setStats({
          total:     all.length,
          available: all.filter((i:any) => i.status === 'Available').length,
          checkedOut:all.filter((i:any) => i.status === 'Checked Out').length,
          needsRepair: all.filter((i:any) => i.needs_repair).length,
          pendingLoansIn: loansInRes.data?.length || 0,
        })
        const { data: recentItems } = await supabase
          .from('inventory_items').select('id,tag_id,name,item_type,status,condition,color')
          .eq('facility_id', fid).order('created_at',{ascending:false}).limit(6)
        setRecent(recentItems || [])

        const { data: pl } = await supabase
          .from('loan_requests')
          .select('*, item:inventory_items(tag_id,name,item_type), from_facility:facilities!from_facility_id(name)')
          .eq('to_facility_id', fid).eq('status','Pending').limit(5)
        setLoans(pl || [])
      }

      if (prof.role === 'sysadmin') {
        const [d, f, i] = await Promise.all([
          supabase.from('districts').select('id',{count:'exact',head:true}),
          supabase.from('facilities').select('id',{count:'exact',head:true}),
          supabase.from('inventory_items').select('id',{count:'exact',head:true}),
        ])
        setStats({ districts: d.count||0, facilities: f.count||0, totalItems: i.count||0 })
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{color:'#5a5038',fontFamily:"'DM Mono',monospace",fontSize:'.7rem',padding:'2rem'}}>Loading dashboard…</div>
  if (!profile) return null

  const isFac = profile.role === 'facility_manager'
  const isSys = profile.role === 'sysadmin'
  const icon: Record<string,string> = { Costume:'👗', Prop:'🎭', Wig:'💈', Jewelry:'💍', Equipment:'💡' }
  const statChips = isFac ? [
    { label:'Total Items',      value: stats.total||0,           color:'#6aaa5a' },
    { label:'Available',        value: stats.available||0,       color:'#2d8fa5' },
    { label:'Checked Out',      value: stats.checkedOut||0,      color:'#c4344e' },
    { label:'Need Repair',      value: stats.needsRepair||0,     color:'#e8943a' },
    { label:'Loan Requests In', value: stats.pendingLoansIn||0,  color:'#8a5cbf' },
  ] : isSys ? [
    { label:'Districts',   value: stats.districts||0,   color:'#c9a84c' },
    { label:'Facilities',  value: stats.facilities||0,  color:'#2d8fa5' },
    { label:'Total Items', value: stats.totalItems||0,  color:'#6aaa5a' },
  ] : []

  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'1.2rem',paddingBottom:'.9rem',borderBottom:'1px solid rgba(201,168,76,.12)'}}>
        <div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',letterSpacing:'.16em',color:'#5a5038',textTransform:'uppercase',marginBottom:'.18rem'}}>
            {isFac ? 'Facility Overview' : isSys ? 'Platform Overview' : 'District Overview'}
          </div>
          <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.5rem',fontWeight:700,color:'#c9a84c',margin:0}}>📊 Dashboard</h1>
        </div>
        {isFac && (
          <div style={{display:'flex',gap:'.4rem'}}>
            <a href="/dashboard/inventory/costumes" style={{fontFamily:"'DM Mono',monospace",fontSize:'.62rem',letterSpacing:'.1em',textTransform:'uppercase',padding:'.42rem .85rem',background:'transparent',color:'#9a8e72',border:'1px solid rgba(201,168,76,.28)',borderRadius:2,textDecoration:'none'}}>+ Add Item</a>
            <a href="/dashboard/checkout" style={{fontFamily:"'DM Mono',monospace",fontSize:'.62rem',letterSpacing:'.1em',textTransform:'uppercase',padding:'.42rem .85rem',background:'#c9a84c',color:'#231e14',fontWeight:500,borderRadius:2,textDecoration:'none'}}>📋 Check Out</a>
          </div>
        )}
      </div>

      <div style={{display:'flex',gap:'.7rem',marginBottom:'1.3rem',flexWrap:'wrap'}}>
        {statChips.map(chip => (
          <div key={chip.label} style={{background:'linear-gradient(135deg,#2e2618,#252018)',border:'1px solid rgba(201,168,76,.12)',borderRadius:3,padding:'.65rem .9rem',flex:1,minWidth:100,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:chip.color,opacity:.55}}/>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.6rem',fontWeight:900,color:chip.color,lineHeight:1}}>{chip.value}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.55rem',letterSpacing:'.1em',color:'#5a5038',textTransform:'uppercase',marginTop:'.15rem'}}>{chip.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.2rem'}}>
        {isFac && (
          <div>
            <SectionTitle>🏷️ Recent Items</SectionTitle>
            {recent.length === 0 && <EmptyState icon="📦" text="No items yet. Add your first costume or prop."/>}
            {recent.map((item:any) => (
              <a key={item.id} href={`/dashboard/inventory/${item.item_type?.toLowerCase()}s/${item.id}`}
                style={{display:'flex',alignItems:'center',gap:'.7rem',padding:'.5rem .7rem',border:'1px solid rgba(201,168,76,.12)',borderRadius:2,marginBottom:'.4rem',background:'#231e14',textDecoration:'none'}}>
                <span style={{fontSize:'1.3rem'}}>{icon[item.item_type]||'📦'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'.9rem',color:'#e6dfc8'}}>{item.name}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#5a5038'}}>{item.tag_id} · {item.color||item.condition}</div>
                </div>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.54rem',textTransform:'uppercase',padding:'2px 6px',borderRadius:2,background:'rgba(40,80,35,.9)',color:'#8ed488'}}>{item.status}</span>
              </a>
            ))}
            {recent.length > 0 && <a href="/dashboard/inventory/costumes" style={{fontFamily:"'DM Mono',monospace",fontSize:'.6rem',color:'#8a6f30',textDecoration:'none'}}>View all inventory →</a>}
          </div>
        )}

        {isFac && (
          <div>
            <SectionTitle>📥 Pending Loan Requests</SectionTitle>
            {loans.length === 0 && <EmptyState icon="✅" text="No pending loan requests."/>}
            {loans.map((lr:any) => (
              <a key={lr.id} href="/dashboard/loans/incoming"
                style={{display:'flex',alignItems:'center',gap:'.7rem',padding:'.5rem .7rem',border:'1px solid rgba(138,92,191,.3)',borderLeft:'3px solid #8a5cbf',borderRadius:2,marginBottom:'.4rem',background:'#231e14',textDecoration:'none'}}>
                <span style={{fontSize:'1.2rem'}}>{icon[lr.item?.item_type]||'📦'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'.88rem',color:'#e6dfc8'}}>{lr.item?.name}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#5a5038'}}>From: {lr.from_facility?.name} · Need: {lr.need_date}</div>
                </div>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',background:'rgba(74,45,110,.2)',color:'#8a5cbf',border:'1px solid rgba(74,45,110,.4)',padding:'1px 6px',borderRadius:7}}>Pending</span>
              </a>
            ))}
          </div>
        )}

        {isSys && (
          <div style={{gridColumn:'1/-1'}}>
            <SectionTitle>🏛️ Quick Access</SectionTitle>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'.8rem'}}>
              {[
                {href:'/dashboard/districts',  icon:'🏛️', label:'Manage Districts'},
                {href:'/dashboard/facilities', icon:'🏫', label:'All Facilities'},
                {href:'/dashboard/users',      icon:'👥', label:'Users & Access'},
                {href:'/dashboard/activity',   icon:'📜', label:'Activity Log'},
              ].map(card => (
                <a key={card.href} href={card.href} style={{display:'block',background:'linear-gradient(145deg,#221c12,#1a160e)',border:'1px solid rgba(201,168,76,.28)',borderRadius:3,padding:'1.2rem',textAlign:'center',textDecoration:'none'}}>
                  <div style={{fontSize:'2rem',marginBottom:'.4rem'}}>{card.icon}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.62rem',color:'#9a8e72',letterSpacing:'.06em'}}>{card.label}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1rem',color:'#c9a84c',marginBottom:'.7rem',display:'flex',alignItems:'center',gap:'.45rem'}}>
      {children}
      <div style={{flex:1,height:1,background:'rgba(201,168,76,.12)'}}/>
    </div>
  )
}
function EmptyState({ icon, text }: { icon:string, text:string }) {
  return (
    <div style={{textAlign:'center',padding:'1.5rem',color:'#5a5038'}}>
      <div style={{fontSize:'2rem',opacity:.3,marginBottom:'.5rem'}}>{icon}</div>
      <p style={{fontSize:'.85rem',margin:0}}>{text}</p>
    </div>
  )
}
