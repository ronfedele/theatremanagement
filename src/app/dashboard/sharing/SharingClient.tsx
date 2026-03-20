'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

interface Peer { id: string; name: string; type: string }
interface Setting { can_view: boolean; can_request_loan: boolean; auto_approve: boolean }

export default function SharingClient({ facilityId, facilityName, districtName, peers, initialSettings }: { facilityId: string; facilityName: string; districtName: string; peers: Peer[]; initialSettings: Record<string, any> }) {
  const supabase = createClient()
  const [settings, setSettings] = useState<Record<string, Setting>>(() => {
    const s: Record<string, Setting> = {}
    peers.forEach(p => {
      s[p.id] = initialSettings[p.id] || { can_view: false, can_request_loan: false, auto_approve: false }
    })
    return s
  })
  const [saving, setSaving] = useState<string|null>(null)

  async function toggle(peerId: string, key: keyof Setting) {
    setSaving(peerId)
    const cur = settings[peerId]
    const next = { ...cur, [key]: !cur[key] }
    // If disabling can_view, also disable loan and auto
    if (key === 'can_view' && !next.can_view) { next.can_request_loan = false; next.auto_approve = false }
    // If disabling loan, also disable auto
    if (key === 'can_request_loan' && !next.can_request_loan) { next.auto_approve = false }
    setSettings(prev => ({ ...prev, [peerId]: next }))
    await supabase.from('facility_share_settings').upsert({
      owner_facility_id: facilityId, peer_facility_id: peerId,
      can_view: next.can_view, can_request_loan: next.can_request_loan, auto_approve: next.auto_approve
    }, { onConflict: 'owner_facility_id,peer_facility_id' })
    setSaving(null)
  }

  return (
    <div>
      <div style={{ marginBottom:'1.2rem', paddingBottom:'.9rem', borderBottom:'1px solid rgba(201,168,76,.12)' }}>
        <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', letterSpacing:'.16em', color:'#5a5038', textTransform:'uppercase', marginBottom:'.18rem' }}>Sharing & Loans</div>
        <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.5rem', fontWeight:700, color:'#c9a84c' }}>🔗 My Sharing Settings</h1>
      </div>
      <p style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#5a5038', letterSpacing:'.06em', marginBottom:'1.2rem', lineHeight:1.7 }}>
        Control which facilities in <strong style={{ color:'#e8d49a' }}>{districtName}</strong> can see your inventory and submit loan requests. Settings save automatically when you toggle.
      </p>

      {peers.length === 0 ? (
        <div style={{ textAlign:'center', padding:'2.5rem', color:'#5a5038', fontFamily:'"DM Mono",monospace', fontSize:'.65rem' }}>No peer facilities in your district yet.</div>
      ) : (
        <div style={{ border:'1px solid rgba(201,168,76,.12)', borderRadius:3, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 160px 160px 160px', gap:'.5rem', padding:'.55rem .9rem', background:'#0e0c08', borderBottom:'1px solid rgba(201,168,76,.28)' }}>
            {['Facility','Can View My Inventory','Can Request Loans','Auto-Approve Loans'].map(h => (
              <div key={h} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.57rem', letterSpacing:'.14em', color:'#8a6f30', textTransform:'uppercase' }}>{h}</div>
            ))}
          </div>
          {peers.map(peer => {
            const s = settings[peer.id]
            const isSaving = saving === peer.id
            return (
              <div key={peer.id} style={{ display:'grid', gridTemplateColumns:'1fr 160px 160px 160px', gap:'.5rem', padding:'.65rem .9rem', borderTop:'1px solid rgba(201,168,76,.07)', alignItems:'center', transition:'background .12s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(201,168,76,.03)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <div>
                  <div style={{ fontSize:'.88rem', color:'#e6dfc8' }}>{peer.name}</div>
                  <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', color:'#5a5038', marginTop:'.1rem' }}>{peer.type}</div>
                </div>
                {(['can_view','can_request_loan','auto_approve'] as (keyof Setting)[]).map(key => {
                  const disabled = (key === 'can_request_loan' && !s.can_view) || (key === 'auto_approve' && !s.can_request_loan)
                  return (
                    <div key={key} style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                      <div onClick={()=>!disabled&&!isSaving&&toggle(peer.id,key)} style={{
                        position:'relative', width:34, height:19, cursor:disabled?'not-allowed':'pointer', flexShrink:0, opacity:disabled?.4:1
                      }}>
                        <div style={{ position:'absolute', inset:0, background:s[key]?'rgba(106,170,90,.2)':'#1e1810', border:`1px solid ${s[key]?'#6aaa5a':'#5a5038'}`, borderRadius:10, transition:'all .2s' }} />
                        <div style={{ position:'absolute', top:2, left:s[key]?'16px':'2px', width:13, height:13, background:s[key]?'#6aaa5a':'#5a5038', borderRadius:'50%', transition:'all .2s' }} />
                      </div>
                      <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.58rem', color:s[key]?'#6aaa5a':'#5a5038' }}>{s[key]?'On':'Off'}</span>
                      {isSaving && <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.52rem', color:'#8a6f30' }}>…</span>}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop:'1rem', padding:'.8rem 1rem', background:'rgba(30,95,110,.08)', border:'1px solid rgba(30,95,110,.2)', borderRadius:3, fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#5a5038', lineHeight:1.8 }}>
        <strong style={{ color:'#2d8fa5' }}>How it works:</strong> Enable <em>Can View</em> to let a facility see your items in their Browse District page. Enable <em>Can Request Loans</em> to allow them to submit loan requests for your items. <em>Auto-Approve</em> skips the manual approval step.
      </div>
    </div>
  )
}
