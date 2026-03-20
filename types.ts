import { NextResponse, type NextRequest } from 'next/server'

// Auth is handled client-side in AppShell — middleware just passes through
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
