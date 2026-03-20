'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { Location } from '@/lib/types'

const ICONS = ['🏫','🧵','👗','🎭','📦','🗃️','🗄️','🔨','🎨','📚','🚪','🪣','🎪','🏷️']
const TYPES = ['Building','Room','Area','Shelf/Bin','Other'] as const

export default function LocationsClient({ initialLocations, facilityId }: { initialLocations: Location[]; facilityId: string }) {
  const supabase = createClient()
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [form, setForm] = useState({ name:'', type:'Area' as string, icon:'📦', parentId:'' })
  const [editId, setEditId] = useState<string|null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  }

  function getPath(id: string): string {
    const parts: string[] = []
    let cur = locations.find(l=>l.id===id)
    while(cur) { parts.unshift(cur.name); cur = cur.parent_id ? locations.find(l=>l.id===cur!.parent_id) : undefined; if(parts.length>5)break }
    return parts.join(' › ')
  }

  async function save() {
    if (!form.name.trim()) return
    if (editId) {
      const { data } = await supabase.from('locations').update({ name:form.name, type:form.type, icon:form.icon }).eq('id', editId).select().single()
      setLocations(prev => prev.map(l=>l.id===editId?{...l,...data}:l))
      setEditId(null)
    } else {
      const { data } = await supabase.from('locations').insert({ facility_id:facilityId, parent_id:form.parentId||null, name:form.name, type:form.type, icon:form.icon, sort_order:0 }).select().single()
      if (data) setLocations(prev => [...prev, data])
    }
    setForm({ name:'', type:'Area', icon:'📦', parentId:'' })
  }

  async function remove(id: string) {
    const hasChildren = locations.some(l=>l.parent_id===id)
    if (hasChildren) { alert('Cannot delete: has child locations.'); return }
    if (!confirm('Delete this location?')) return
    await supabase.from('locations').delete().eq('id', id)
    setLocations(prev => prev.filter(l=>l.id!==id))
  }

  function startEdit(loc: Location) {
    setEditId(loc.id)
    setForm({ name:loc.name, type:loc.type, icon:loc.icon, parentId:loc.parent_id||'' })
  }

  function renderTree(parentId: string|null, depth: number): React.ReactNode {
    return locations.filter(l=>l.parent_id===parentId).map(loc => {
      const hasChildren = locations.some(l=>l.parent_id===loc.id)
      const isExpanded = expanded.has(loc.id)
      return (
        <div key={loc.id}>
          <div style={{ display:'flex', alignItems:'center', gap:'.4rem', padding:'.38rem .6rem', marginLeft:depth*20, borderRadius:2, transition:'background .12s' }}
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(201,168,76,.04)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
            <button onClick={()=>toggle(loc.id)} style={{ width:16, height:16, background:'none', border:'none', color:hasChildren?'#5a5038':'transparent', cursor:'pointer', fontSize:'.7rem', transition:'transform .15s', transform:isExpanded?'rotate(90deg)':'none' }}>▶</button>
            <span style={{ fontSize:'.9rem', width:20, textAlign:'center' }}>{loc.icon}</span>
            <span style={{ flex:1, fontSize:'.88rem', color:'#e6dfc8' }}>{loc.name}</span>
            <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.54rem', color:'#5a5038', marginRight:'.3rem' }}>{loc.id.slice(-8)}</span>
            <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.54rem', background:'rgba(30,95,110,.2)', color:'#2d8fa5', border:'1px solid rgba(30,95,110,.4)', padding:'1px 6px', borderRadius:7, marginRight:'.3rem' }}>{loc.type}</span>
            <button onClick={()=>startEdit(loc)} style={{ background:'transparent', border:'1px solid rgba(201,168,76,.28)', color:'#9a8e72', padding:'.18rem .4rem', fontFamily:'"DM Mono",monospace', fontSize:'.53rem', borderRadius:2, cursor:'pointer' }}>✎</button>
            <button onClick={()=>setForm(prev=>({...prev,parentId:loc.id}))} style={{ background:'rgba(30,95,110,.15)', border:'1px solid rgba(30,95,110,.3)', color:'#2d8fa5', padding:'.18rem .4rem', fontFamily:'"DM Mono",monospace', fontSize:'.53rem', borderRadius:2, cursor:'pointer' }}>+ Child</button>
            <button onClick={()=>remove(loc.id)} style={{ background:'rgba(139,26,46,.15)', border:'1px solid rgba(139,26,46,.3)', color:'#f08090', padding:'.18rem .4rem', fontFamily:'"DM Mono",monospace', fontSize:'.53rem', borderRadius:2, cursor:'pointer' }}>✕</button>
          </div>
          {isExpanded && renderTree(loc.id, depth+1)}
        </div>
      )
    })
  }

  const flatLocs = (pid: string|null=null, depth=0): (Location&{depth:number})[] => {
    const ns = locations.filter(l=>l.parent_id===pid)
    const r: (Location&{depth:number})[] = []
    ns.forEach(n=>{r.push({...n,depth});r.push(...flatLocs(n.id,depth+1))})
    return r
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.2rem', paddingBottom:'.9rem', borderBottom:'1px solid rgba(201,168,76,.12)' }}>
        <div>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', letterSpacing:'.16em', color:'#5a5038', textTransform:'uppercase', marginBottom:'.18rem' }}>Management</div>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.5rem', fontWeight:700, color:'#c9a84c' }}>📍 Location Manager</h1>
        </div>
      </div>
      <p style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#5a5038', marginBottom:'1rem', letterSpacing:'.06em' }}>
        Build a nested hierarchy: Building → Room → Area → Shelf/Bin. Assign items to any level.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.2rem' }}>
        {/* Tree */}
        <div style={{ background:'#0a0806', border:'1px solid rgba(201,168,76,.12)', borderRadius:3, padding:'.5rem 0' }}>
          {locations.filter(l=>!l.parent_id).length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem', color:'#5a5038', fontFamily:'"DM Mono",monospace', fontSize:'.65rem' }}>No locations yet. Add your first location →</div>
          ) : renderTree(null, 0)}
        </div>

        {/* Add / Edit form */}
        <div style={{ background:'linear-gradient(145deg,#221c12,#181410)', border:'1px solid rgba(201,168,76,.28)', borderRadius:3, padding:'1rem', alignSelf:'start' }}>
          <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1rem', color:'#c9a84c', marginBottom:'.8rem' }}>
            {editId ? '✎ Edit Location' : '+ Add Location'}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'.7rem' }}>
            <div>
              <label style={{ fontFamily:'"DM Mono",monospace', fontSize:'.57rem', letterSpacing:'.14em', color:'#8a6f30', display:'block', marginBottom:'.22rem', textTransform:'uppercase' }}>Name *</label>
              <input value={form.name} onChange={e=>setForm(prev=>({...prev,name:e.target.value}))}
                placeholder="e.g. Costume Shop, Rack A…"
                style={{ width:'100%', background:'#0d0a06', border:'1px solid rgba(201,168,76,.28)', color:'#f0ead8', padding:'.42rem .6rem', fontFamily:'"Crimson Pro",serif', fontSize:'.93rem', borderRadius:2, outline:'none' }} />
            </div>
            <div>
              <label style={{ fontFamily:'"DM Mono",monospace', fontSize:'.57rem', letterSpacing:'.14em', color:'#8a6f30', display:'block', marginBottom:'.22rem', textTransform:'uppercase' }}>Type</label>
              <select value={form.type} onChange={e=>setForm(prev=>({...prev,type:e.target.value}))}
                style={{ width:'100%', background:'#0d0a06', border:'1px solid rgba(201,168,76,.28)', color:'#f0ead8', padding:'.42rem .6rem', fontFamily:'"DM Mono",monospace', fontSize:'.65rem', borderRadius:2, outline:'none' }}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily:'"DM Mono",monospace', fontSize:'.57rem', letterSpacing:'.14em', color:'#8a6f30', display:'block', marginBottom:'.22rem', textTransform:'uppercase' }}>Icon</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem' }}>
                {ICONS.map(ic => (
                  <button key={ic} onClick={()=>setForm(prev=>({...prev,icon:ic}))}
                    style={{ width:28, height:28, border:`1px solid ${form.icon===ic?'#c9a84c':'rgba(201,168,76,.2)'}`, background:form.icon===ic?'rgba(201,168,76,.15)':'#0a0806', borderRadius:3, cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>{ic}</button>
                ))}
              </div>
            </div>
            {!editId && (
              <div>
                <label style={{ fontFamily:'"DM Mono",monospace', fontSize:'.57rem', letterSpacing:'.14em', color:'#8a6f30', display:'block', marginBottom:'.22rem', textTransform:'uppercase' }}>Parent Location</label>
                <select value={form.parentId} onChange={e=>setForm(prev=>({...prev,parentId:e.target.value}))}
                  style={{ width:'100%', background:'#0d0a06', border:'1px solid rgba(201,168,76,.28)', color:'#f0ead8', padding:'.42rem .6rem', fontFamily:'"DM Mono",monospace', fontSize:'.63rem', borderRadius:2, outline:'none' }}>
                  <option value="">— Top Level —</option>
                  {flatLocs().map(l=><option key={l.id} value={l.id}>{'· '.repeat(l.depth)}{l.icon} {l.name}</option>)}
                </select>
              </div>
            )}
            {form.parentId && !editId && (
              <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#2d8fa5', padding:'.3rem .5rem', background:'rgba(30,95,110,.1)', border:'1px solid rgba(30,95,110,.3)', borderRadius:2 }}>
                Under: {getPath(form.parentId)}
              </div>
            )}
            <div style={{ display:'flex', gap:'.4rem', marginTop:'.2rem' }}>
              {editId && <button onClick={()=>{setEditId(null);setForm({name:'',type:'Area',icon:'📦',parentId:''})}} style={{ flex:1, background:'transparent', border:'1px solid rgba(201,168,76,.28)', color:'#9a8e72', padding:'.4rem', fontFamily:'"DM Mono",monospace', fontSize:'.6rem', letterSpacing:'.1em', textTransform:'uppercase', borderRadius:2, cursor:'pointer' }}>Cancel</button>}
              <button onClick={save} style={{ flex:1, background:'#c9a84c', color:'#0e0c08', border:'none', padding:'.4rem', fontFamily:'"DM Mono",monospace', fontSize:'.6rem', letterSpacing:'.1em', textTransform:'uppercase', fontWeight:500, borderRadius:2, cursor:'pointer' }}>
                {editId ? 'Update' : 'Add Location'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
