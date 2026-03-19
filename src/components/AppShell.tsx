'use client'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import type { UserProfile, District, Facility } from '@/lib/types'

interface Props {
  profile: UserProfile
  district: District | null
  facility: Facility | null
  pendingLoans: number
  children: React.ReactNode
}

export default function AppShell({ profile, district, facility, pendingLoans, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const role = profile.role
  const isSys = role === 'sysadmin'
  const isDist = role === 'district_manager'
  const isFac = role === 'facility_manager'

  const nav = isSys ? [
    { section: 'Overview', items: [
      { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    ]},
    { section: 'Management', items: [
      { href: '/dashboard/districts', icon: '🏛️', label: 'Districts' },
      { href: '/dashboard/facilities', icon: '🏫', label: 'All Facilities' },
      { href: '/dashboard/users', icon: '👥', label: 'Users' },
    ]},
    { section: 'System', items: [
      { href: '/dashboard/activity', icon: '📜', label: 'Activity Log' },
      { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
    ]},
  ] : isDist ? [
    { section: 'Overview', items: [
      { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    ]},
    { section: 'My District', items: [
      { href: '/dashboard/facilities', icon: '🏫', label: 'Facilities' },
      { href: '/dashboard/loans', icon: '📦', label: 'Loan Activity' },
      { href: '/dashboard/reports', icon: '📈', label: 'Reports' },
    ]},
  ] : [
    { section: 'Overview', items: [
      { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    ]},
    { section: 'My Inventory', items: [
      { href: '/dashboard/inventory/costumes', icon: '👗', label: 'Costumes' },
      { href: '/dashboard/inventory/props', icon: '🎭', label: 'Props & Sets' },
      { href: '/dashboard/inventory/wigs', icon: '💈', label: 'Wigs & Hair' },
      { href: '/dashboard/inventory/jewelry', icon: '💍', label: 'Jewelry' },
      { href: '/dashboard/inventory/equipment', icon: '💡', label: 'Equipment' },
    ]},
    { section: 'Checkout', items: [
      { href: '/dashboard/checkout', icon: '📋', label: 'Check Out / In' },
      { href: '/dashboard/productions', icon: '🎬', label: 'Productions' },
    ]},
    { section: 'Sharing & Loans', items: [
      { href: '/dashboard/sharing', icon: '🔗', label: 'Sharing Settings' },
      { href: '/dashboard/district-browse', icon: '🏫', label: 'Browse District' },
      { href: '/dashboard/loans/incoming', icon: '📥', label: 'Loan Requests In', badge: pendingLoans },
      { href: '/dashboard/loans/outgoing', icon: '📤', label: 'My Loan Requests' },
    ]},
    { section: 'Tools', items: [
      { href: '/dashboard/locations', icon: '📍', label: 'Locations' },
      { href: '/dashboard/customize', icon: '⚙️', label: 'Customize Lists' },
      { href: '/dashboard/reports', icon: '📈', label: 'Reports' },
    ]},
  ]

  const roleBadgeClass = {
    sysadmin: 'role-sysadmin',
    district_manager: 'role-district',
    facility_manager: 'role-facility',
  }[role] || ''

  const roleLabel = {
    sysadmin: 'System Admin',
    district_manager: 'District Manager',
    facility_manager: 'Facility Manager',
  }[role] || role

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      {/* TOPBAR */}
      <header style={{
        height:50, minHeight:50, background:'linear-gradient(90deg,#0e0c08,#1a1408)',
        borderBottom:'1px solid rgba(201,168,76,.28)', display:'flex', alignItems:'center',
        padding:'0 1.2rem', gap:'.8rem', zIndex:60, boxShadow:'0 2px 12px rgba(8,6,3,.22)',
        flexShrink:0
      }}>
        <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.25rem', fontWeight:900, color:'#c9a84c', letterSpacing:'.07em' }}>
          StageWard
        </div>
        <div style={{ width:1, height:20, background:'rgba(201,168,76,.28)' }} />
        <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', letterSpacing:'.12em', color:'#9a8e72', textTransform:'uppercase', flex:1 }}>
          {facility?.name || district?.name || 'Platform Administration'}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.6rem', flexShrink:0 }}>
          <span style={{
            fontFamily:'"DM Mono",monospace', fontSize:'.58rem', letterSpacing:'.1em',
            textTransform:'uppercase', padding:'3px 10px', borderRadius:10,
            background: isSys?'rgba(201,168,76,.15)':isDist?'rgba(45,143,165,.15)':'rgba(106,170,90,.15)',
            color: isSys?'#c9a84c':isDist?'#2d8fa5':'#6aaa5a',
            border: `1px solid ${isSys?'rgba(201,168,76,.3)':isDist?'rgba(45,143,165,.3)':'rgba(106,170,90,.3)'}`,
          }}>{roleLabel}</span>
          <span style={{ fontFamily:'"DM Mono",monospace', fontSize:'.62rem', color:'#9a8e72' }}>
            {profile.full_name || profile.email}
          </span>
          <button onClick={signOut} style={{
            background:'transparent', border:'1px solid rgba(201,168,76,.28)', color:'#5a5038',
            padding:'.22rem .55rem', fontFamily:'"DM Mono",monospace', fontSize:'.55rem',
            letterSpacing:'.1em', textTransform:'uppercase', borderRadius:2, cursor:'pointer'
          }}>Sign Out</button>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* SIDEBAR */}
        <nav style={{
          width:200, minWidth:200, background:'#0d0b07', borderRight:'1px solid rgba(201,168,76,.12)',
          overflowY:'auto', display:'flex', flexDirection:'column', flexShrink:0
        }}>
          {/* Context block */}
          <div style={{ margin:'.6rem', padding:'.65rem', background:'rgba(201,168,76,.05)', border:'1px solid rgba(201,168,76,.12)', borderRadius:3 }}>
            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.54rem', letterSpacing:'.15em', color:'#5a5038', marginBottom:'.2rem' }}>CONTEXT</div>
            <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.72rem', color:'#e8d49a' }}>{facility?.name || district?.name || 'All Districts'}</div>
            {facility && <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.6rem', color:'#9a8e72', marginTop:'.1rem' }}>{facility.type}</div>}
          </div>

          {nav.map(group => (
            <div key={group.section}>
              <div style={{ fontFamily:'"DM Mono",monospace', fontSize:'.55rem', letterSpacing:'.2em', color:'#5a5038', textTransform:'uppercase', padding:'.85rem 1rem .3rem' }}>
                {group.section}
              </div>
              {group.items.map(item => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <a key={item.href} href={item.href} style={{
                    display:'flex', alignItems:'center', gap:'.55rem',
                    padding:'.46rem 1rem', textDecoration:'none',
                    fontSize:'.84rem', color: active ? '#c9a84c' : '#9a8e72',
                    borderLeft: active ? '2px solid #c9a84c' : '2px solid transparent',
                    background: active ? 'rgba(201,168,76,.08)' : 'transparent',
                    transition:'all .15s'
                  }}>
                    <span style={{ width:16, textAlign:'center', fontSize:'.88rem', flexShrink:0 }}>{item.icon}</span>
                    <span style={{ flex:1 }}>{item.label}</span>
                    {(item as any).badge > 0 && (
                      <span style={{ background:'rgba(196,52,78,.2)', color:'#f08090', fontFamily:'"DM Mono",monospace', fontSize:'.54rem', padding:'1px 5px', borderRadius:8 }}>
                        {(item as any).badge}
                      </span>
                    )}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        {/* CONTENT */}
        <main style={{ flex:1, overflowY:'auto', background:'#141009' }}>
          <div style={{ padding:'1.4rem' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
