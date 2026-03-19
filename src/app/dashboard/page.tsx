import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const isSys = profile.role === 'sysadmin'
  const isDist = profile.role === 'district_manager'
  const isFac = profile.role === 'facility_manager'

  // Fetch stats depending on role
  let stats: Record<string, number> = {}
  let recentItems: any[] = []
  let pendingLoans: any[] = []

  if (isFac && profile.facility_id) {
    const fid = profile.facility_id
    const [items, checkouts, loansIn, loansOut] = await Promise.all([
      supabase.from('inventory_items').select('id,status,needs_repair,item_type', {count:'exact'}).eq('facility_id', fid),
      supabase.from('checkout_records').select('id,status').eq('facility_id', fid).neq('status','Returned'),
      supabase.from('loan_requests').select('id,status').eq('to_facility_id', fid).eq('status','Pending'),
      supabase.from('loan_requests').select('id,status').eq('from_facility_id', fid).in('status',['Pending','Approved','Checked-Out']),
    ])
    const allItems = items.data || []
    stats = {
      total: allItems.length,
      available: allItems.filter(i=>i.status==='Available').length,
      checkedOut: allItems.filter(i=>i.status==='Checked Out').length,
      needsRepair: allItems.filter(i=>i.needs_repair).length,
      pendingLoansIn: loansIn.data?.length || 0,
      activeLoansOut: loansOut.data?.length || 0,
    }
    const { data: recent } = await supabase
      .from('inventory_items')
      .select('id,tag_id,name,item_type,status,condition,color')
      .eq('facility_id', fid)
      .order('created_at', {ascending:false})
      .limit(6)
    recentItems = recent || []

    const { data: pl } = await supabase
      .from('loan_requests')
      .select('*, item:inventory_items(tag_id,name,item_type), from_facility:facilities!from_facility_id(name)')
      .eq('to_facility_id', fid)
      .eq('status', 'Pending')
      .limit(5)
    pendingLoans = pl || []
  }

  if (isSys) {
    const [d, f, items] = await Promise.all([
      supabase.from('districts').select('id', {count:'exact', head:true}),
      supabase.from('facilities').select('id', {count:'exact', head:true}),
      supabase.from('inventory_items').select('id', {count:'exact', head:true}),
    ])
    stats = { districts: d.count||0, facilities: f.count||0, totalItems: items.count||0 }
  }

  const statChips = isFac ? [
    { label:'Total Items', value:stats.total||0, color:'#6aaa5a' },
    { label:'Available', value:stats.available||0, color:'#2d8fa5' },
    { label:'Checked Out', value:stats.checkedOut||0, color:'#c4344e' },
    { label:'Need Repair', value:stats.needsRepair||0, color:'#e8943a' },
    { label:'Loan Requests In', value:stats.pendingLoansIn||0, color:'#8a5cbf' },
  ] : isSys ? [
    { label:'Districts', value:stats.districts||0, color:'#c9a84c' },
    { label:'Facilities', value:stats.facilities||0, color:'#2d8fa5' },
    { label:'Total Items', value:stats.totalItems||0, color:'#6aaa5a' },
  ] : []

  const itemTypeIcon: Record<string,string> = { Costume:'👗', Prop:'🎭', Wig:'💈', Jewelry:'💍', Equipment:'💡' }
  const statusClass: Record<string,string> = { Available:'s-av', 'Checked Out':'s-out', 'In Repair':'s-rep', 'In Storage':'s-sto', 'On Loan':'s-loan' }

  return (
    <div>
      {/* Page header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.2rem', paddingBottom:'.9rem', borderBottom:'1px solid rgba(201,168,76,.12)' }}>
        <div>
          <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', letterSpacing:'.16em', color:'#5a5038', textTransform:'uppercase', marginBottom:'.18rem' }}>
            {isFac ? 'Facility Overview' : isSys ? 'Platform Overview' : 'District Overview'}
          </div>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.5rem', fontWeight:700, color:'#c9a84c' }}>📊 Dashboard</h1>
        </div>
        {isFac && (
          <div style={{ display:'flex', gap:'.4rem' }}>
            <a href="/dashboard/inventory/costumes" style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.42rem .85rem', background:'transparent', color:'#9a8e72', border:'1px solid rgba(201,168,76,.28)', borderRadius:2, textDecoration:'none' }}>
              + Add Item
            </a>
            <a href="/dashboard/checkout" style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', padding:'.42rem .85rem', background:'#c9a84c', color:'#0e0c08', fontWeight:500, border:'none', borderRadius:2, textDecoration:'none' }}>
              📋 Check Out
            </a>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:'.7rem', marginBottom:'1.3rem', flexWrap:'wrap' }}>
        {statChips.map(chip => (
          <div key={chip.label} style={{
            background:'linear-gradient(135deg,#221c12,#1a160e)', border:'1px solid rgba(201,168,76,.12)',
            borderRadius:3, padding:'.65rem .9rem', flex:1, minWidth:100, position:'relative', overflow:'hidden'
          }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:chip.color, opacity:.55 }} />
            <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.6rem', fontWeight:900, color:chip.color, lineHeight:1 }}>{chip.value}</div>
            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.55rem', letterSpacing:'.1em', color:'#5a5038', textTransform:'uppercase', marginTop:'.15rem' }}>{chip.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.2rem' }}>
        {/* Recent Items */}
        {isFac && (
          <div>
            <SectionTitle>🏷️ Recent Items</SectionTitle>
            {recentItems.length === 0 && (
              <EmptyState icon="📦" text="No items yet. Add your first costume or prop." />
            )}
            {recentItems.map(item => (
              <a key={item.id} href={`/dashboard/inventory/${item.item_type.toLowerCase()}s/${item.id}`}
                style={{ display:'flex', alignItems:'center', gap:'.7rem', padding:'.5rem .7rem', border:'1px solid rgba(201,168,76,.12)', borderRadius:2, marginBottom:'.4rem', background:'#0e0c08', textDecoration:'none', transition:'border-color .15s' }}>
                <span style={{ fontSize:'1.3rem' }}>{itemTypeIcon[item.item_type] || '📦'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'.9rem', color:'#e6dfc8' }}>{item.name}</div>
                  <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.58rem', color:'#5a5038' }}>{item.tag_id} · {item.color || item.condition}</div>
                </div>
                <span className={`icard-status ${statusClass[item.status]||'s-av'}`} style={{ position:'static', display:'inline-block', fontFamily:'"DM Mono",monospace', fontSize:'.54rem', textTransform:'uppercase', padding:'2px 6px', borderRadius:2 }}>
                  {item.status}
                </span>
              </a>
            ))}
            {recentItems.length > 0 && (
              <a href="/dashboard/inventory/costumes" style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#8a6f30', textDecoration:'none', letterSpacing:'.08em' }}>
                View all inventory →
              </a>
            )}
          </div>
        )}

        {/* Pending Loan Requests */}
        {isFac && (
          <div>
            <SectionTitle>📥 Pending Loan Requests</SectionTitle>
            {pendingLoans.length === 0 && (
              <EmptyState icon="✅" text="No pending loan requests." />
            )}
            {pendingLoans.map((lr: any) => (
              <a key={lr.id} href="/dashboard/loans/incoming"
                style={{ display:'flex', alignItems:'center', gap:'.7rem', padding:'.5rem .7rem', border:'1px solid rgba(138,92,191,.3)', borderLeft:'3px solid #8a5cbf', borderRadius:2, marginBottom:'.4rem', background:'#0e0c08', textDecoration:'none' }}>
                <span style={{ fontSize:'1.2rem' }}>{itemTypeIcon[lr.item?.item_type] || '📦'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'.88rem', color:'#e6dfc8' }}>{lr.item?.name}</div>
                  <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.58rem', color:'#5a5038' }}>
                    From: {lr.from_facility?.name} · Need: {lr.need_date}
                  </div>
                </div>
                <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.56rem', background:'rgba(74,45,110,.2)', color:'#8a5cbf', border:'1px solid rgba(74,45,110,.4)', padding:'1px 6px', borderRadius:7 }}>Pending</span>
              </a>
            ))}
            {pendingLoans.length > 0 && (
              <a href="/dashboard/loans/incoming" style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#8a6f30', textDecoration:'none', letterSpacing:'.08em' }}>
                Review all requests →
              </a>
            )}
          </div>
        )}

        {isSys && (
          <div style={{ gridColumn:'1/-1' }}>
            <SectionTitle>🏛️ Quick Access</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'.8rem' }}>
              {[
                { href:'/dashboard/districts', icon:'🏛️', label:'Manage Districts' },
                { href:'/dashboard/facilities', icon:'🏫', label:'All Facilities' },
                { href:'/dashboard/users', icon:'👥', label:'Users & Access' },
                { href:'/dashboard/activity', icon:'📜', label:'Activity Log' },
              ].map(card => (
                <a key={card.href} href={card.href} style={{
                  display:'block', background:'linear-gradient(145deg,#221c12,#1a160e)',
                  border:'1px solid rgba(201,168,76,.28)', borderRadius:3, padding:'1.2rem',
                  textAlign:'center', textDecoration:'none', transition:'all .18s'
                }}>
                  <div style={{ fontSize:'2rem', marginBottom:'.4rem' }}>{card.icon}</div>
                  <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', color:'#9a8e72', letterSpacing:'.06em' }}>{card.label}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1rem', color:'#c9a84c', marginBottom:'.7rem', display:'flex', alignItems:'center', gap:'.45rem' }}>
      {children}
      <div style={{ flex:1, height:1, background:'rgba(201,168,76,.12)' }} />
    </div>
  )
}

function EmptyState({ icon, text }: { icon:string, text:string }) {
  return (
    <div style={{ textAlign:'center', padding:'1.5rem', color:'#5a5038' }}>
      <div style={{ fontSize:'2rem', opacity:.3, marginBottom:'.5rem' }}>{icon}</div>
      <p style={{ fontSize:'.85rem' }}>{text}</p>
    </div>
  )
}
