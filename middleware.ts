import { updateSession } from '@/lib/supabase/proxy'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // First update the session
  const response = await updateSession(request)
  
  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ['/auth/login', '/auth/sign-up', '/auth/sign-up-success', '/auth/error', '/auth/callback', '/invite']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Admin routes
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Check auth status for protected routes
  if (!isPublicRoute && pathname !== '/') {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Read-only in middleware check
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Check admin access - direct query
    if (isAdminRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.role === 'admin' || profile?.role === 'mod'
      
      if (!isAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/feed'
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


#lol
