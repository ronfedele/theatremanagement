'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

const LIST_GROUPS = [
  { key:'costumeTypes',   label:'Costume Types',         icon:'👗' },
  { key:'propTypes',      label:'Prop / Set Types',       icon:'🎭' },
  { key:'timePeriods',    label:'Time Periods',           icon:'🕰️' },
  { key:'conditions',     label:'Conditions',             icon:'⭐' },
  { key:'statuses',       label:'Statuses',               icon:'🔄' },
  { key:'fabrics',        label:'Fabrics / Materials',    icon:'🧵' },
  { key:'colors',         label:'Colors',                 icon:'🎨' },
  { key:'cleaningCodes',  label:'Cleaning Codes',         icon:'🧺' },
  { key:'sources',        label:'Sources / Acquisition',  icon:'📥' },
  { key:'specialEffects', label:'Special Effects',        icon:'✨' },
  { key:'designStyles',   label:'Design Styles',          icon:'🎨' },
]

const DEFAULTS: Record<string, string[]> = {
  costumeTypes:   ['Accessories','Blouse','Cape','Coat','Crown/Tiara','Dance Dress','Hat','Jacket','Pants/Slacks','Robe','Shirt','Shoes','Skirt','Tights','Tutu','Unitard/Jumpsuit','Vest','Wedding Dress'],
  propTypes:      ['Furniture','Hand Prop','Set Piece','Weapon','Flat/Backdrop','Dressing','Personal Prop','Breakaway'],
  timePeriods:    ['Ancient','Medieval','Renaissance','Victorian','Edwardian','1920s','1930s','1940s','1950s','1960s','1970s','Contemporary','Fantasy','Sci-Fi'],
  conditions:     ['Excellent','Very Good','Good','Fair','Poor'],
  statuses:       ['Available','Checked Out','In Repair','In Storage','On Loan','Retired'],
  fabrics:        ['Brocade','Canvas','Chiffon','Cotton','Jersey','Lace','Leather','Lycra','Organza','Satin','Silk','Taffeta','Velvet','Wool','Synthetic'],
  colors:         ['Black','Blue','Bronze','Brown','Burgundy','Cream','Gold','Green','Grey','Orange','Pink','Purple','Red','Silver','Tan','Turquoise','White','Yellow'],
  cleaningCodes:  ['Hand Wash','Machine Wash','Dry Clean Only','Spot Clean','Air Dry Only'],
  sources:        ['Built In-House','Purchased New','Purchased Used','Donated','Thrift Store','Online Purchase'],
  specialEffects: ['None','Breakaway','Light-Up','Sound Effect','Blood Effect','Remote Control'],
  designStyles:   ['Classic','Fantasy','Historical','Military','Modern','Period','Romantic','Theatrical'],
}

export default function CustomizeClient({ initialDropdowns, facilityId }: { initialDropdowns: Record<string,string[]>; facilityId: string }) {
  const supabase = createClient()
  const [lists, setLists] = useState<Record<string,string[]>>(() => {
    const merged: Record<string,string[]> = { ...DEFAULTS }
    Object.entries(initialDropdowns).forEach(([k,v]) => { if(v.length) merged[k]=v })
    return merged
  })
  const [open, setOpen] = useState<Record<string,boolean>>({})
  const [inputs, setInputs] = useState<Record<string,string>>({})
  const [saving, setSaving] = useState<string|null>(null)

  function toggleGroup(key: string) { setOpen(prev=>({...prev,[key]:!prev[key]})) }

  async function addItem(key: string) {
    const val = inputs[key]?.trim()
    if (!val) return
    if (lists[key]?.includes(val)) { alert('Already exists'); return }
    const newList = [...(lists[key]||[]), val].sort()
    await save(key, newList)
    setInputs(prev=>({...prev,[key]:''}))
  }

  async function removeItem(key: string, val: string) {
    const newList = (lists[key]||[]).filter(v=>v!==val)
    await save(key, newList)
  }

  async function save(key: string, values: string[]) {
    setSaving(key)
    setLists(prev=>({...prev,[key]:values}))
    await supabase.from('dropdown_lists').upsert({ facility_id:facilityId, list_key:key, values, updated_at:new Date().toISOString() }, { onConflict:'facility_id,list_key' })
    setSaving(null)
  }

  return (
    <div>
      <div style={{ marginBottom:'1.2rem', paddingBottom:'.9rem', borderBottom:'1px solid rgba(201,168,76,.12)' }}>
        <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', letterSpacing:'.16em', color:'#5a5038', textTransform:'uppercase', marginBottom:'.18rem' }}>Management</div>
        <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.5rem', fontWeight:700, color:'#c9a84c' }}>⚙️ Customize Dropdown Lists</h1>
      </div>
      <p style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#5a5038', letterSpacing:'.06em', marginBottom:'1rem' }}>
        Add or remove options from any dropdown list used in your facility's item forms. Changes save automatically.
      </p>

      {LIST_GROUPS.map(group => (
        <div key={group.key} style={{ background:'#0a0806', border:'1px solid rgba(201,168,76,.12)', borderRadius:3, marginBottom:'.7rem', overflow:'hidden' }}>
          <div onClick={()=>toggleGroup(group.key)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.55rem .8rem', background:'rgba(14,12,8,.5)', cursor:'pointer', borderBottom: open[group.key]?'1px solid rgba(201,168,76,.12)':'none' }}>
            <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', letterSpacing:'.1em', color:'#c9a84c', textTransform:'uppercase' }}>
              {group.icon} {group.label}
              {saving===group.key && <span style={{ marginLeft:'.5rem', color:'#8a6f30' }}>saving…</span>}
            </span>
            <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.57rem', color:'#5a5038' }}>{(lists[group.key]||[]).length} options {open[group.key]?'▲':'▼'}</span>
          </div>
          {open[group.key] && (
            <div style={{ padding:'.6rem .8rem' }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem', marginBottom:'.6rem' }}>
                {(lists[group.key]||[]).map(val => (
                  <span key={val} style={{ display:'flex', alignItems:'center', gap:'.3rem', background:'rgba(201,168,76,.1)', border:'1px solid rgba(201,168,76,.28)', padding:'.18rem .5rem', borderRadius:10, fontFamily:'"DM Mono",monospace', fontSize:'.58rem', color:'#e8d49a' }}>
                    {val}
                    <button onClick={()=>removeItem(group.key,val)} style={{ background:'none', border:'none', color:'#5a5038', cursor:'pointer', fontSize:'.7rem', lineHeight:1, padding:0, transition:'color .15s' }}
                      onMouseEnter={e=>(e.currentTarget.style.color='#f08090')} onMouseLeave={e=>(e.currentTarget.style.color='#5a5038')}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display:'flex', gap:'.4rem' }}>
                <input
                  value={inputs[group.key]||''} onChange={e=>setInputs(prev=>({...prev,[group.key]:e.target.value}))}
                  onKeyDown={e=>e.key==='Enter'&&addItem(group.key)}
                  placeholder="Type new option and press Enter…"
                  style={{ flex:1, background:'#0e0c08', border:'1px solid rgba(201,168,76,.28)', color:'#f0ead8', padding:'.38rem .55rem', fontFamily:'"Crimson Pro",serif', fontSize:'.88rem', borderRadius:2, outline:'none' }} />
                <button onClick={()=>addItem(group.key)} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.38rem .65rem', background:'transparent', color:'#9a8e72', border:'1px solid rgba(201,168,76,.28)', borderRadius:2, cursor:'pointer' }}>+ Add</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
