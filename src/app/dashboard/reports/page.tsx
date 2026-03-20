'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export default function ReportsPage() {
  const [facilityId, setFacilityId] = useState<string|null>(null)
  const [role, setRole]             = useState<string>('')
  const [running, setRunning]       = useState<string|null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase.from('user_profiles').select('facility_id,role').eq('id', session.user.id).single()
        .then(({ data }) => { setFacilityId(data?.facility_id||null); setRole(data?.role||'') })
    })
  }, [])

  async function runReport(type: string) {
    setRunning(type)
    try {
      let rows: any[] = []
      let filename = `${type}-${new Date().toISOString().slice(0,10)}.csv`

      if (type === 'inventory' && facilityId) {
        const { data } = await supabase.from('inventory_items')
          .select('tag_id,name,item_type,status,condition,color,size,gender,time_period,fabric,source,date_acquired,total_cost,replacement_cost,ok_to_loan,needs_repair,description,notes')
          .eq('facility_id', facilityId).order('item_type').order('name')
        rows = data || []
      }
      else if (type === 'checkouts' && facilityId) {
        const { data } = await supabase.from('checkout_records')
          .select('person_name,person_role,production,out_date,due_date,return_date,status,notes,item:inventory_items(tag_id,name,item_type)')
          .eq('facility_id', facilityId).order('out_date',{ascending:false})
        rows = (data||[]).map((r:any) => ({
          tag_id: r.item?.tag_id, item_name: r.item?.name, item_type: r.item?.item_type,
          person_name: r.person_name, person_role: r.person_role, production: r.production,
          out_date: r.out_date, due_date: r.due_date, return_date: r.return_date||'', status: r.status, notes: r.notes||''
        }))
      }
      else if (type === 'loans' && facilityId) {
        const { data } = await supabase.from('loan_requests')
          .select('status,requested_by,request_date,need_date,return_date,production,purpose,notes,checkout_date,checkin_date,item:inventory_items(tag_id,name,item_type),from_facility:facilities!from_facility_id(name),to_facility:facilities!to_facility_id(name)')
          .or(`from_facility_id.eq.${facilityId},to_facility_id.eq.${facilityId}`)
          .order('request_date',{ascending:false})
        rows = (data||[]).map((r:any) => ({
          item_tag: r.item?.tag_id, item_name: r.item?.name, from: r.from_facility?.name, to: r.to_facility?.name,
          status: r.status, requested_by: r.requested_by, production: r.production||'',
          need_date: r.need_date||'', return_date: r.return_date||'', checkout_date: r.checkout_date||'', checkin_date: r.checkin_date||''
        }))
      }
      else if (type === 'repair' && facilityId) {
        const { data } = await supabase.from('inventory_items')
          .select('tag_id,name,item_type,condition,repair_description,color,size')
          .eq('facility_id', facilityId).eq('needs_repair', true).order('condition')
        rows = data || []
      }
      else if (type === 'value' && facilityId) {
        const { data } = await supabase.from('inventory_items')
          .select('item_type,tag_id,name,total_cost,replacement_cost,status')
          .eq('facility_id', facilityId).order('item_type')
        rows = data || []
      }
      else if (type === 'productions' && facilityId) {
        const { data } = await supabase.from('checkout_records')
          .select('production,item:inventory_items(tag_id,name,item_type,color)')
          .eq('facility_id', facilityId).not('production','is',null).order('production')
        rows = (data||[]).map((r:any) => ({
          production: r.production, tag_id: r.item?.tag_id, item_name: r.item?.name,
          item_type: r.item?.item_type, color: r.item?.color||''
        }))
      }

      if (rows.length === 0) { setRunning(null); alert('No data found for this report.'); return }

      // Build CSV
      const headers = Object.keys(rows[0])
      const csv = [
        headers.join(','),
        ...rows.map(row => headers.map(h => {
          const val = String(row[h]||'').replace(/"/g,'""')
          return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val
        }).join(','))
      ].join('\n')

      // Download
      const blob = new Blob([csv], { type:'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } catch(e) { console.error(e) }
    setRunning(null)
  }

  const reports = [
    { id:'inventory',   icon:'📦', label:'Full Inventory Export',   desc:'All items with complete details',          color:'#2d8fa5' },
    { id:'checkouts',   icon:'📋', label:'Checkout History',         desc:'All checkout records with status',         color:'#8a5cbf' },
    { id:'loans',       icon:'📥', label:'Loan Activity',            desc:'All inter-facility loan requests',         color:'#e8943a' },
    { id:'repair',      icon:'🔧', label:'Items Needing Repair',     desc:'Repair queue with descriptions',           color:'#c4344e' },
    { id:'value',       icon:'💰', label:'Inventory Value',          desc:'Total cost and replacement cost totals',   color:'#c9a84c' },
    { id:'productions', icon:'🎭', label:'Usage by Production',      desc:'Which items went with which show',         color:'#6aaa5a' },
  ]

  return (
    <div>
      <div style={{marginBottom:'1.2rem',paddingBottom:'.9rem',borderBottom:'1px solid rgba(201,168,76,.12)'}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.56rem',letterSpacing:'.16em',color:'#5a5038',textTransform:'uppercase',marginBottom:'.18rem'}}>Analytics & Exports</div>
        <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.5rem',fontWeight:700,color:'#c9a84c',margin:0}}>📈 Reports</h1>
      </div>

      <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.62rem',color:'#5a5038',marginBottom:'1rem',letterSpacing:'.08em'}}>
        Click any report to download a CSV file instantly.
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'.8rem'}}>
        {reports.map(r => (
          <button key={r.id} onClick={() => runReport(r.id)} disabled={running===r.id || !facilityId}
            style={{background:'linear-gradient(135deg,#252018,#201c14)',border:`1px solid ${r.color}30`,borderTop:`3px solid ${r.color}`,borderRadius:3,padding:'1.1rem 1.2rem',textAlign:'left',cursor:facilityId?'pointer':'not-allowed',opacity:facilityId?1:.5,position:'relative',transition:'border-color .15s'}}>
            <div style={{display:'flex',alignItems:'center',gap:'.6rem',marginBottom:'.5rem'}}>
              <span style={{fontSize:'1.6rem'}}>{r.icon}</span>
              {running===r.id && <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.55rem',color:r.color,letterSpacing:'.1em'}}>Generating…</span>}
            </div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'.98rem',color:'#e8d49a',fontWeight:600,marginBottom:'.25rem'}}>{r.label}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.58rem',color:'#5a5038',lineHeight:1.4}}>{r.desc}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'.55rem',color:r.color,marginTop:'.6rem',letterSpacing:'.08em'}}>
              {running===r.id ? '⏳ Please wait…' : '⬇ Download CSV'}
            </div>
          </button>
        ))}
      </div>

      {!facilityId && role !== 'sysadmin' && (
        <div style={{marginTop:'1.5rem',padding:'1rem',background:'rgba(232,148,58,.08)',border:'1px solid rgba(232,148,58,.3)',borderRadius:3,fontFamily:"'DM Mono',monospace",fontSize:'.62rem',color:'#e8943a'}}>
          Reports are available for facility managers. Your account may not have a facility assigned.
        </div>
      )}
    </div>
  )
}
