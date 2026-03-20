'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

type LoanStatus = 'Pending'|'Approved'|'Checked-Out'|'Returned'|'Declined'

const STATUS_COLORS: Record<LoanStatus, { bg:string; color:string; border:string }> = {
  Pending:     { bg:'rgba(74,45,110,.2)',  color:'#8a5cbf', border:'rgba(74,45,110,.4)'  },
  Approved:    { bg:'rgba(61,92,53,.2)',   color:'#6aaa5a', border:'rgba(61,92,53,.4)'   },
  'Checked-Out':{ bg:'rgba(30,95,110,.2)', color:'#2d8fa5', border:'rgba(30,95,110,.4)'  },
  Returned:    { bg:'rgba(176,104,32,.2)', color:'#e8943a', border:'rgba(176,104,32,.4)' },
  Declined:    { bg:'rgba(139,26,46,.2)',  color:'#f08090', border:'rgba(139,26,46,.4)'  },
}
const ICON: Record<string,string> = { Costume:'👗', Prop:'🎭', Wig:'💈', Jewelry:'💍', Equipment:'💡' }

export default function LoansClient({ loans: initialLoans, facilityId, userName, direction }: { loans: any[]; facilityId: string; userName: string; direction: 'incoming'|'outgoing' }) {
  const supabase = createClient()
  const [loans, setLoans] = useState(initialLoans)
  const [filter, setFilter] = useState<string>('')
  const [detail, setDetail] = useState<any>(null)
  const [acting, setActing] = useState(false)

  async function updateStatus(id: string, status: LoanStatus, extra?: Record<string,any>) {
    setActing(true)
    const update: any = { status, ...extra }
    if (status === 'Approved') update.approved_by = userName
    if (status === 'Checked-Out') { update.checkout_date = new Date().toISOString().split('T')[0] }
    if (status === 'Returned') { update.checkin_date = new Date().toISOString().split('T')[0] }
    await supabase.from('loan_requests').update(update).eq('id', id)

    // update item status
    const lr = loans.find(l=>l.id===id)
    if (lr?.item) {
      if (status === 'Checked-Out') await supabase.from('inventory_items').update({ status:'On Loan' }).eq('tag_id', lr.item.tag_id).eq('facility_id', lr.to_facility_id||facilityId)
      if (status === 'Returned') await supabase.from('inventory_items').update({ status:'Available' }).eq('tag_id', lr.item.tag_id)
    }
    setLoans(prev => prev.map(l => l.id===id ? { ...l, ...update } : l))
    setDetail((d: any) => d?.id===id ? { ...d, ...update } : d)
    setActing(false)
  }

  const filtered = loans.filter(l => !filter || l.status === filter)
  const isIn = direction === 'incoming'

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.2rem', paddingBottom:'.9rem', borderBottom:'1px solid rgba(201,168,76,.12)' }}>
        <div>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', letterSpacing:'.16em', color:'#5a5038', textTransform:'uppercase', marginBottom:'.18rem' }}>Sharing & Loans</div>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.5rem', fontWeight:700, color:'#c9a84c' }}>{isIn ? '📥 Loan Requests In' : '📤 My Loan Requests'}</h1>
        </div>
        {!isIn && (
          <a href="/dashboard/district-browse" style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.42rem .85rem', background:'#4a2d6e', color:'#f0ead8', border:'none', borderRadius:2, textDecoration:'none' }}>
            + New Request
          </a>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(201,168,76,.12)', marginBottom:'1rem', gap:0, overflowX:'auto' }}>
        {['','Pending','Approved','Checked-Out','Returned','Declined'].map(s => {
          const count = s ? loans.filter(l=>l.status===s).length : loans.length
          return (
            <button key={s} onClick={()=>setFilter(s)} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.52rem .9rem', cursor:'pointer', border:'none', background:'transparent', borderBottom:filter===s?'2px solid #c9a84c':'2px solid transparent', color:filter===s?'#c9a84c':'#5a5038', whiteSpace:'nowrap', transition:'all .15s', marginBottom:-1 }}>
              {s || 'All'} ({count})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'#5a5038' }}>
          <div style={{ fontSize:'2.5rem', opacity:.3, marginBottom:'.7rem' }}>{isIn?'📥':'📤'}</div>
          <p style={{ fontFamily:'"DM Mono",monospace', fontSize:'.65rem' }}>No loan requests {filter ? `with status "${filter}"` : 'yet'}.</p>
        </div>
      ) : filtered.map(lr => {
        const sc = STATUS_COLORS[lr.status as LoanStatus] || STATUS_COLORS.Pending
        const otherFac = isIn ? lr.from_facility : lr.to_facility
        const borderKey = lr.status === 'Pending' ? '#8a5cbf' : lr.status === 'Approved' || lr.status === 'Checked-Out' ? '#6aaa5a' : lr.status === 'Returned' ? '#e8943a' : '#f08090'
        return (
          <div key={lr.id} onClick={()=>setDetail(lr)} style={{ display:'flex', alignItems:'center', gap:'.7rem', padding:'.65rem .9rem', border:'1px solid rgba(201,168,76,.12)', borderLeft:`3px solid ${borderKey}`, borderRadius:2, marginBottom:'.45rem', background:'#0e0c08', cursor:'pointer', transition:'border-color .15s' }}
            onMouseEnter={e=>(e.currentTarget.style.borderColor=`${borderKey}`)} onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(201,168,76,.12)')}>
            <span style={{ fontSize:'1.3rem' }}>{ICON[lr.item?.item_type]||'📦'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'.9rem', color:'#e6dfc8' }}>
                {lr.item?.name} <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.58rem', color:'#5a5038' }}>{lr.id.slice(-8)}</span>
              </div>
              <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.58rem', color:'#5a5038', marginTop:'.1rem' }}>
                {isIn?'From':'To'}: <span style={{ color:'#2d8fa5' }}>{otherFac?.name||'—'}</span> · Need: {lr.need_date} → Return: {lr.return_date}
                {lr.production ? ` · "${lr.production}"` : ''}
              </div>
            </div>
            <div style={{ display:'flex', gap:'.3rem', alignItems:'center' }} onClick={e=>e.stopPropagation()}>
              <span style={{ background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, fontFamily:'"DM Mono",monospace', fontSize:'.56rem', padding:'2px 7px', borderRadius:7 }}>{lr.status}</span>
              {isIn && lr.status === 'Pending' && <>
                <button disabled={acting} onClick={()=>updateStatus(lr.id,'Approved')} style={{ background:'rgba(61,92,53,.2)', border:'1px solid rgba(61,92,53,.4)', color:'#6aaa5a', padding:'.22rem .5rem', fontFamily:'"DM Mono",monospace', fontSize:'.55rem', borderRadius:2, cursor:'pointer' }}>Approve</button>
                <button disabled={acting} onClick={()=>updateStatus(lr.id,'Declined')} style={{ background:'rgba(139,26,46,.15)', border:'1px solid rgba(139,26,46,.3)', color:'#f08090', padding:'.22rem .5rem', fontFamily:'"DM Mono",monospace', fontSize:'.55rem', borderRadius:2, cursor:'pointer' }}>Decline</button>
              </>}
              {isIn && lr.status === 'Approved' && <button disabled={acting} onClick={()=>updateStatus(lr.id,'Checked-Out')} style={{ background:'rgba(30,95,110,.2)', border:'1px solid rgba(30,95,110,.4)', color:'#2d8fa5', padding:'.22rem .5rem', fontFamily:'"DM Mono",monospace', fontSize:'.55rem', borderRadius:2, cursor:'pointer' }}>Check Out</button>}
              {isIn && lr.status === 'Checked-Out' && <button disabled={acting} onClick={()=>updateStatus(lr.id,'Returned')} style={{ background:'rgba(176,104,32,.2)', border:'1px solid rgba(176,104,32,.4)', color:'#e8943a', padding:'.22rem .5rem', fontFamily:'"DM Mono",monospace', fontSize:'.55rem', borderRadius:2, cursor:'pointer' }}>Check In</button>}
              {!isIn && lr.status === 'Pending' && <button disabled={acting} onClick={()=>updateStatus(lr.id,'Declined')} style={{ background:'rgba(139,26,46,.15)', border:'1px solid rgba(139,26,46,.3)', color:'#f08090', padding:'.22rem .5rem', fontFamily:'"DM Mono",monospace', fontSize:'.55rem', borderRadius:2, cursor:'pointer' }}>Cancel</button>}
            </div>
          </div>
        )
      })}

      {/* Detail panel */}
      {detail && (
        <div onClick={e=>e.target===e.currentTarget&&setDetail(null)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.88)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:'1.5rem' }}>
          <div style={{ background:'linear-gradient(145deg,#221c12,#181410)', border:'1px solid #c9a84c', borderRadius:4, width:'100%', maxWidth:520, boxShadow:'0 28px 70px rgba(8,6,3,.65)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.3rem', borderBottom:'1px solid rgba(201,168,76,.28)', background:'rgba(14,12,8,.5)' }}>
              <span style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.2rem', fontWeight:700, color:'#c9a84c' }}>📦 Loan Request {detail.id?.slice(-8)}</span>
              <button onClick={()=>setDetail(null)} style={{ background:'none', border:'none', color:'#9a8e72', fontSize:'1.25rem', cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ padding:'1.2rem' }}>
              {[
                ['Item', `${ICON[detail.item?.item_type]||'📦'} ${detail.item?.name} (${detail.item?.tag_id})`],
                ['Status', detail.status],
                [isIn?'Requesting Facility':'Owner Facility', (isIn?detail.from_facility:detail.to_facility)?.name],
                ['Requested By', detail.requested_by],
                ['Request Date', detail.request_date],
                ['Need Date', detail.need_date],
                ['Return Date', detail.return_date],
                ['Production', detail.production],
                ['Purpose', detail.purpose],
                ['Approved By', detail.approved_by],
                ['Checkout Date', detail.checkout_date],
                ['Check-In Date', detail.checkin_date],
                ['Notes', detail.notes],
              ].filter(([,v])=>v).map(([l,v]) => (
                <div key={l as string} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'.3rem 0', borderBottom:'1px solid rgba(201,168,76,.06)' }}>
                  <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.58rem', color:'#5a5038', textTransform:'uppercase', letterSpacing:'.08em' }}>{l}</span>
                  <span style={{ fontSize:'.9rem', color:'#e6dfc8', maxWidth:'60%', textAlign:'right' }}>{v as string}</span>
                </div>
              ))}
            </div>
            <div style={{ padding:'.85rem 1.2rem', borderTop:'1px solid rgba(201,168,76,.12)', display:'flex', justifyContent:'flex-end', gap:'.4rem' }}>
              <button onClick={()=>setDetail(null)} style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.42rem .85rem', background:'transparent', color:'#9a8e72', border:'1px solid rgba(201,168,76,.28)', borderRadius:2, cursor:'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
