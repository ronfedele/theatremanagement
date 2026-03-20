'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface Profile { id: string; email: string; full_name: string; role: string; district_id: string|null; facility_id: string|null }
interface District { id: string; name: string }
interface Facility  { id: string; name: string; type: string }

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const supabase = createClient()

  const [profile,      setProfile]      = useState<Profile|null>(null)
  const [district,     setDistrict]     = useState<District|null>(null)
  const [facility,     setFacility]     = useState<Facility|null>(null)
  const [pendingLoans, setPendingLoans] = useState(0)
  const [status,       setStatus]       = useState('Checking session…')
  const [ready,        setReady]        = useState(false)
  const [sidebarOpen,  setSidebarOpen]  = useState(false)   // mobile drawer

  useEffect(() => {
    async function load() {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession()
      if (sessErr || !session) { window.location.replace('/login'); return }

      const { data: prof, error: profErr } = await supabase.from('user_profiles').select('*').eq('id', session.user.id).single()
      if (profErr || !prof) { setStatus(`Profile error: ${profErr?.message}`); setTimeout(() => window.location.replace('/login'), 3000); return }

      setProfile(prof)
      if (prof.district_id) {
        const { data } = await supabase.from('districts').select('id,name').eq('id', prof.district_id).single()
        setDistrict(data)
      }
      if (prof.facility_id) {
        const { data } = await supabase.from('facilities').select('id,name,type').eq('id', prof.facility_id).single()
        setFacility(data)
        const { count } = await supabase.from('loan_requests').select('id',{count:'exact',head:true}).eq('to_facility_id', prof.facility_id).eq('status','Pending')
        setPendingLoans(count||0)
      }
      setReady(true)
    }
    load()
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  if (!ready) return (
    <div style={{minHeight:'100vh',background:'#231e14',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'1rem',padding:'2rem'}}>
      <MiniMask/>
      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.1rem',color:'#c9a84c'}}>Backstage Manager</div>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.65rem',color:'#8a6f30',letterSpacing:'.1em',textTransform:'uppercase',maxWidth:380,textAlign:'center',lineHeight:1.8}}>{status}</div>
    </div>
  )

  if (!profile) return null

  const role   = profile.role
  const isSys  = role === 'sysadmin'
  const isDist = role === 'district_manager'

  const nav = isSys ? [
    {section:'Overview',   items:[{href:'/dashboard',icon:'📊',label:'Dashboard'}]},
    {section:'Management', items:[
      {href:'/dashboard/districts',  icon:'🏛️',label:'Districts'},
      {href:'/dashboard/facilities', icon:'🏫',label:'All Facilities'},
      {href:'/dashboard/users',      icon:'👥',label:'Users'},
    ]},
    {section:'System', items:[
      {href:'/dashboard/activity',icon:'📜',label:'Activity Log'},
      {href:'/dashboard/settings',icon:'⚙️',label:'Settings'},
    ]},
  ] : isDist ? [
    {section:'Overview', items:[{href:'/dashboard',icon:'📊',label:'Dashboard'}]},
    {section:'My District', items:[
      {href:'/dashboard/facilities',icon:'🏫',label:'Facilities'},
      {href:'/dashboard/loans',     icon:'📦',label:'Loan Activity'},
      {href:'/dashboard/reports',   icon:'📈',label:'Reports'},
    ]},
  ] : [
    {section:'Overview', items:[{href:'/dashboard',icon:'📊',label:'Dashboard'}]},
    {section:'My Inventory', items:[
      {href:'/dashboard/inventory/costumes',  icon:'👗',label:'Costumes'},
      {href:'/dashboard/inventory/props',     icon:'🎭',label:'Props & Sets'},
      {href:'/dashboard/inventory/wigs',      icon:'💈',label:'Wigs & Hair'},
      {href:'/dashboard/inventory/jewelry',   icon:'💍',label:'Jewelry'},
      {href:'/dashboard/inventory/equipment', icon:'💡',label:'Equipment'},
    ]},
    {section:'Checkout', items:[
      {href:'/dashboard/checkout',    icon:'📋',label:'Check Out / In'},
      {href:'/dashboard/productions', icon:'🎬',label:'Productions'},
    ]},
    {section:'Sharing & Loans', items:[
      {href:'/dashboard/sharing',         icon:'🔗',label:'Sharing Settings'},
      {href:'/dashboard/district-browse', icon:'🏫',label:'Browse District'},
      {href:'/dashboard/loans/incoming',  icon:'📥',label:'Loan Requests In',badge:pendingLoans},
      {href:'/dashboard/loans/outgoing',  icon:'📤',label:'My Loan Requests'},
    ]},
    {section:'Tools', items:[
      {href:'/dashboard/locations',icon:'📍',label:'Locations'},
      {href:'/dashboard/customize',icon:'⚙️',label:'Customize Lists'},
      {href:'/dashboard/reports',  icon:'📈',label:'Reports'},
    ]},
  ]

  const roleLabel  = {sysadmin:'System Admin',district_manager:'District Manager',facility_manager:'Facility Manager'}[role]||role
  const roleColor  = isSys?'#c9a84c':isDist?'#2d8fa5':'#6aaa5a'
  const roleBorder = isSys?'rgba(201,168,76,.3)':isDist?'rgba(45,143,165,.3)':'rgba(106,170,90,.3)'
  const roleBg     = isSys?'rgba(201,168,76,.12)':isDist?'rgba(45,143,165,.12)':'rgba(106,170,90,.12)'

  const SidebarContent = () => (
    <>
      {/* Context block */}
      <div style={{margin:'.55rem',padding:'.6rem',background:'rgba(201,168,76,.06)',border:'1px solid rgba(201,168,76,.14)',borderRadius:3}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.52rem',letterSpacing:'.15em',color:'#6a5c40',marginBottom:'.2rem',textTransform:'uppercase'}}>Context</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.72rem',color:'#e8d49a',lineHeight:1.3}}>{facility?.name||district?.name||'All Districts'}</div>
        {facility&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#9a8e72',marginTop:'.1rem'}}>{facility.type}</div>}
      </div>
      {/* Nav groups */}
      {nav.map(group=>(
        <div key={group.section}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.53rem',letterSpacing:'.2em',color:'#6a5c40',textTransform:'uppercase',padding:'.8rem 1rem .3rem'}}>{group.section}</div>
          {group.items.map(item=>{
            const active = pathname===item.href||(item.href!=='/dashboard'&&pathname.startsWith(item.href))
            return(
              <a key={item.href} href={item.href}
                onClick={()=>setSidebarOpen(false)}
                style={{display:'flex',alignItems:'center',gap:'.55rem',padding:'.5rem 1rem',textDecoration:'none',fontSize:'.88rem',color:active?'#c9a84c':'#b0a080',borderLeft:active?'2px solid #c9a84c':'2px solid transparent',background:active?'rgba(201,168,76,.09)':'transparent',transition:'all .15s'}}>
                <span style={{width:18,textAlign:'center',fontSize:'.92rem',flexShrink:0}}>{item.icon}</span>
                <span style={{flex:1}}>{item.label}</span>
                {(item as any).badge>0&&(
                  <span style={{background:'rgba(196,52,78,.25)',color:'#f08090',fontFamily:"'DM Mono',monospace",fontSize:'.54rem',padding:'1px 6px',borderRadius:8,fontWeight:600}}>{(item as any).badge}</span>
                )}
              </a>
            )
          })}
        </div>
      ))}
      {/* Sign out at bottom on mobile */}
      <div style={{marginTop:'auto',padding:'.8rem'}}>
        <button onClick={signOut} style={{width:'100%',background:'transparent',border:'1px solid rgba(201,168,76,.22)',color:'#7a6840',padding:'.45rem',fontFamily:"'DM Mono',monospace",fontSize:'.58rem',letterSpacing:'.1em',textTransform:'uppercase',borderRadius:2,cursor:'pointer'}}>
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Responsive styles injected via style tag */}
      <style>{`
        .app-shell { display:flex; flex-direction:column; height:100vh; overflow:hidden; }
        .app-topbar { height:52px; min-height:52px; background:linear-gradient(90deg,#1e1a10,#2a2214); border-bottom:1px solid rgba(201,168,76,.28); display:flex; align-items:center; padding:0 1rem; gap:.7rem; z-index:60; box-shadow:0 2px 16px rgba(0,0,0,.3); flex-shrink:0; }
        .app-body { display:flex; flex:1; overflow:hidden; }
        .app-sidebar { width:210px; min-width:210px; background:#1e1a12; border-right:1px solid rgba(201,168,76,.14); overflow-y:auto; display:flex; flex-direction:column; flex-shrink:0; transition:transform .25s ease; }
        .app-content { flex:1; overflow-y:auto; background:#201c14; }
        .app-content-inner { padding:1.4rem; }
        .topbar-brand-sub { display:block; }
        .topbar-role { display:inline-block; }
        .topbar-name { display:inline-block; }
        .topbar-signout { display:inline-block; }
        .hamburger { display:none; }
        .sidebar-overlay { display:none; }

        @media (max-width: 768px) {
          .app-shell { height:auto; min-height:100vh; overflow:auto; }
          .app-body { overflow:visible; flex-direction:column; }
          .app-sidebar {
            position:fixed; top:0; left:0; bottom:0; z-index:80;
            width:260px; min-width:260px;
            transform:translateX(-100%);
            box-shadow:4px 0 24px rgba(0,0,0,.5);
          }
          .app-sidebar.open { transform:translateX(0); }
          .sidebar-overlay { display:block; position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:75; }
          .app-content { overflow:visible; }
          .app-content-inner { padding:1rem; }
          .topbar-brand-sub { display:none; }
          .topbar-role { display:none; }
          .topbar-name { font-size:.7rem !important; max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .hamburger { display:flex; align-items:center; justify-content:center; background:transparent; border:1px solid rgba(201,168,76,.3); color:#c9a84c; width:34px; height:34px; border-radius:2px; cursor:pointer; font-size:1.1rem; flex-shrink:0; }
          .topbar-signout { display:none; }
        }

        @media (max-width: 480px) {
          .app-content-inner { padding:.75rem; }
          .app-topbar { padding:0 .75rem; gap:.5rem; }
        }
      `}</style>

      <div className="app-shell">
        {/* TOPBAR */}
        <header className="app-topbar">
          {/* Hamburger on mobile */}
          <button className="hamburger" onClick={()=>setSidebarOpen(o=>!o)} aria-label="Menu">☰</button>
          <MiniMask/>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1,flex:'0 0 auto'}}>
            <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.05rem',fontWeight:900,color:'#c9a84c',letterSpacing:'.05em'}}>Backstage Manager</span>
            <span className="topbar-brand-sub" style={{fontFamily:"'DM Mono',monospace",fontSize:'.52rem',letterSpacing:'.15em',color:'#6a5c40',textTransform:'uppercase'}}>{facility?.name||district?.name||'Platform'}</span>
          </div>
          <div style={{flex:1}}/>
          <div style={{display:'flex',alignItems:'center',gap:'.5rem',flexShrink:0}}>
            <span className="topbar-role" style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',letterSpacing:'.08em',textTransform:'uppercase',padding:'3px 9px',borderRadius:10,background:roleBg,color:roleColor,border:`1px solid ${roleBorder}`}}>{roleLabel}</span>
            <span className="topbar-name" style={{fontFamily:"'DM Mono',monospace",fontSize:'.62rem',color:'#9a8e72'}}>{profile.full_name||profile.email}</span>
            <button className="topbar-signout" onClick={signOut} style={{background:'transparent',border:'1px solid rgba(201,168,76,.28)',color:'#6a5c40',padding:'.22rem .55rem',fontFamily:"'DM Mono',monospace",fontSize:'.55rem',letterSpacing:'.1em',textTransform:'uppercase',borderRadius:2,cursor:'pointer'}}>Sign Out</button>
          </div>
        </header>

        <div className="app-body">
          {/* Mobile overlay */}
          {sidebarOpen && <div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)}/>}

          {/* SIDEBAR */}
          <nav className={`app-sidebar${sidebarOpen?' open':''}`}>
            <SidebarContent/>
          </nav>

          {/* CONTENT */}
          <main className="app-content">
            <div className="app-content-inner">{children}</div>
          </main>
        </div>
      </div>
    </>
  )
}

function MiniMask() {
  return(
    <svg width="28" height="28" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
      <defs>
        <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#e8d49a"/><stop offset="100%" stopColor="#9a6820"/></linearGradient>
        <linearGradient id="ms" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#d8d0c0"/><stop offset="100%" stopColor="#7a7060"/></linearGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill="#1a1408" stroke="#c9a84c" strokeWidth="1.5"/>
      <g transform="translate(8,12) scale(0.85)">
        <ellipse cx="20" cy="26" rx="16" ry="20" fill="url(#mg)" stroke="#8a6020" strokeWidth="1"/>
        <path d="M9,22 Q13,18 17,22" stroke="#3a2808" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M23,22 Q27,18 31,22" stroke="#3a2808" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M9,32 Q20,42 31,32" stroke="#3a2808" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <ellipse cx="13" cy="22" rx="3" ry="2.5" fill="#1a0e04" opacity="0.55"/>
        <ellipse cx="27" cy="22" rx="3" ry="2.5" fill="#1a0e04" opacity="0.55"/>
      </g>
      <g transform="translate(30,18) scale(0.78)" opacity="0.85">
        <ellipse cx="20" cy="26" rx="15" ry="19" fill="url(#ms)" stroke="#585048" strokeWidth="1"/>
        <path d="M9,23 Q13,27 17,23" stroke="#2a2820" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M23,23 Q27,27 31,23" stroke="#2a2820" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M10,36 Q20,28 30,36" stroke="#2a2820" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      </g>
      <path d="M10,62 Q28,56 50,60 Q58,64 64,68 Q50,74 40,72 Q24,74 16,70 Z" fill="#8b1a2e" opacity="0.7"/>
      <path d="M12,68 Q26,72 40,70 Q54,72 62,66" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.7"/>
    </svg>
  )
}
