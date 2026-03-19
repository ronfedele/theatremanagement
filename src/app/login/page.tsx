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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.session) window.location.href = '/dashboard'
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width:'100%', background:'#0e0c08', border:'1px solid rgba(201,168,76,.3)', color:'#f0ead8', padding:'.5rem .7rem', fontFamily:'inherit', fontSize:'1rem', borderRadius:2, outline:'none', boxSizing:'border-box' }

  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 30% 40%,#1e1508,#0e0c08)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{width:'100%',maxWidth:400,background:'linear-gradient(145deg,#221c12,#181410)',border:'1px solid rgba(201,168,76,.5)',borderRadius:4,padding:'2.5rem',position:'relative',boxShadow:'0 24px 60px rgba(0,0,0,.6)'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,transparent,#c9a84c,transparent)'}}/>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontFamily:'"Playfair Display",Georgia,serif',fontSize:'2.2rem',fontWeight:900,color:'#c9a84c',letterSpacing:'.08em'}}>StageWard</div>
          <div style={{fontFamily:'"DM Mono",monospace',fontSize:'.6rem',letterSpacing:'.2em',color:'#8a6f30',textTransform:'uppercase',marginTop:'.2rem'}}>Costume · Props · Inventory</div>
        </div>

        <div style={{display:'flex',marginBottom:'1.5rem',background:'#0a0806',borderRadius:2,border:'1px solid rgba(201,168,76,.2)',overflow:'hidden'}}>
          {(['login','signup'] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)} type="button" style={{flex:1,padding:'.5rem',background:mode===m?'rgba(201,168,76,.15)':'transparent',border:'none',color:mode===m?'#c9a84c':'#5a5038',cursor:'pointer',fontFamily:'"DM Mono",monospace',fontSize:'.6rem',letterSpacing:'.1em',textTransform:'uppercase'}}>
              {m==='login'?'Sign In':'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode==='signup'&&<div style={{marginBottom:'.9rem'}}><label style={{fontFamily:'"DM Mono",monospace',fontSize:'.57rem',color:'#8a6f30',display:'block',marginBottom:'.3rem',textTransform:'uppercase',letterSpacing:'.12em'}}>Full Name</label><input value={name} onChange={e=>setName(e.target.value)} required style={inp} placeholder="Your name"/></div>}
          <div style={{marginBottom:'.9rem'}}><label style={{fontFamily:'"DM Mono",monospace',fontSize:'.57rem',color:'#8a6f30',display:'block',marginBottom:'.3rem',textTransform:'uppercase',letterSpacing:'.12em'}}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={inp} placeholder="you@school.edu"/></div>
          <div style={{marginBottom:'1.2rem'}}><label style={{fontFamily:'"DM Mono",monospace',fontSize:'.57rem',color:'#8a6f30',display:'block',marginBottom:'.3rem',textTransform:'uppercase',letterSpacing:'.12em'}}>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={inp} placeholder="••••••••"/></div>
          {error&&<div style={{marginBottom:'.8rem',padding:'.5rem .7rem',background:'rgba(139,26,46,.2)',border:'1px solid rgba(196,52,78,.4)',borderRadius:2,fontFamily:'"DM Mono",monospace',fontSize:'.62rem',color:'#f08090'}}>{error}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:'.75rem',background:'#c9a84c',color:'#0e0c08',fontFamily:'"DM Mono",monospace',fontSize:'.72rem',letterSpacing:'.12em',textTransform:'uppercase',fontWeight:500,border:'none',borderRadius:2,cursor:loading?'wait':'pointer',opacity:loading?.7:1}}>
            {loading?'Please wait…':mode==='login'?'Sign In →':'Create Account →'}
          </button>
        </form>
      </div>
    </div>
  )
}
