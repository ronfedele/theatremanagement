import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/dashboard')) return NextResponse.next()

  const hasCookie = request.cookies.getAll().some(c =>
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )
  if (!hasCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }
