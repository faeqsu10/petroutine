import { adminAuth } from '@/lib/firebase/admin';
import { isAllowedAdmin } from '@/lib/admin-access';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ isAdmin: false });
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return NextResponse.json({
      isAdmin: isAllowedAdmin({
        uid: decoded.uid,
        email: decoded.email ?? null,
      }),
    });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
