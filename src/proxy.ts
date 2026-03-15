import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/signup', '/api/auth', '/welcome', '/__/auth', '/__/firebase'];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  if (session && (pathname === '/login' || pathname === '/welcome' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
