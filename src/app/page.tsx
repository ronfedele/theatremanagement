import { redirect } from 'next/navigation'

// Root page just sends everyone to dashboard
// AppShell handles auth check client-side
export default function RootPage() {
  redirect('/dashboard')
}
