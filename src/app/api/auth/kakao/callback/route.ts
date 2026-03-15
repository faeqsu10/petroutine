import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=kakao_failed`);
  }

  try {
    // 1) 인가 코드 → 액세스 토큰 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY!,
        redirect_uri: `${origin}/api/auth/kakao/callback`,
        code,
      }),
    });
    if (!tokenRes.ok) throw new Error('Token exchange failed');
    const { access_token } = await tokenRes.json() as { access_token: string };

    // 2) 액세스 토큰 → 카카오 사용자 정보
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) throw new Error('Kakao user info failed');
    const kakaoUser = await userRes.json() as {
      id: number;
      properties?: { nickname?: string; profile_image?: string };
      kakao_account?: { email?: string };
    };

    // 3) Firebase 사용자 생성/업데이트 + Custom Token
    const uid = `kakao:${kakaoUser.id}`;
    const displayName = kakaoUser.properties?.nickname ?? '';
    const photoURL = kakaoUser.properties?.profile_image ?? null;
    const email = kakaoUser.kakao_account?.email ?? null;

    try {
      await adminAuth.updateUser(uid, { displayName, ...(photoURL ? { photoURL } : {}), ...(email ? { email } : {}) });
    } catch {
      await adminAuth.createUser({ uid, displayName, ...(photoURL ? { photoURL } : {}), ...(email ? { email } : {}) });
    }

    // 4) 세션 쿠키 생성
    const customToken = await adminAuth.createCustomToken(uid);
    // Custom Token → ID Token 변환을 위해 Firebase Auth REST API 사용
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );
    if (!signInRes.ok) throw new Error('Custom token sign-in failed');
    const { idToken } = await signInRes.json() as { idToken: string };

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5일
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    console.error('Kakao callback error:', error);
    return NextResponse.redirect(`${origin}/login?error=kakao_failed`);
  }
}
