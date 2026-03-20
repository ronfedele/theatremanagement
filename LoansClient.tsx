'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function ActivityPage() {
  const [logs, setLogs]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('activity_log').select('*').order('created_at',{ascending:false}).limit(100)
      .then(({ data }) => { setLogs(data||[]); setLoading(false) })
  }, [])

  return (
    <div>
      <PageHeader title="📜 Activity Log" subtitle="System Events"/>
      {loading ? <Loading/> : (
        <div style={{display:'grid',gap:'.4rem'}}>
          {logs.map(log => (
            <div key={log.id} style={{background:'#231e14',border:'1px solid rgba(201,168,76,.1)',borderRadius:2,padding:'.65rem 1rem',display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#3a3020',flexShrink:0,width:80}}>
                {new Date(log.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
              </div>
              <div style={{flex:1,fontSize:'.88rem',color:'#c8c0a8'}}>{log.action}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#5a5038'}}>{log.user_name}</div>
            </div>
          ))}
          {logs.length === 0 && <EmptyState icon="📜" text="No activity logged yet."/>}
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
