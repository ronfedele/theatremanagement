'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function UsersPage() {
  const [users, setUsers]     = useState<any[]>([])
  const [facilities, setFacilities] = useState<Record<string,string>>({})
  const [districts,  setDistricts]  = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('user_profiles').select('*').order('full_name'),
      supabase.from('facilities').select('id,name'),
      supabase.from('districts').select('id,name'),
    ]).then(([uRes, fRes, dRes]) => {
      setUsers(uRes.data || [])
      const fm: Record<string,string> = {}; (fRes.data||[]).forEach((x:any)=>fm[x.id]=x.name)
      const dm: Record<string,string> = {}; (dRes.data||[]).forEach((x:any)=>dm[x.id]=x.name)
      setFacilities(fm); setDistricts(dm)
      setLoading(false)
    })
  }, [])

  const roleColor: Record<string,string> = { sysadmin:'#c9a84c', district_manager:'#2d8fa5', facility_manager:'#6aaa5a' }
  const roleLabel: Record<string,string> = { sysadmin:'System Admin', district_manager:'District Manager', facility_manager:'Facility Manager' }

  return (
    <div>
      <PageHeader title="👥 Users & Access" subtitle="Platform Administration"/>
      {loading ? <Loading/> : (
        <div style={{display:'grid',gap:'.6rem'}}>
          {users.map(u => (
            <div key={u.id} style={{background:'linear-gradient(135deg,#252018,#201c14)',border:'1px solid rgba(201,168,76,.18)',borderRadius:3,padding:'.85rem 1.2rem',display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(201,168,76,.15)',border:'1px solid rgba(201,168,76,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1rem',color:'#c9a84c',flexShrink:0}}>
                {(u.full_name||u.email||'?')[0].toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:'.95rem',color:'#e8d49a',fontWeight:600}}>{u.full_name||'—'}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#5a5038',marginTop:'.15rem'}}>
                  {u.email}
                </div>
              </div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.6rem',color:'#9a8e72',textAlign:'right'}}>
                {u.facility_id ? facilities[u.facility_id] : u.district_id ? districts[u.district_id] : 'All Districts'}
              </div>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',letterSpacing:'.08em',textTransform:'uppercase',padding:'3px 10px',borderRadius:8,color:roleColor[u.role]||'#9a8e72',background:`${roleColor[u.role]||'#9a8e72'}18`,border:`1px solid ${roleColor[u.role]||'#9a8e72'}44`}}>
                {roleLabel[u.role]||u.role}
              </span>
            </div>
          ))}
          {users.length === 0 && <EmptyState icon="👥" text="No users yet."/>}
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
