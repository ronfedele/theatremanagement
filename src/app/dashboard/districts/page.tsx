'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function DistrictsPage() {
  const [districts, setDistricts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('districts').select('*, facilities(count)').order('name').then(({ data }) => {
      setDistricts(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <PageHeader title="🏛️ Districts" subtitle="Platform Administration" action={{ label:'+ New District', href:'#' }}/>
      {loading ? <Loading/> : (
        <div style={{display:'grid',gap:'.7rem'}}>
          {districts.map(d => (
            <div key={d.id} style={{background:'linear-gradient(135deg,#252018,#201c14)',border:'1px solid rgba(201,168,76,.18)',borderRadius:3,padding:'1rem 1.2rem',display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{fontSize:'2rem'}}>🏛️</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.05rem',color:'#e8d49a',fontWeight:700}}>{d.name}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#5a5038',marginTop:'.2rem',letterSpacing:'.06em'}}>
                  {d.state} · {d.plan} · {d.active ? '✅ Active' : '⭕ Inactive'}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.6rem',color:'#8a6f30'}}>{d.contact_name}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#5a5038'}}>{d.contact_email}</div>
              </div>
              <PlanBadge plan={d.plan}/>
            </div>
          ))}
          {districts.length === 0 && <EmptyState icon="🏛️" text="No districts yet."/>}
        </div>
      )}
    </div>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const color = plan === 'Professional' ? '#c9a84c' : '#6aaa5a'
  const bg    = plan === 'Professional' ? 'rgba(201,168,76,.12)' : 'rgba(106,170,90,.12)'
  return <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',letterSpacing:'.1em',textTransform:'uppercase',padding:'3px 8px',borderRadius:8,color,background:bg,border:`1px solid ${color}44`}}>{plan}</span>
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
