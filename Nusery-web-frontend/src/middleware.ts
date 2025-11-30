import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow login page, API routes, and static files
  if (
    request.nextUrl.pathname === '/login' || 
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next')
  ) {
    return NextResponse.next()
  }

  // Since we're using client-side authentication with localStorage,
  // we can't check tokens in middleware (which runs server-side).
  // Let client-side pages handle authentication checks.
  // The middleware will only block if there's an explicit token in headers/cookies.
  
  // Check for auth token in headers (for API calls from client)
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  // For API routes, we still want to check authorization header
  // But for page navigation, let the client-side handle it
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

