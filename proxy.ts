import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the session AND refreshes the access token via cookies
  // when it's nearing expiration — this is what makes sessions persist across
  // browser restarts. The refreshed cookies are propagated on supabaseResponse.
  const { data: { user }, error } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/generate') ||
    pathname.startsWith('/profile')

  // If we have a stale/invalid refresh token, clear it and treat as logged out
  if (error?.status === 400 && error.code === 'refresh_token_not_found') {
    if (!isProtected) return supabaseResponse
    const response = NextResponse.redirect(new URL('/login', request.url))
    request.cookies.getAll()
      .filter(c => c.name.startsWith('sb-'))
      .forEach(c => response.cookies.delete(c.name))
    return response
  }

  // Unauthenticated users cannot reach any protected area
  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Signed-in users shouldn't see auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}