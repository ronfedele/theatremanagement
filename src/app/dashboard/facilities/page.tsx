'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<any[]>([])
  const [districts,  setDistricts]  = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('facilities').select('*').order('name'),
      supabase.from('districts').select('id,name'),
    ]).then(([fRes, dRes]) => {
      setFacilities(fRes.data || [])
      const dMap: Record<string,string> = {}
      ;(dRes.data || []).forEach((d:any) => { dMap[d.id] = d.name })
      setDistricts(dMap)
      setLoading(false)
    })
  }, [])

  const typeIcon: Record<string,string> = { 'High School':'🏫','Middle School':'🏫','Elementary':'🏫','College':'🎓','Other':'🏛️' }

  return (
    <div>
      <PageHeader title="🏫 All Facilities" subtitle="Platform Administration"/>
      {loading ? <Loading/> : (
        <div style={{display:'grid',gap:'.7rem'}}>
          {facilities.map(f => (
            <div key={f.id} style={{background:'linear-gradient(135deg,#252018,#201c14)',border:'1px solid rgba(201,168,76,.18)',borderRadius:3,padding:'1rem 1.2rem',display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{fontSize:'2rem'}}>{typeIcon[f.type]||'🏫'}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.05rem',color:'#e8d49a',fontWeight:700}}>{f.name}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#5a5038',marginTop:'.2rem',letterSpacing:'.06em'}}>
                  {districts[f.district_id]||'—'} · {f.type} · Enrollment: {f.enrollment?.toLocaleString()||'—'}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.6rem',color:'#8a6f30'}}>{f.contact_name}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#5a5038'}}>{f.address}</div>
              </div>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',padding:'3px 8px',borderRadius:8,color:f.active?'#6aaa5a':'#c4344e',background:f.active?'rgba(106,170,90,.12)':'rgba(196,52,78,.12)',border:`1px solid ${f.active?'rgba(106,170,90,.3)':'rgba(196,52,78,.3)'}`}}>
                {f.active?'Active':'Inactive'}
              </span>
            </div>
          ))}
          {facilities.length === 0 && <EmptyState icon="🏫" text="No facilities yet."/>}
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
