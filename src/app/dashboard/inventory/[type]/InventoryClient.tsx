'use client'
import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { InventoryItem, Location } from '@/lib/types'

interface Props {
  initialItems: InventoryItem[]
  itemType: string
  facilityId: string
  locations: Location[]
  dropdowns: Record<string, string[]>
  productions: string[]
}

const TYPE_ICON: Record<string, string> = { Costume:'👗', Prop:'🎭', Wig:'💈', Jewelry:'💍', Equipment:'💡' }
const STATUS_CLASS: Record<string, string> = { Available:'s-av', 'Checked Out':'s-out', 'In Repair':'s-rep', 'In Storage':'s-sto', 'On Loan':'s-loan' }

const DEFAULT_LISTS: Record<string, string[]> = {
  statuses: ['Available','Checked Out','In Repair','In Storage','On Loan','Retired'],
  conditions: ['Excellent','Very Good','Good','Fair','Poor'],
  costumeTypes: ['Accessories','Blouse','Cape','Coat','Crown/Tiara','Dance Dress','Hat','Jacket','Pants/Slacks','Robe','Shirt','Shoes','Skirt','Tights','Tutu','Unitard/Jumpsuit','Vest','Wedding Dress'],
  propTypes: ['Furniture','Hand Prop','Set Piece','Weapon','Flat/Backdrop','Dressing','Personal Prop'],
  timePeriods: ['Ancient','Medieval','Renaissance','Victorian','Edwardian','1920s','1950s','1960s','Contemporary','Fantasy','Sci-Fi'],
  fabrics: ['Brocade','Canvas','Chiffon','Cotton','Jersey','Lace','Leather','Lycra','Organza','Satin','Silk','Taffeta','Velvet','Wool','Synthetic'],
  colors: ['Black','Blue','Bronze','Brown','Burgundy','Cream','Gold','Green','Grey','Orange','Pink','Purple','Red','Silver','Tan','Turquoise','White','Yellow'],
  cleaningCodes: ['Hand Wash','Machine Wash','Dry Clean Only','Spot Clean'],
  sources: ['Built In-House','Purchased New','Purchased Used','Donated','Thrift Store'],
  specialEffects: ['None','Breakaway','Light-Up','Sound Effect','Blood Effect','Remote Control'],
}

function getList(dropdowns: Record<string, string[]>, key: string): string[] {
  return dropdowns[key] || DEFAULT_LISTS[key] || []
}

function getLocPath(locations: Location[], id: string | null | undefined): string {
  if (!id) return ''
  const parts: string[] = []
  let cur = locations.find(l => l.id === id)
  while (cur) {
    parts.unshift(cur.name)
    cur = cur.parent_id ? locations.find(l => l.id === cur!.parent_id) : undefined
    if (parts.length > 5) break
  }
  return parts.join(' › ')
}

function flatLocs(locations: Location[], parentId: string | null = null, depth = 0): (Location & { depth: number })[] {
  const nodes = locations.filter(l => l.parent_id === parentId)
  const result: (Location & { depth: number })[] = []
  nodes.forEach(n => {
    result.push({ ...n, depth })
    result.push(...flatLocs(locations, n.id, depth + 1))
  })
  return result
}

export default function InventoryClient({ initialItems, itemType, facilityId, locations, dropdowns, productions }: Props) {
  const supabase = createClient()
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [modal, setModal] = useState<'none' | 'add' | 'edit' | 'view'>('none')
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [uploadedPhotos, setUploadedPhotos] = useState<{ file: File; previewUrl: string; label: string; primary: boolean }[]>([])
  const [existingPhotos, setExistingPhotos] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState<Partial<InventoryItem>>({})

  const isCostume = itemType === 'Costume'
  const isProp = itemType === 'Prop'

  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.tag_id.toLowerCase().includes(q) || (item.color || '').toLowerCase().includes(q)
    const matchStatus = !filterStatus || item.status === filterStatus
    return matchSearch && matchStatus
  })

  function openAdd() {
    setEditItem(null)
    setForm({ item_type: itemType as any, status: 'Available', condition: 'Good', qty: 1, facility_id: facilityId })
    setUploadedPhotos([])
    setExistingPhotos([])
    setActiveTab('basic')
    setModal('add')
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item)
    setForm({ ...item })
    setUploadedPhotos([])
    setExistingPhotos(item.photos || [])
    setActiveTab('basic')
    setModal('edit')
  }

  function openView(item: InventoryItem) {
    setEditItem(item)
    setModal('view')
  }

  function closeModal() { setModal('none'); setEditItem(null) }

  function setF(key: string, val: any) { setForm(prev => ({ ...prev, [key]: val })) }

  async function handlePhotoFiles(files: FileList | null) {
    if (!files) return
    const toAdd = Array.from(files).slice(0, 6 - uploadedPhotos.length - existingPhotos.length)
    const newPhotos = await Promise.all(toAdd.map(file => new Promise<{ file: File; previewUrl: string; label: string; primary: boolean }>(resolve => {
      const reader = new FileReader()
      reader.onload = e => resolve({ file, previewUrl: e.target?.result as string, label: file.name.replace(/\.[^.]+$/, ''), primary: uploadedPhotos.length === 0 && existingPhotos.length === 0 })
      reader.readAsDataURL(file)
    })))
    setUploadedPhotos(prev => [...prev, ...newPhotos])
  }

  async function removeExistingPhoto(photoId: string) {
    await supabase.from('item_photos').delete().eq('id', photoId)
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  async function saveForm() {
    if (!form.name?.trim() || !form.tag_id?.trim()) { alert('Name and Tag ID are required'); return }
    setSaving(true)
    try {
      const payload: any = {
        facility_id: facilityId,
        tag_id: form.tag_id?.trim(),
        name: form.name?.trim(),
        item_type: itemType,
        status: form.status || 'Available',
        condition: form.condition || 'Good',
        needs_repair: form.needs_repair || false,
        repair_description: form.repair_description || null,
        ok_to_loan: form.ok_to_loan || false,
        rental_fee: form.rental_fee ? parseFloat(String(form.rental_fee)) : null,
        total_cost: form.total_cost ? parseFloat(String(form.total_cost)) : null,
        replacement_cost: form.replacement_cost ? parseFloat(String(form.replacement_cost)) : null,
        description: form.description || null,
        notes: form.notes || null,
        storage_location_id: form.storage_location_id || null,
        current_location_id: form.current_location_id || null,
        date_entered_db: form.date_entered_db || new Date().toISOString().split('T')[0],
        used_in_productions: form.used_in_productions || [],
        // Costume
        costume_type: form.costume_type || null,
        costume_group: form.costume_group || null,
        time_period: form.time_period || null,
        gender: form.gender || null,
        adult_child: form.adult_child || 'Adult',
        size: form.size || null,
        color: form.color || null,
        colors: form.colors || [],
        color_pattern: form.color_pattern || null,
        fabric: form.fabric || null,
        design_style: form.design_style || null,
        special_effects: form.special_effects || null,
        cleaning_code: form.cleaning_code || null,
        hem: form.hem || null,
        sleeves_detail: form.sleeves_detail || null,
        costume_designer: form.costume_designer || null,
        source: form.source || null,
        date_acquired: form.date_acquired || null,
        disposable: form.disposable || false,
        multiple: form.multiple || false,
        qty: form.qty || 1,
        meas_chest: form.meas_chest || null, meas_waist: form.meas_waist || null,
        meas_hips: form.meas_hips || null, meas_girth: form.meas_girth || null,
        meas_neck: form.meas_neck || null, meas_sleeves: form.meas_sleeves || null,
        meas_inseam: form.meas_inseam || null, meas_outseam: form.meas_outseam || null,
        meas_neck_to_waist: form.meas_neck_to_waist || null, meas_waist_to_hem: form.meas_waist_to_hem || null,
        meas_waist_to_floor: form.meas_waist_to_floor || null, meas_hat_circ: form.meas_hat_circ || null,
        meas_shoe_size: form.meas_shoe_size || null, meas_dress_size: form.meas_dress_size || null,
        meas_bra_size: form.meas_bra_size || null,
        // Prop
        prop_type: form.prop_type || null,
        prop_item_name: form.prop_item_name || null,
        material: form.material || null,
        prop_maker: form.prop_maker || null,
        prop_designer: form.prop_designer || null,
        borrowed_from: form.borrowed_from || null,
        due_back_to_owner: form.due_back_to_owner || null,
        is_on_loan: form.is_on_loan || false,
        dim_h: form.dim_h || null, dim_w: form.dim_w || null,
        dim_d: form.dim_d || null, dim_wt: form.dim_wt || null,
        can_be_painted: form.can_be_painted || false,
        can_be_stood_on: form.can_be_stood_on || false,
        is_functional: form.is_functional || false,
        can_be_controlled_remotely: form.can_be_controlled_remotely || false,
        part_of_package: form.part_of_package || false,
        package_details: form.package_details || null,
      }

      let itemId = editItem?.id
      if (modal === 'edit' && itemId) {
        const { error } = await supabase.from('inventory_items').update(payload).eq('id', itemId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('inventory_items').insert(payload).select().single()
        if (error) throw error
        itemId = data.id
      }

      // Upload photos
      for (let i = 0; i < uploadedPhotos.length; i++) {
        const p = uploadedPhotos[i]
        const ext = p.file.name.split('.').pop()
        const path = `${facilityId}/${itemId}/${Date.now()}-${i}.${ext}`
        const { error: upErr } = await supabase.storage.from('item-photos').upload(path, p.file)
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('item-photos').getPublicUrl(path)
          await supabase.from('item_photos').insert({
            item_id: itemId, facility_id: facilityId,
            storage_path: path, public_url: urlData.publicUrl,
            label: p.label, is_primary: p.primary,
            sort_order: existingPhotos.length + i
          })
        }
      }

      // Reload items
      const { data: fresh } = await supabase
        .from('inventory_items')
        .select('*, photos:item_photos(id,storage_path,public_url,label,is_primary,sort_order), storage_location:locations!storage_location_id(id,name,type,icon,parent_id)')
        .eq('facility_id', facilityId)
        .eq('item_type', itemType)
        .order('tag_id')
      setItems(fresh || [])
      closeModal()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return
    await supabase.from('inventory_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const flatLocations = flatLocs(locations)

  // ── RENDER ──
  return (
    <div>
      {/* Page header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.2rem', paddingBottom:'.9rem', borderBottom:'1px solid rgba(201,168,76,.12)' }}>
        <div>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', letterSpacing:'.16em', color:'#5a5038', textTransform:'uppercase', marginBottom:'.18rem' }}>My Inventory</div>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.5rem', fontWeight:700, color:'#c9a84c' }}>{TYPE_ICON[itemType]} {itemType}s</h1>
        </div>
        <button onClick={openAdd} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.42rem .85rem', background:'#c9a84c', color:'#231e14', fontWeight:500, border:'none', borderRadius:2, cursor:'pointer' }}>
          + Add {itemType}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', gap:'.6rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        {[
          { l:'Total', v:items.length, c:'#6aaa5a' },
          { l:'Available', v:items.filter(i=>i.status==='Available').length, c:'#2d8fa5' },
          { l:'Checked Out', v:items.filter(i=>i.status==='Checked Out').length, c:'#c4344e' },
          { l:'Need Repair', v:items.filter(i=>i.needs_repair).length, c:'#e8943a' },
        ].map(s => (
          <div key={s.l} style={{ background:'linear-gradient(135deg,#2e2618,#252018)', border:'1px solid rgba(201,168,76,.12)', borderRadius:3, padding:'.6rem .8rem', flex:1, minWidth:90, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:s.c, opacity:.55 }} />
            <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.5rem', fontWeight:900, color:s.c, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.53rem', letterSpacing:'.1em', color:'#5a5038', textTransform:'uppercase', marginTop:'.12rem' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:'.55rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <span style={{ position:'absolute', left:'.6rem', top:'50%', transform:'translateY(-50%)', color:'#5a5038', fontSize:'.75rem', pointerEvents:'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${itemType}s…`}
            style={{ width:'100%', background:'#231e14', border:'1px solid rgba(201,168,76,.28)', color:'#f0ead8', padding:'.42rem .7rem .42rem 1.9rem', fontFamily:'"Crimson Pro",serif', fontSize:'.92rem', borderRadius:2, outline:'none' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background:'#231e14', border:'1px solid rgba(201,168,76,.28)', color:'#f0ead8', padding:'.42rem .65rem', fontFamily:'"DM Mono",monospace', fontSize:'.63rem', borderRadius:2, outline:'none' }}>
          <option value="">All Statuses</option>
          {getList(dropdowns, 'statuses').map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ display:'flex', border:'1px solid rgba(201,168,76,.28)', borderRadius:2, overflow:'hidden' }}>
          {(['grid','list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view===v?'rgba(201,168,76,.12)':'transparent', border:'none', color: view===v?'#c9a84c':'#5a5038', padding:'.38rem .55rem', cursor:'pointer', fontSize:'.85rem' }}>
              {v === 'grid' ? '⊞' : '☰'}
            </button>
          ))}
        </div>
      </div>

      {/* Item count */}
      <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#5a5038', marginBottom:'.7rem' }}>
        Showing {filtered.length} of {items.length} item{items.length !== 1 ? 's' : ''}
      </div>

      {/* Grid / List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'#5a5038' }}>
          <div style={{ fontSize:'3rem', opacity:.3, marginBottom:'.7rem' }}>{TYPE_ICON[itemType]}</div>
          <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.15rem', marginBottom:'.25rem' }}>No items found</h3>
          <p style={{ fontSize:'.88rem' }}>Try adjusting your search, or <button onClick={openAdd} style={{ background:'none', border:'none', color:'#c9a84c', cursor:'pointer', fontFamily:'inherit', fontSize:'inherit', textDecoration:'underline' }}>add a new {itemType.toLowerCase()}</button>.</p>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:'.9rem' }}>
          {filtered.map(item => <ItemCard key={item.id} item={item} locations={locations} onView={openView} onEdit={openEdit} onDelete={deleteItem} />)}
        </div>
      ) : (
        <div style={{ border:'1px solid rgba(201,168,76,.12)', borderRadius:3, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.83rem' }}>
            <thead>
              <tr>
                {['Tag ID','Name',isCostume?'Type':'Type','Period','Condition','Status','Location',''].map(h => (
                  <th key={h} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.57rem', letterSpacing:'.14em', textTransform:'uppercase', color:'#8a6f30', padding:'.55rem .75rem', borderBottom:'1px solid rgba(201,168,76,.28)', background:'#231e14', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => openView(item)} style={{ cursor:'pointer' }}>
                  <td style={{ padding:'.52rem .75rem', borderBottom:'1px solid rgba(201,168,76,.07)', fontFamily:'"DM Mono",monospace', fontSize:'.65rem', color:'#9a8e72' }}>{item.tag_id}</td>
                  <td style={{ padding:'.52rem .75rem', borderBottom:'1px solid rgba(201,168,76,.07)', color:'#e6dfc8', fontWeight:600 }}>{item.name}</td>
                  <td style={{ padding:'.52rem .75rem', borderBottom:'1px solid rgba(201,168,76,.07)', color:'#9a8e72' }}>{item.costume_type || item.prop_type || '—'}</td>
                  <td style={{ padding:'.52rem .75rem', borderBottom:'1px solid rgba(201,168,76,.07)', color:'#9a8e72' }}>{item.time_period || '—'}</td>
                  <td style={{ padding:'.52rem .75rem', borderBottom:'1px solid rgba(201,168,76,.07)', color:'#9a8e72' }}>{item.condition}</td>
                  <td style={{ padding:'.52rem .75rem', borderBottom:'1px solid rgba(201,168,76,.07)' }}>
                    <span className={`icard-status ${STATUS_CLASS[item.status] || 's-av'}`} style={{ position:'static', display:'inline-block', fontFamily:'"DM Mono",monospace', fontSize:'.54rem', textTransform:'uppercase', padding:'2px 6px', borderRadius:2 }}>{item.status}</span>
                  </td>
                  <td style={{ padding:'.52rem .75rem', borderBottom:'1px solid rgba(201,168,76,.07)', color:'#2d8fa5', fontSize:'.78rem' }}>{getLocPath(locations, item.storage_location_id) || '—'}</td>
                  <td style={{ padding:'.52rem .75rem', borderBottom:'1px solid rgba(201,168,76,.07)' }}>
                    <button onClick={e => { e.stopPropagation(); openEdit(item) }} style={{ background:'transparent', border:'1px solid rgba(201,168,76,.28)', color:'#9a8e72', padding:'.2rem .5rem', fontFamily:'"DM Mono",monospace', fontSize:'.55rem', borderRadius:2, cursor:'pointer' }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL ── */}
      {modal !== 'none' && (
        <div onClick={e => e.target === e.currentTarget && closeModal()}
          style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.9)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', backdropFilter:'blur(4px)', padding:'1.5rem', overflowY:'auto' }}>
          <div style={{ background:'linear-gradient(145deg,#302818,#282014)', border:'1px solid #c9a84c', borderRadius:4, width:'100%', maxWidth:860, boxShadow:'0 28px 70px rgba(8,6,3,.65)', flexShrink:0 }}>
            {/* Modal header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.3rem', borderBottom:'1px solid rgba(201,168,76,.28)', background:'rgba(14,12,8,.5)', position:'sticky', top:0, zIndex:2 }}>
              <h2 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.2rem', fontWeight:700, color:'#c9a84c' }}>
                {modal === 'view' ? `${TYPE_ICON[itemType]} ${editItem?.name}` : modal === 'edit' ? `✎ Edit: ${editItem?.name}` : `+ New ${itemType}`}
              </h2>
              <button onClick={closeModal} style={{ background:'none', border:'none', color:'#9a8e72', fontSize:'1.25rem', cursor:'pointer', lineHeight:1 }}>✕</button>
            </div>

            {modal === 'view' ? (
              <ViewPanel item={editItem!} locations={locations} onEdit={() => { setForm({...editItem!}); setExistingPhotos(editItem!.photos||[]); setActiveTab('basic'); setModal('edit') }} />
            ) : (
              <>
                {/* Tabs */}
                <div style={{ display:'flex', borderBottom:'1px solid rgba(201,168,76,.28)', overflowX:'auto' }}>
                  {['basic','details', ...(isCostume?['measurements']:[]), ...(isProp?['prop-details']:[]), 'photos','location','production','financial'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                      fontFamily:'"DM Mono",monospace', fontSize:'.58rem', letterSpacing:'.1em', textTransform:'uppercase',
                      padding:'.5rem .9rem', cursor:'pointer', border:'none', background:activeTab===tab?'rgba(201,168,76,.1)':'transparent',
                      borderBottom: activeTab===tab ? '2px solid #c9a84c' : '2px solid transparent',
                      color: activeTab===tab ? '#e8d49a' : '#c8b88a', whiteSpace:'nowrap', transition:'all .15s'
                    }}>
                      {tab === 'prop-details' ? 'Prop Details' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div style={{ padding:'1.3rem', background:'#282014' }}>
                  {/* BASIC TAB */}
                  {activeTab === 'basic' && (
                    <FormGrid cols={2}>
                      <FF label="Tag ID *"><input value={form.tag_id||''} onChange={e=>setF('tag_id',e.target.value)} placeholder="e.g. CST-1001" /></FF>
                      <FF label="Name *"><input value={form.name||''} onChange={e=>setF('name',e.target.value)} placeholder="Item name" /></FF>
                      <FF label="Status">
                        <select value={form.status||'Available'} onChange={e=>setF('status',e.target.value)}>
                          {getList(dropdowns,'statuses').map(s=><option key={s}>{s}</option>)}
                        </select>
                      </FF>
                      <FF label="Condition">
                        <select value={form.condition||'Good'} onChange={e=>setF('condition',e.target.value)}>
                          {getList(dropdowns,'conditions').map(s=><option key={s}>{s}</option>)}
                        </select>
                      </FF>
                      {isCostume && <>
                        <FF label="Costume Type">
                          <select value={form.costume_type||''} onChange={e=>setF('costume_type',e.target.value)}>
                            <option value="">—</option>
                            {getList(dropdowns,'costumeTypes').map(s=><option key={s}>{s}</option>)}
                          </select>
                        </FF>
                        <FF label="Time Period">
                          <select value={form.time_period||''} onChange={e=>setF('time_period',e.target.value)}>
                            <option value="">—</option>
                            {getList(dropdowns,'timePeriods').map(s=><option key={s}>{s}</option>)}
                          </select>
                        </FF>
                        <FF label="Gender">
                          <select value={form.gender||''} onChange={e=>setF('gender',e.target.value)}>
                            {['','Male','Female','Unisex','Child-Male','Child-Female','Child-Unisex'].map(s=><option key={s}>{s}</option>)}
                          </select>
                        </FF>
                        <FF label="Size"><input value={form.size||''} onChange={e=>setF('size',e.target.value)} placeholder="e.g. 8, M, 42R" /></FF>
                        <FF label="Color"><input value={form.color||''} onChange={e=>setF('color',e.target.value)} placeholder="e.g. Ivory/Gold" /></FF>
                        <FF label="Fabric">
                          <select value={form.fabric||''} onChange={e=>setF('fabric',e.target.value)}>
                            <option value="">—</option>
                            {getList(dropdowns,'fabrics').map(s=><option key={s}>{s}</option>)}
                          </select>
                        </FF>
                      </>}
                      {isProp && <>
                        <FF label="Prop Type">
                          <select value={form.prop_type||''} onChange={e=>setF('prop_type',e.target.value)}>
                            <option value="">—</option>
                            {getList(dropdowns,'propTypes').map(s=><option key={s}>{s}</option>)}
                          </select>
                        </FF>
                        <FF label="Time Period">
                          <select value={form.time_period||''} onChange={e=>setF('time_period',e.target.value)}>
                            <option value="">—</option>
                            {getList(dropdowns,'timePeriods').map(s=><option key={s}>{s}</option>)}
                          </select>
                        </FF>
                        <FF label="Color"><input value={form.color||''} onChange={e=>setF('color',e.target.value)} placeholder="e.g. Gold, Brown" /></FF>
                        <FF label="Material"><input value={form.material||''} onChange={e=>setF('material',e.target.value)} placeholder="e.g. Wood, Metal" /></FF>
                      </>}
                      <div style={{ gridColumn:'1/-1', display:'flex', gap:'1.2rem', marginTop:'.3rem' }}>
                        <label style={{ display:'flex', alignItems:'center', gap:'.4rem', cursor:'pointer', fontSize:'.88rem', color:'#e6dfc8' }}>
                          <input type="checkbox" checked={!!form.needs_repair} onChange={e=>setF('needs_repair',e.target.checked)} style={{ accentColor:'#c9a84c', width:15, height:15 }} />Needs Repair
                        </label>
                        <label style={{ display:'flex', alignItems:'center', gap:'.4rem', cursor:'pointer', fontSize:'.88rem', color:'#e6dfc8' }}>
                          <input type="checkbox" checked={!!form.ok_to_loan} onChange={e=>setF('ok_to_loan',e.target.checked)} style={{ accentColor:'#c9a84c', width:15, height:15 }} />OK to Loan/Rent
                        </label>
                      </div>
                      {form.needs_repair && <FF label="Repair Description" full><input value={form.repair_description||''} onChange={e=>setF('repair_description',e.target.value)} placeholder="Describe repair needed…" /></FF>}
                    </FormGrid>
                  )}

                  {/* DETAILS TAB */}
                  {activeTab === 'details' && (
                    <FormGrid cols={2}>
                      <FF label="Description" full><textarea value={form.description||''} onChange={e=>setF('description',e.target.value)} rows={3} /></FF>
                      <FF label="Notes" full><textarea value={form.notes||''} onChange={e=>setF('notes',e.target.value)} rows={2} /></FF>
                      {isCostume && <>
                        <FF label="Cleaning Code">
                          <select value={form.cleaning_code||''} onChange={e=>setF('cleaning_code',e.target.value)}>
                            <option value="">—</option>
                            {getList(dropdowns,'cleaningCodes').map(s=><option key={s}>{s}</option>)}
                          </select>
                        </FF>
                        <FF label="Special Effects">
                          <select value={form.special_effects||''} onChange={e=>setF('special_effects',e.target.value)}>
                            <option value="">—</option>
                            {getList(dropdowns,'specialEffects').map(s=><option key={s}>{s}</option>)}
                          </select>
                        </FF>
                        <FF label="Costume Designer"><input value={form.costume_designer||''} onChange={e=>setF('costume_designer',e.target.value)} /></FF>
                        <FF label="Source">
                          <select value={form.source||''} onChange={e=>setF('source',e.target.value)}>
                            <option value="">—</option>
                            {getList(dropdowns,'sources').map(s=><option key={s}>{s}</option>)}
                          </select>
                        </FF>
                        <FF label="Date Acquired"><input type="date" value={form.date_acquired||''} onChange={e=>setF('date_acquired',e.target.value)} /></FF>
                        <FF label="Hem/Length"><input value={form.hem||''} onChange={e=>setF('hem',e.target.value)} placeholder="e.g. Floor length" /></FF>
                      </>}
                      {isProp && <>
                        <FF label="Prop Designer"><input value={form.prop_designer||''} onChange={e=>setF('prop_designer',e.target.value)} /></FF>
                        <FF label="Prop Maker"><input value={form.prop_maker||''} onChange={e=>setF('prop_maker',e.target.value)} /></FF>
                        <FF label="Source">
                          <select value={form.source||''} onChange={e=>setF('source',e.target.value)}>
                            <option value="">—</option>
                            {getList(dropdowns,'sources').map(s=><option key={s}>{s}</option>)}
                          </select>
                        </FF>
                        <FF label="Borrowed From"><input value={form.borrowed_from||''} onChange={e=>setF('borrowed_from',e.target.value)} /></FF>
                        <FF label="Due Back to Owner"><input type="date" value={form.due_back_to_owner||''} onChange={e=>setF('due_back_to_owner',e.target.value)} /></FF>
                        <div style={{ gridColumn:'1/-1', display:'flex', gap:'1.2rem', marginTop:'.3rem' }}>
                          {[['can_be_painted','Can Be Painted'],['can_be_stood_on','Can Be Stood On'],['is_functional','Is Functional'],['can_be_controlled_remotely','Remote Control']].map(([k,l]) => (
                            <label key={k} style={{ display:'flex', alignItems:'center', gap:'.4rem', cursor:'pointer', fontSize:'.85rem', color:'#e6dfc8' }}>
                              <input type="checkbox" checked={!!(form as any)[k]} onChange={e=>setF(k,e.target.checked)} style={{ accentColor:'#c9a84c', width:14, height:14 }} />{l}
                            </label>
                          ))}
                        </div>
                      </>}
                    </FormGrid>
                  )}

                  {/* MEASUREMENTS TAB */}
                  {activeTab === 'measurements' && isCostume && (
                    <div>
                      <p style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#9a8e72', marginBottom:'.8rem' }}>All measurements in inches unless noted</p>
                      <FormGrid cols={4}>
                        {[['meas_chest','Chest'],['meas_waist','Waist'],['meas_hips','Hips'],['meas_girth','Girth'],
                          ['meas_neck','Neck'],['meas_sleeves','Sleeve Len.'],['meas_inseam','Inseam'],['meas_outseam','Outseam'],
                          ['meas_neck_to_waist','Neck→Waist'],['meas_waist_to_hem','Waist→Hem'],['meas_waist_to_floor','Waist→Floor'],['meas_hat_circ','Hat Circ.'],
                          ['meas_shoe_size','Shoe Size'],['meas_dress_size','Dress Size'],['meas_bra_size','Bra Size'],
                        ].map(([k,l]) => (
                          <FF key={k} label={l}><input value={(form as any)[k]||''} onChange={e=>setF(k,e.target.value)} placeholder='—' /></FF>
                        ))}
                      </FormGrid>
                    </div>
                  )}

                  {/* PROP DETAILS TAB */}
                  {activeTab === 'prop-details' && isProp && (
                    <FormGrid cols={4}>
                      {[['dim_h','Height (H")'],['dim_w','Width (W")'],['dim_d','Depth (D")'],['dim_wt','Weight (lbs)']].map(([k,l]) => (
                        <FF key={k} label={l}><input value={(form as any)[k]||''} onChange={e=>setF(k,e.target.value)} placeholder="—" /></FF>
                      ))}
                      <FF label="Size Desc."><input value={form.size||''} onChange={e=>setF('size',e.target.value)} placeholder="e.g. Large" /></FF>
                      <FF label="Qty"><input type="number" min={1} value={form.qty||1} onChange={e=>setF('qty',parseInt(e.target.value))} /></FF>
                    </FormGrid>
                  )}

                  {/* PHOTOS TAB */}
                  {activeTab === 'photos' && (
                    <div>
                      <p style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#9a8e72', marginBottom:'1rem' }}>
                        Upload up to 6 photos. Check <span style={{color:'#c9a84c',fontWeight:600}}>Set as display photo</span> on the image you want shown on the item card.
                      </p>

                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'.8rem', marginBottom:'1rem' }}>

                        {existingPhotos.map((p: any, i: number) => (
                          <div key={p.id} style={{
                            borderRadius:3, overflow:'hidden',
                            border: p.is_primary ? '2px solid #c9a84c' : '1px solid rgba(201,168,76,.25)',
                            background:'#231e14',
                            boxShadow: p.is_primary ? '0 0 14px rgba(201,168,76,.3)' : 'none',
                            transition:'all .2s'
                          }}>
                            <div style={{ position:'relative', height:120, background:'#1a1610' }}>
                              {p.is_primary && (
                                <div style={{ position:'absolute', top:6, left:6, fontFamily:'"DM Mono",monospace', fontSize:'.48rem', letterSpacing:'.1em', background:'#c9a84c', color:'#231e14', padding:'2px 6px', borderRadius:2, zIndex:2, textTransform:'uppercase', fontWeight:700 }}>
                                  ★ Display Photo
                                </div>
                              )}
                              {p.public_url
                                ? <img src={p.public_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem' }}>📷</div>
                              }
                              <button onClick={() => removeExistingPhoto(p.id)} title="Delete photo"
                                style={{ position:'absolute', top:6, right:6, background:'rgba(139,26,46,.9)', border:'none', color:'#fff', width:20, height:20, borderRadius:10, cursor:'pointer', fontSize:'.65rem', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>✕</button>
                            </div>
                            <div style={{ padding:'.3rem .5rem', fontFamily:'"DM Mono",monospace', fontSize:'.55rem', color:'#c8b88a', borderTop:'1px solid rgba(201,168,76,.12)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {p.label || `Photo ${i+1}`}
                            </div>
                            <label style={{ display:'flex', alignItems:'center', gap:'.4rem', padding:'.3rem .5rem .4rem', cursor:'pointer', borderTop:'1px solid rgba(201,168,76,.08)', background: p.is_primary ? 'rgba(201,168,76,.1)' : 'transparent' }}>
                              <input
                                type="checkbox"
                                checked={!!p.is_primary}
                                onChange={() => {
                                  setExistingPhotos(prev => prev.map((ep: any) => ({ ...ep, is_primary: ep.id === p.id })))
                                  setUploadedPhotos(prev => prev.map(up => ({ ...up, primary: false })))
                                }}
                                style={{ accentColor:'#c9a84c', width:13, height:13, cursor:'pointer', flexShrink:0 }}
                              />
                              <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.54rem', color: p.is_primary ? '#c9a84c' : '#9a8e72', letterSpacing:'.05em' }}>
                                Set as display photo
                              </span>
                            </label>
                          </div>
                        ))}

                        {uploadedPhotos.map((p, i) => (
                          <div key={i} style={{
                            borderRadius:3, overflow:'hidden',
                            border: p.primary ? '2px solid #c9a84c' : '1px solid rgba(201,168,76,.25)',
                            background:'#231e14',
                            boxShadow: p.primary ? '0 0 14px rgba(201,168,76,.3)' : 'none',
                            transition:'all .2s'
                          }}>
                            <div style={{ position:'relative', height:120 }}>
                              {p.primary && (
                                <div style={{ position:'absolute', top:6, left:6, fontFamily:'"DM Mono",monospace', fontSize:'.48rem', letterSpacing:'.1em', background:'#c9a84c', color:'#231e14', padding:'2px 6px', borderRadius:2, zIndex:2, textTransform:'uppercase', fontWeight:700 }}>
                                  ★ Display Photo
                                </div>
                              )}
                              <img src={p.previewUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                              <button onClick={() => setUploadedPhotos(prev => prev.filter((_,j)=>j!==i))} title="Remove"
                                style={{ position:'absolute', top:6, right:6, background:'rgba(139,26,46,.9)', border:'none', color:'#fff', width:20, height:20, borderRadius:10, cursor:'pointer', fontSize:'.65rem', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>✕</button>
                            </div>
                            <div style={{ padding:'.3rem .5rem', fontFamily:'"DM Mono",monospace', fontSize:'.55rem', color:'#c8b88a', borderTop:'1px solid rgba(201,168,76,.12)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {p.label || `New Photo ${i+1}`}
                            </div>
                            <label style={{ display:'flex', alignItems:'center', gap:'.4rem', padding:'.3rem .5rem .4rem', cursor:'pointer', borderTop:'1px solid rgba(201,168,76,.08)', background: p.primary ? 'rgba(201,168,76,.1)' : 'transparent' }}>
                              <input
                                type="checkbox"
                                checked={!!p.primary}
                                onChange={() => {
                                  setUploadedPhotos(prev => prev.map((up, j) => ({ ...up, primary: j === i })))
                                  setExistingPhotos(prev => prev.map((ep: any) => ({ ...ep, is_primary: false })))
                                }}
                                style={{ accentColor:'#c9a84c', width:13, height:13, cursor:'pointer', flexShrink:0 }}
                              />
                              <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.54rem', color: p.primary ? '#c9a84c' : '#9a8e72', letterSpacing:'.05em' }}>
                                Set as display photo
                              </span>
                            </label>
                          </div>
                        ))}

                        {(existingPhotos.length + uploadedPhotos.length) < 6 && (
                          <div onClick={() => fileInputRef.current?.click()} style={{
                            height:180, display:'flex', flexDirection:'column', alignItems:'center',
                            justifyContent:'center', gap:'.5rem', cursor:'pointer', color:'#5a5038',
                            border:'2px dashed rgba(201,168,76,.22)', borderRadius:3, background:'#1a1610',
                            transition:'all .18s'
                          }}>
                            <div style={{ fontSize:'2rem' }}>＋</div>
                            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.58rem', letterSpacing:'.08em', textTransform:'uppercase' }}>Add Photo</div>
                          </div>
                        )}
                      </div>

                      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e => handlePhotoFiles(e.target.files)} style={{ display:'none' }} />
                      <button onClick={() => fileInputRef.current?.click()} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.42rem .85rem', background:'transparent', color:'#c8b88a', border:'1px solid rgba(201,168,76,.35)', borderRadius:2, cursor:'pointer' }}>
                        📂 Browse Files
                      </button>
                      {(existingPhotos.length + uploadedPhotos.length) === 0 && (
                        <p style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#3a3020', marginTop:'.8rem' }}>No photos yet. Click above or browse to add images.</p>
                      )}
                    </div>
                  )}
                  {/* LOCATION TAB */}
                  {activeTab === 'location' && (
                    <FormGrid cols={2}>
                      <FF label="Storage Location (Primary)" full>
                        <select value={form.storage_location_id||''} onChange={e=>setF('storage_location_id',e.target.value)}>
                          <option value="">— Not Set —</option>
                          {flatLocations.map(l => <option key={l.id} value={l.id}>{'· '.repeat(l.depth)}{l.icon} {l.name}</option>)}
                        </select>
                      </FF>
                      <FF label="Current Location" full>
                        <select value={form.current_location_id||''} onChange={e=>setF('current_location_id',e.target.value)}>
                          <option value="">— Same as Storage —</option>
                          {flatLocations.map(l => <option key={l.id} value={l.id}>{'· '.repeat(l.depth)}{l.icon} {l.name}</option>)}
                        </select>
                      </FF>
                      <FF label="Date Entered in DB">
                        <input type="date" value={form.date_entered_db||new Date().toISOString().split('T')[0]} onChange={e=>setF('date_entered_db',e.target.value)} />
                      </FF>
                    </FormGrid>
                  )}

                  {/* PRODUCTION TAB */}
                  {activeTab === 'production' && (
                    <div>
                      <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', letterSpacing:'.14em', color:'#c9a84c', textTransform:'uppercase', marginBottom:'.8rem', fontWeight:500 }}>Productions Used In</div>

                      {/* Existing productions as checkboxes */}
                      {productions.length > 0 && (
                        <div style={{ marginBottom:'1rem' }}>
                          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.58rem', color:'#9a8e72', marginBottom:'.5rem', letterSpacing:'.06em' }}>Select from existing productions:</div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'.3rem' }}>
                            {productions.map(prod => {
                              const checked = (form.used_in_productions || []).includes(prod)
                              return (
                                <label key={prod} style={{ display:'flex', alignItems:'center', gap:'.45rem', padding:'.4rem .6rem', cursor:'pointer', borderRadius:2, border:`1px solid ${checked ? 'rgba(201,168,76,.4)' : 'rgba(201,168,76,.12)'}`, background: checked ? 'rgba(201,168,76,.08)' : 'transparent', transition:'all .15s' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const cur = form.used_in_productions || []
                                      setF('used_in_productions', checked ? cur.filter((x:string) => x !== prod) : [...cur, prod])
                                    }}
                                    style={{ accentColor:'#c9a84c', width:13, height:13, flexShrink:0 }}
                                  />
                                  <span style={{ fontFamily:'"Crimson Pro",serif', fontSize:'.9rem', color: checked ? '#e8d49a' : '#c8b88a' }}>{prod}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Manual entries for productions not in the list */}
                      <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.58rem', color:'#9a8e72', marginBottom:'.5rem', letterSpacing:'.06em' }}>
                        {productions.length > 0 ? 'Or add a new production manually:' : 'Add productions:'}
                      </div>
                      {(form.used_in_productions || []).filter((p:string) => p !== '' && !productions.includes(p)).map((p: string, i: number) => (
                        <div key={i} style={{ display:'flex', gap:'.4rem', marginBottom:'.35rem' }}>
                          <input value={p}
                            onChange={e => {
                              const arr = (form.used_in_productions||[]).map((x:string,j:number) => {
                                if (x === p) return e.target.value
                                return x
                              })
                              setF('used_in_productions', arr)
                            }}
                            placeholder="Production name…"
                            style={{ flex:1, background:'#252015', border:'1px solid rgba(201,168,76,.35)', color:'#f0e8d0', padding:'.42rem .6rem', fontFamily:'"Crimson Pro",serif', fontSize:'.9rem', borderRadius:2, outline:'none' }} />
                          <button onClick={() => setF('used_in_productions',(form.used_in_productions||[]).filter((x:string)=>x!==p))}
                            style={{ background:'transparent', border:'1px solid rgba(201,168,76,.28)', color:'#9a8e72', padding:'.3rem .5rem', cursor:'pointer', borderRadius:2, fontSize:'.7rem' }}>✕</button>
                        </div>
                      ))}
                      <button onClick={() => setF('used_in_productions',[...(form.used_in_productions||[]),''])}
                        style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.38rem .7rem', background:'transparent', color:'#c8b88a', border:'1px solid rgba(201,168,76,.35)', borderRadius:2, cursor:'pointer', marginTop:'.3rem' }}>
                        + Add New Production
                      </button>

                      {/* Currently selected summary */}
                      {(form.used_in_productions||[]).length > 0 && (
                        <div style={{ marginTop:'1rem', padding:'.6rem .8rem', background:'rgba(201,168,76,.05)', border:'1px solid rgba(201,168,76,.15)', borderRadius:3 }}>
                          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', color:'#8a6f30', textTransform:'uppercase', marginBottom:'.35rem', letterSpacing:'.1em' }}>Selected ({(form.used_in_productions||[]).length})</div>
                          <div style={{ display:'flex', gap:'.35rem', flexWrap:'wrap' }}>
                            {(form.used_in_productions||[]).map((p:string) => (
                              <span key={p} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', padding:'2px 8px', background:'rgba(201,168,76,.15)', color:'#c9a84c', border:'1px solid rgba(201,168,76,.3)', borderRadius:10 }}>{p}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {isCostume && (
                        <FormGrid cols={2} style={{ marginTop:'1.2rem' }}>
                          <FF label="Rental Fee ($)"><input type="number" step="0.01" value={form.rental_fee||''} onChange={e=>setF('rental_fee',e.target.value)} /></FF>
                          <FF label="D/C Fee ($)"><input type="number" step="0.01" value={form.dc_fee||''} onChange={e=>setF('dc_fee',e.target.value)} /></FF>
                        </FormGrid>
                      )}
                    </div>
                  )}

                  {/* FINANCIAL TAB */}
                  {activeTab === 'financial' && (
                    <FormGrid cols={2}>
                      <FF label="Total Cost / Value ($)"><input type="number" step="0.01" value={form.total_cost||''} onChange={e=>setF('total_cost',e.target.value)} /></FF>
                      <FF label="Replacement Cost ($)"><input type="number" step="0.01" value={form.replacement_cost||''} onChange={e=>setF('replacement_cost',e.target.value)} /></FF>
                    </FormGrid>
                  )}
                </div>

                {/* Footer */}
                <div style={{ padding:'.85rem 1.3rem', borderTop:'1px solid rgba(201,168,76,.28)', display:'flex', justifyContent:'flex-end', gap:'.45rem', background:'rgba(14,12,8,.3)', position:'sticky', bottom:0, zIndex:2 }}>
                  <button onClick={closeModal} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.42rem .85rem', background:'transparent', color:'#9a8e72', border:'1px solid rgba(201,168,76,.28)', borderRadius:2, cursor:'pointer' }}>Cancel</button>
                  <button onClick={saveForm} disabled={saving} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.42rem .85rem', background:'#c9a84c', color:'#231e14', fontWeight:500, border:'none', borderRadius:2, cursor:saving?'wait':'pointer', opacity:saving?.7:1 }}>
                    {saving ? 'Saving…' : '💾 Save Item'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, locations, onView, onEdit, onDelete }: { item: InventoryItem; locations: Location[]; onView: (i:InventoryItem)=>void; onEdit: (i:InventoryItem)=>void; onDelete: (id:string)=>void }) {
  const primaryPhoto = item.photos?.find(p => p.is_primary) || item.photos?.[0]
  const loc = getLocPath(locations, item.storage_location_id)
  const sc = STATUS_CLASS[item.status] || 's-av'
  return (
    <div onClick={() => onView(item)} style={{ background:'linear-gradient(145deg,#221c12,#1a160e)', border:'1px solid rgba(201,168,76,.18)', borderRadius:3, overflow:'hidden', cursor:'pointer', transition:'all .18s' }}>
      <div style={{ position:'relative', height:130, background:'#1a1610', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', overflow:'hidden' }}>
        {primaryPhoto?.public_url ? <img src={primaryPhoto.public_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ opacity:.6 }}>{TYPE_ICON[item.item_type]||'📦'}</span>}
        <span style={{ position:'absolute', top:5, left:5, fontFamily:'"DM Mono",monospace', fontSize:'.52rem', color:'#8a6f30', background:'rgba(10,8,6,.82)', padding:'1px 5px', borderRadius:2 }}>{item.tag_id}</span>
        <span className={`icard-status ${sc}`} style={{ position:'absolute', top:5, right:5, fontFamily:'"DM Mono",monospace', fontSize:'.52rem', textTransform:'uppercase', padding:'2px 5px', borderRadius:2 }}>{item.status}</span>
        {(item.photos?.length||0)>1 && <span style={{ position:'absolute', bottom:4, right:4, background:'rgba(10,8,6,.8)', border:'1px solid rgba(201,168,76,.3)', color:'#e8d49a', fontFamily:'"DM Mono",monospace', fontSize:'.52rem', padding:'1px 5px', borderRadius:8 }}>📷 {item.photos!.length}</span>}
      </div>
      <div style={{ padding:'.62rem .72rem' }}>
        <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'.93rem', fontWeight:700, color:'#e8d49a', lineHeight:1.25, marginBottom:'.18rem' }}>{item.name}</div>
        <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', color:'#5a5038', marginBottom:'.4rem' }}>
          {item.costume_type || item.prop_type || item.item_type}{item.time_period ? ' · ' + item.time_period : ''}{item.size ? ' · ' + item.size : ''}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'.2rem', marginBottom:'.45rem' }}>
          {[item.color, item.fabric||item.material, item.condition].filter(Boolean).map((v,i) => (
            <span key={i} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.52rem', color:'#9a8e72', background:'rgba(201,168,76,.07)', border:'1px solid rgba(201,168,76,.18)', padding:'1px 5px', borderRadius:6 }}>{v}</span>
          ))}
        </div>
        {loc && <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', color:'#2d8fa5', marginBottom:'.38rem' }}>📍 {loc}</div>}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'.42rem', borderTop:'1px solid rgba(201,168,76,.07)' }}>
          <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', color:'#5a5038' }}>${item.total_cost||item.replacement_cost||'—'}</span>
          <div style={{ display:'flex', gap:'.25rem' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => onEdit(item)} style={{ background:'transparent', border:'1px solid rgba(201,168,76,.28)', color:'#9a8e72', padding:'.2rem .4rem', fontFamily:'"DM Mono",monospace', fontSize:'.52rem', borderRadius:2, cursor:'pointer' }}>✎</button>
            <button onClick={() => onDelete(item.id)} style={{ background:'rgba(139,26,46,.2)', border:'1px solid rgba(139,26,46,.4)', color:'#f08090', padding:'.2rem .4rem', fontFamily:'"DM Mono",monospace', fontSize:'.52rem', borderRadius:2, cursor:'pointer' }}>✕</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ViewPanel({ item, locations, onEdit }: { item: InventoryItem; locations: Location[]; onEdit: ()=>void }) {
  const [activePhoto, setActivePhoto] = useState(0)
  const photos = item.photos || []
  const loc = getLocPath(locations, item.storage_location_id)
  const sc = STATUS_CLASS[item.status] || 's-av'
  const curPhoto = photos[activePhoto]

  return (
    <div style={{ padding:'1.3rem', background:'#282014' }}>
      <div style={{ display:'flex', gap:'1.2rem', marginBottom:'1.2rem', alignItems:'flex-start', flexWrap:'wrap' }}>
        <div style={{ width:200, flexShrink:0 }}>
          <div style={{ width:'100%', height:170, background:'#1a1610', border:'1px solid rgba(201,168,76,.28)', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', fontSize:'5rem', marginBottom:'.4rem' }}>
            {curPhoto?.public_url ? <img src={curPhoto.public_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ opacity:.5 }}>{TYPE_ICON[item.item_type]||'📦'}</span>}
          </div>
          {photos.length > 1 && (
            <div style={{ display:'flex', gap:'.3rem', flexWrap:'wrap' }}>
              {photos.map((p,i) => (
                <div key={p.id} onClick={() => setActivePhoto(i)} style={{ width:44, height:36, background:'#1a1610', border:`1px solid ${i===activePhoto?'#c9a84c':'rgba(201,168,76,.2)'}`, borderRadius:2, overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>
                  {p.public_url ? <img src={p.public_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '📷'}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#5a5038', marginBottom:'.2rem' }}>{item.tag_id} · Entered: {item.date_entered_db||'—'}</div>
          <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.55rem', fontWeight:700, color:'#c9a84c', marginBottom:'.5rem' }}>{item.name}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem', marginBottom:'.7rem' }}>
            <span className={`icard-status ${sc}`} style={{ position:'static', display:'inline-block', fontFamily:'"DM Mono",monospace', fontSize:'.58rem', textTransform:'uppercase', padding:'3px 8px', borderRadius:2 }}>{item.status}</span>
            {item.needs_repair && <span className="tag-amber">⚠ Needs Repair</span>}
            {item.ok_to_loan && <span className="tag-teal">✓ OK to Loan</span>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem' }}>
            {[
              ['Type', item.costume_type || item.prop_type],
              ['Period', item.time_period],
              ['Condition', item.condition],
              ['Color', item.color],
              ['Fabric/Material', item.fabric || item.material],
              ['Size', item.size],
              ['Gender', item.gender],
              ['Source', item.source],
              ['Acquired', item.date_acquired],
              ['Cost', item.total_cost ? `$${item.total_cost}` : null],
              ['Replace Cost', item.replacement_cost ? `$${item.replacement_cost}` : null],
              ['Storage', loc],
            ].filter(([,v]) => v).map(([l,v]) => (
              <div key={l as string} style={{ background:'#1a1610', border:'1px solid rgba(201,168,76,.07)', borderRadius:2, padding:'.3rem .45rem' }}>
                <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.53rem', letterSpacing:'.12em', color:'#5a5038', textTransform:'uppercase', marginBottom:'.12rem' }}>{l}</div>
                <div style={{ fontSize:'.86rem', color:'#e6dfc8' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {item.description && <><div style={{ fontFamily:'"Playfair Display",serif', color:'#c9a84c', fontSize:'1rem', marginBottom:'.5rem' }}>Description</div><p style={{ fontSize:'.9rem', color:'#9a8e72', lineHeight:1.6, marginBottom:'1rem' }}>{item.description}</p></>}
      {item.notes && <><div style={{ fontFamily:'"Playfair Display",serif', color:'#c9a84c', fontSize:'1rem', marginBottom:'.5rem' }}>Notes</div><p style={{ fontSize:'.9rem', color:'#e8943a', lineHeight:1.6, marginBottom:'1rem' }}>{item.notes}</p></>}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:'.45rem', paddingTop:'.9rem', borderTop:'1px solid rgba(201,168,76,.12)' }}>
        <button onClick={onEdit} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.42rem .85rem', background:'#c9a84c', color:'#231e14', fontWeight:500, border:'none', borderRadius:2, cursor:'pointer' }}>✎ Edit</button>
      </div>
    </div>
  )
}

function FormGrid({ cols=2, children, style }: { cols?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:'.85rem', ...style }}>{children}</div>
}

function FF({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'.22rem', gridColumn: full?'1/-1':undefined }}>
      <label style={{ fontFamily:'"DM Mono",monospace', fontSize:'.57rem', letterSpacing:'.14em', color:'#8a6f30', textTransform:'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}
