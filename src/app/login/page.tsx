'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [mode, setMode]         = useState<'login'|'signup'>('login')
  const [name, setName]         = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (error) throw error
        setError('Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.replace('/dashboard')
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = {
    width:'100%', background:'#1a1610', border:'1px solid rgba(201,168,76,.3)',
    color:'#f0ead8', padding:'.55rem .7rem', fontFamily:"'Crimson Pro',Georgia,serif",
    fontSize:'1rem', borderRadius:2, outline:'none', boxSizing:'border-box',
    display:'block', marginTop:'.28rem'
  }
  const lbl: React.CSSProperties = {
    fontFamily:"'DM Mono',monospace", fontSize:'.57rem', letterSpacing:'.14em',
    color:'#8a6f30', display:'block', textTransform:'uppercase'
  }

  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 25% 35%,#2e2410 0%,#201c10 65%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{width:'100%',maxWidth:420,background:'linear-gradient(145deg,#2e2618,#252018)',border:'1px solid rgba(201,168,76,.4)',borderRadius:4,padding:'2.5rem',position:'relative',boxShadow:'0 28px 70px rgba(0,0,0,.7)'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,transparent,#c9a84c,transparent)'}}/>

        {/* LOGO */}
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:'1rem'}}>
            <LogoMark size={56}/>
          </div>
          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.9rem',fontWeight:900,color:'#c9a84c',letterSpacing:'.06em',lineHeight:1}}>
            Backstage Manager
          </div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',letterSpacing:'.22em',color:'#8a6f30',textTransform:'uppercase',marginTop:'.35rem'}}>
            Costume · Props · Inventory · Platform
          </div>
        </div>

        <div style={{display:'flex',marginBottom:'1.5rem',background:'#1a1610',borderRadius:2,border:'1px solid rgba(201,168,76,.2)',overflow:'hidden'}}>
          {(['login','signup'] as const).map(m=>(
            <button key={m} type="button" onClick={()=>setMode(m)} style={{flex:1,padding:'.5rem',background:mode===m?'rgba(201,168,76,.15)':'transparent',border:'none',color:mode===m?'#c9a84c':'#5a5038',cursor:'pointer',fontFamily:"'DM Mono',monospace",fontSize:'.6rem',letterSpacing:'.1em',textTransform:'uppercase'}}>
              {m==='login'?'Sign In':'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode==='signup'&&(
            <div style={{marginBottom:'.9rem'}}>
              <label style={lbl}>Full Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} required style={inp} placeholder="Your name"/>
            </div>
          )}
          <div style={{marginBottom:'.9rem'}}>
            <label style={lbl}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={inp} placeholder="you@school.edu"/>
          </div>
          <div style={{marginBottom:'1.2rem'}}>
            <label style={lbl}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={inp} placeholder="••••••••"/>
          </div>
          {error&&(
            <div style={{marginBottom:'.8rem',padding:'.5rem .7rem',background:'rgba(139,26,46,.2)',border:'1px solid rgba(196,52,78,.4)',borderRadius:2,fontFamily:"'DM Mono',monospace",fontSize:'.62rem',color:'#f08090'}}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{width:'100%',padding:'.78rem',background:'linear-gradient(135deg,#c9a84c,#a07830)',color:'#231e14',fontFamily:"'DM Mono',monospace",fontSize:'.72rem',letterSpacing:'.12em',textTransform:'uppercase',fontWeight:600,border:'none',borderRadius:2,cursor:loading?'wait':'pointer',opacity:loading?.7:1,boxShadow:'0 4px 16px rgba(201,168,76,.3)'}}>
            {loading?'Please wait…':mode==='login'?'Enter the Stage →':'Create Account →'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Inline SVG Logo Mark ── */
function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2a1e0a"/>
          <stop offset="100%" stopColor="#0e0c08"/>
        </radialGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8d49a"/>
          <stop offset="100%" stopColor="#9a6820"/>
        </linearGradient>
        <linearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d8d0c0"/>
          <stop offset="100%" stopColor="#7a7060"/>
        </linearGradient>
      </defs>

      {/* Circle background */}
      <circle cx="40" cy="40" r="38" fill="url(#bg)" stroke="#c9a84c" strokeWidth="1.5" opacity="0.9"/>

      {/* Comedy mask - front left, gold */}
      <g transform="translate(8,12) scale(0.85)">
        <ellipse cx="20" cy="26" rx="16" ry="20" fill="url(#gold)" stroke="#8a6020" strokeWidth="1"/>
        {/* happy brow */}
        <path d="M6,18 Q20,12 34,18" stroke="#6a4818" strokeWidth="1.2" fill="none"/>
        {/* eyes up */}
        <path d="M9,22 Q13,18 17,22" stroke="#3a2808" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M23,22 Q27,18 31,22" stroke="#3a2808" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* smile */}
        <path d="M9,32 Q20,42 31,32" stroke="#3a2808" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        {/* eye openings */}
        <ellipse cx="13" cy="22" rx="3" ry="2.5" fill="#1a0e04" opacity="0.55"/>
        <ellipse cx="27" cy="22" rx="3" ry="2.5" fill="#1a0e04" opacity="0.55"/>
        {/* laurel */}
        <path d="M5,16 Q8,10 12,14 Q16,8 20,12 Q24,8 28,12 Q32,10 35,16" stroke="#4a7020" strokeWidth="1.2" fill="none"/>
      </g>

      {/* Tragedy mask - back right, silver */}
      <g transform="translate(30,18) scale(0.78)" opacity="0.85">
        <ellipse cx="20" cy="26" rx="15" ry="19" fill="url(#silver)" stroke="#585048" strokeWidth="1"/>
        {/* sad brow */}
        <path d="M7,17 Q14,14 17,19" stroke="#3a3028" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
        <path d="M23,19 Q26,14 33,17" stroke="#3a3028" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
        {/* eyes down */}
        <path d="M9,23 Q13,27 17,23" stroke="#2a2820" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M23,23 Q27,27 31,23" stroke="#2a2820" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* frown */}
        <path d="M10,36 Q20,28 30,36" stroke="#2a2820" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        {/* tears */}
        <ellipse cx="11" cy="30" rx="1" ry="1.8" fill="#90a8c0" opacity="0.8"/>
        <ellipse cx="29" cy="30" rx="1" ry="1.8" fill="#90a8c0" opacity="0.8"/>
        {/* eye openings */}
        <ellipse cx="13" cy="23" rx="2.8" ry="2.5" fill="#121008" opacity="0.55"/>
        <ellipse cx="27" cy="23" rx="2.8" ry="2.5" fill="#121008" opacity="0.55"/>
      </g>

      {/* Costume drape at bottom */}
      <path d="M10,62 Q22,56 34,60 Q46,64 56,58 Q62,62 64,68 Q50,74 40,72 Q28,74 16,70 Z" fill="#8b1a2e" opacity="0.75"/>
      <path d="M12,68 Q26,72 40,70 Q54,72 62,66" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.7"/>

      {/* Mask stick */}
      <line x1="36" y1="58" x2="40" y2="72" stroke="#9a6820" strokeWidth="2" strokeLinecap="round"/>

      {/* Stars / sparkles */}
      <circle cx="66" cy="20" r="1.2" fill="#c9a84c" opacity="0.7"/>
      <circle cx="14" cy="56" r="1" fill="#c9a84c" opacity="0.5"/>
      <circle cx="70" cy="50" r="0.9" fill="#e8d49a" opacity="0.6"/>
    </svg>
  )
}
