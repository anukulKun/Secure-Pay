import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Old routes to be redirected to dashboard
const REDIRECT_ROUTES = [
  '/transfer',
  '/group-payments',
  '/savings-pots',
  '/profile'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the path matches any of our old routes
  for (const oldRoute of REDIRECT_ROUTES) {
    if (pathname === oldRoute) {
      // Create new URL for redirect (to dashboard structure)
      const dashboardUrl = new URL(`/dashboard${pathname}`, request.url)
      
      return NextResponse.redirect(dashboardUrl)
    }
  }
  
  return NextResponse.next()
}

// Configure the paths for which this middleware will run
export const config = {
  matcher: [
    '/transfer',
    '/group-payments',
    '/savings-pots',
    '/profile',
  ],
}
