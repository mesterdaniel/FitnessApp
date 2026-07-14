import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              maxAge: options.maxAge || 60 * 60 * 24 * 30, // 30 days
              path: '/',
            }
            request.cookies.set({ name, value, ...cookieOptions })
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              maxAge: options.maxAge || 60 * 60 * 24 * 30, // 30 days
              path: '/',
            }
            supabaseResponse.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT use supabase.auth.getSession() here!
  // It is not guaranteed to revalidate the Auth token.
  // getClaims() validates the JWT signature against the project's published public keys.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // protect routes
  const isPublicRoute = 
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname === '/'

  if (!user && !isPublicRoute) {
    // no user, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isClientRoute = request.nextUrl.pathname.startsWith('/client')
  const isCoachRoute = request.nextUrl.pathname.startsWith('/coach')

  if (user && (isAdminRoute || isClientRoute || isCoachRoute)) {
    // fetch role from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'client'

    if (isAdminRoute && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'trainer' ? '/coach' : '/client'
      return NextResponse.redirect(url)
    }

    if (isCoachRoute && role !== 'trainer') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'admin' ? '/admin' : '/client'
      return NextResponse.redirect(url)
    }

    if (isClientRoute && role !== 'client') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'admin' ? '/admin' : '/coach'
      return NextResponse.redirect(url)
    }
  }

  // If user is logged in and tries to access /login, redirect them somewhere (optional)
  // if (user && request.nextUrl.pathname.startsWith('/login')) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/'
  //   return NextResponse.redirect(url)
  // }

  return supabaseResponse
}
