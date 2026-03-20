import AppShell from '@/components/AppShell'

// Pass dummy props — AppShell will load real data client-side
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  )
}
