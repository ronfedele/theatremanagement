'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function ProductionsPage() {
  const [productions, setProductions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: prof } = await supabase.from('user_profiles').select('facility_id').eq('id',session.user.id).single()
      if (!prof?.facility_id) { setLoading(false); return }
      const { data } = await supabase.from('checkout_records').select('production').eq('facility_id',prof.facility_id)
      const unique = [...new Set((data||[]).map((r:any)=>r.production).filter(Boolean))] as string[]
      setProductions(unique.sort())
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <PageHeader title="🎬 Productions" subtitle="Production Tracking"/>
      {loading ? <Loading/> : (
        <div className='card-grid' style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'.8rem'}}>
          {productions.map(p => (
            <div key={p} style={{background:'linear-gradient(135deg,#1a1610,#141009)',border:'1px solid rgba(201,168,76,.18)',borderRadius:3,padding:'1.1rem',cursor:'pointer'}}>
              <div style={{fontSize:'1.8rem',marginBottom:'.5rem'}}>🎭</div>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'.95rem',color:'#e8d49a',fontWeight:600,lineHeight:1.3}}>{p}</div>
            </div>
          ))}
          {productions.length===0&&<EmptyState icon="🎬" text="No productions recorded yet."/>}
        </div>
      )}
    </div>
  )
}

// ── Shared helpers ─────────────────────────────────────────────
function PageHeader({ title, subtitle, action }: { title:string; subtitle:string; action?:{label:string;href:string} }) {
  return (
    <div className='page-header-row' style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'1.2rem',paddingBottom:'.9rem',borderBottom:'1px solid rgba(201,168,76,.12)'}}>
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
