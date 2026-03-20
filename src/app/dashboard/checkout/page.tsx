'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function CheckoutPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: prof } = await supabase.from('user_profiles').select('facility_id').eq('id', session.user.id).single()
      if (!prof?.facility_id) { setLoading(false); return }
      const { data } = await supabase.from('checkout_records')
        .select('*, item:inventory_items(tag_id,name,item_type)')
        .eq('facility_id', prof.facility_id)
        .neq('status','Returned')
        .order('out_date',{ascending:false})
      setRecords(data||[])
      setLoading(false)
    }
    load()
  }, [])

  const statusColor: Record<string,string> = { Out:'#2d8fa5', Overdue:'#c4344e', Lost:'#e8943a' }

  return (
    <div>
      <PageHeader title="📋 Check Out / In" subtitle="Active Checkouts"/>
      {loading ? <Loading/> : (
        <div style={{display:'grid',gap:'.5rem'}}>
          {records.map(r => (
            <div key={r.id} style={{background:'#231e14',border:'1px solid rgba(201,168,76,.12)',borderRadius:2,padding:'.75rem 1rem',display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'.95rem',color:'#e6dfc8'}}>{r.item?.name||'Unknown Item'} <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.6rem',color:'#5a5038'}}>{r.item?.tag_id}</span></div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.6rem',color:'#5a5038',marginTop:'.2rem'}}>{r.person_name} · {r.production}</div>
              </div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.6rem',color:'#5a5038',textAlign:'right'}}>
                <div>Out: {r.out_date}</div>
                <div>Due: {r.due_date}</div>
              </div>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',padding:'3px 8px',borderRadius:7,color:statusColor[r.status]||'#9a8e72',background:`${statusColor[r.status]||'#9a8e72'}18`,border:`1px solid ${statusColor[r.status]||'#9a8e72'}44`}}>{r.status}</span>
            </div>
          ))}
          {records.length===0&&<EmptyState icon="📋" text="No active checkouts."/>}
        </div>
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
      {action&&<a href={action.href} style={{fontFamily:"'DM Mono',monospace",fontSize:'.62rem',letterSpacing:'.1em',textTransform:'uppercase',padding:'.42rem .85rem',background:'#c9a84c',color:'#231e14',fontWeight:500,borderRadius:2,textDecoration:'none'}}>{action.label}</a>}
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
