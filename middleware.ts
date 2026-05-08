import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/api']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Biarkan path publik lewat
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Cek token dari cookie (jika ada) — Zustand persist menyimpan di localStorage
  // Untuk SSR check, kita cukup biarkan client-side handle redirect
  // Middleware ini hanya untuk mencegah flash redirect loop
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
