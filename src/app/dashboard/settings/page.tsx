'use client'
export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="⚙️ Settings" subtitle="Platform Configuration"/>
      <div style={{display:'grid',gap:'1rem',maxWidth:600}}>
        {[
          {icon:'🏛️',label:'District Management',desc:'Add, edit and configure school districts'},
          {icon:'👥',label:'User Roles',desc:'Manage access levels and permissions'},
          {icon:'📧',label:'Email Notifications',desc:'Configure automated email alerts'},
          {icon:'🔒',label:'Security Settings',desc:'Password policies and session management'},
        ].map(item => (
          <div key={item.label} style={{background:'linear-gradient(135deg,#1a1610,#141009)',border:'1px solid rgba(201,168,76,.18)',borderRadius:3,padding:'1rem 1.2rem',display:'flex',alignItems:'center',gap:'1rem',cursor:'pointer'}}>
            <div style={{fontSize:'1.8rem'}}>{item.icon}</div>
            <div>
              <div style={{fontSize:'.95rem',color:'#e8d49a',fontWeight:600,marginBottom:'.15rem'}}>{item.label}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.6rem',color:'#5a5038'}}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
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
