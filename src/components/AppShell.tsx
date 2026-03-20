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

  const [profile,  setProfile]  = useState<Profile|null>(null)
  const [district, setDistrict] = useState<District|null>(null)
  const [facility, setFacility] = useState<Facility|null>(null)
  const [pendingLoans, setPendingLoans] = useState(0)
  const [status, setStatus]     = useState('Checking session…')
  const [ready, setReady]       = useState(false)

  useEffect(() => {
    async function load() {
      setStatus('Checking session…')

      // Step 1 — get session
      const { data: { session }, error: sessErr } = await supabase.auth.getSession()
      if (sessErr) { setStatus(`Session error: ${sessErr.message}`); setTimeout(() => window.location.replace('/login'), 2000); return }
      if (!session) { setStatus('No session — redirecting…'); window.location.replace('/login'); return }

      setStatus(`Session found (${session.user.email}). Loading profile…`)

      // Step 2 — get profile
      const { data: prof, error: profErr } = await supabase
        .from('user_profiles').select('*').eq('id', session.user.id).single()

      if (profErr) { setStatus(`Profile error: ${profErr.message} (code: ${profErr.code})`); setTimeout(() => window.location.replace('/login'), 4000); return }
      if (!prof)   { setStatus('No profile found — redirecting…'); setTimeout(() => window.location.replace('/login'), 2000); return }

      setProfile(prof)
      setStatus('Profile loaded. Getting context…')

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

  async function signOut() {
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  // Loading / error screen — shows exactly what's happening
  if (!ready) return (
    <div style={{minHeight:'100vh',background:'#231e14',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'1rem',padding:'2rem'}}>
      <MiniMask/>
      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.1rem',color:'#c9a84c'}}>Backstage Manager</div>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.65rem',color:'#8a6f30',letterSpacing:'.1em',textTransform:'uppercase',maxWidth:400,textAlign:'center',lineHeight:1.6}}>
        {status}
      </div>
    </div>
  )

  if (!profile) return null

  const role  = profile.role
  const isSys = role === 'sysadmin'
  const isDist = role === 'district_manager'

  const nav = isSys ? [
    {section:'Overview',   items:[{href:'/dashboard',          icon:'📊',label:'Dashboard'}]},
    {section:'Management', items:[
      {href:'/dashboard/districts',  icon:'🏛️',label:'Districts'},
      {href:'/dashboard/facilities', icon:'🏫',label:'All Facilities'},
      {href:'/dashboard/users',      icon:'👥',label:'Users'},
    ]},
    {section:'System', items:[
      {href:'/dashboard/activity', icon:'📜',label:'Activity Log'},
      {href:'/dashboard/settings', icon:'⚙️',label:'Settings'},
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
      {href:'/dashboard/locations', icon:'📍',label:'Locations'},
      {href:'/dashboard/customize', icon:'⚙️',label:'Customize Lists'},
      {href:'/dashboard/reports',   icon:'📈',label:'Reports'},
    ]},
  ]

  const roleLabel  = {sysadmin:'System Admin',district_manager:'District Manager',facility_manager:'Facility Manager'}[role]||role
  const roleColor  = isSys?'#c9a84c':isDist?'#2d8fa5':'#6aaa5a'
  const roleBorder = isSys?'rgba(201,168,76,.3)':isDist?'rgba(45,143,165,.3)':'rgba(106,170,90,.3)'
  const roleBg     = isSys?'rgba(201,168,76,.12)':isDist?'rgba(45,143,165,.12)':'rgba(106,170,90,.12)'

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>
      {/* TOPBAR */}
      <header style={{height:52,minHeight:52,background:'linear-gradient(90deg,#1e1a10,#2a2214)',borderBottom:'1px solid rgba(201,168,76,.28)',display:'flex',alignItems:'center',padding:'0 1.1rem',gap:'.8rem',zIndex:60,boxShadow:'0 2px 16px rgba(8,6,3,.35)',flexShrink:0}}>
        <MiniMask/>
        <div style={{display:'flex',flexDirection:'column',lineHeight:1}}>
          <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.05rem',fontWeight:900,color:'#c9a84c',letterSpacing:'.05em'}}>Backstage Manager</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.52rem',letterSpacing:'.15em',color:'#5a5038',textTransform:'uppercase'}}>{facility?.name||district?.name||'Platform Administration'}</span>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:'flex',alignItems:'center',gap:'.6rem',flexShrink:0}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',letterSpacing:'.1em',textTransform:'uppercase',padding:'3px 10px',borderRadius:10,background:roleBg,color:roleColor,border:`1px solid ${roleBorder}`}}>{roleLabel}</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.62rem',color:'#9a8e72'}}>{profile.full_name||profile.email}</span>
          <button onClick={signOut} style={{background:'transparent',border:'1px solid rgba(201,168,76,.28)',color:'#5a5038',padding:'.22rem .55rem',fontFamily:"'DM Mono',monospace",fontSize:'.55rem',letterSpacing:'.1em',textTransform:'uppercase',borderRadius:2,cursor:'pointer'}}>Sign Out</button>
        </div>
      </header>

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* SIDEBAR */}
        <nav style={{width:204,minWidth:204,background:'#231e14',borderRight:'1px solid rgba(201,168,76,.12)',overflowY:'auto',display:'flex',flexDirection:'column',flexShrink:0}}>
          <div style={{margin:'.55rem',padding:'.6rem',background:'rgba(201,168,76,.05)',border:'1px solid rgba(201,168,76,.12)',borderRadius:3}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.52rem',letterSpacing:'.15em',color:'#5a5038',marginBottom:'.2rem',textTransform:'uppercase'}}>Context</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.72rem',color:'#e8d49a',lineHeight:1.3}}>{facility?.name||district?.name||'All Districts'}</div>
            {facility&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#9a8e72',marginTop:'.1rem'}}>{facility.type}</div>}
          </div>
          {nav.map(group=>(
            <div key={group.section}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.53rem',letterSpacing:'.2em',color:'#5a5038',textTransform:'uppercase',padding:'.8rem 1rem .3rem'}}>{group.section}</div>
              {group.items.map(item=>{
                const active = pathname===item.href||(item.href!=='/dashboard'&&pathname.startsWith(item.href))
                return(
                  <a key={item.href} href={item.href} style={{display:'flex',alignItems:'center',gap:'.55rem',padding:'.46rem 1rem',textDecoration:'none',fontSize:'.84rem',color:active?'#c9a84c':'#9a8e72',borderLeft:active?'2px solid #c9a84c':'2px solid transparent',background:active?'rgba(201,168,76,.08)':'transparent',transition:'all .15s'}}>
                    <span style={{width:16,textAlign:'center',fontSize:'.88rem',flexShrink:0}}>{item.icon}</span>
                    <span style={{flex:1}}>{item.label}</span>
                    {(item as any).badge>0&&<span style={{background:'rgba(196,52,78,.2)',color:'#f08090',fontFamily:"'DM Mono',monospace",fontSize:'.54rem',padding:'1px 5px',borderRadius:8}}>{(item as any).badge}</span>}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>
        {/* CONTENT */}
        <main style={{flex:1,overflowY:'auto',background:'#201c14'}}>
          <div style={{padding:'1.4rem'}}>{children}</div>
        </main>
      </div>
    </div>
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
