import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

// 에러 로그를 Firestore에 저장
async function logError(step: string, detail: string) {
  try {
    await adminDb.collection('errorLogs').add({
      source: 'kakao-callback',
      step,
      detail,
      timestamp: new Date().toISOString(),
    });
  } catch { /* 로깅 실패는 무시 */ }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Vercel에서 origin이 다를 수 있으므로 환경변수 또는 헤더에서 가져옴
  const host = request.headers.get('host') ?? '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const appOrigin = `${protocol}://${host}`;

  if (!code) {
    await logError('code', 'Missing authorization code');
    return NextResponse.redirect(`${appOrigin}/login?error=kakao_no_code`);
  }

  try {
    // 1) 인가 코드 → 액세스 토큰 교환
    const redirectUri = `${appOrigin}/api/auth/kakao/callback`;
    const clientId = process.env.KAKAO_REST_API_KEY;

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        client_secret: process.env.KAKAO_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        code,
      }),
    });
    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      await logError('token_exchange', `${tokenRes.status}: ${errorBody}`);
      throw new Error(`Token exchange: ${tokenRes.status}`);
    }
    const { access_token } = await tokenRes.json() as { access_token: string };

    // 2) 액세스 토큰 → 카카오 사용자 정보
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) {
      await logError('user_info', `${userRes.status}`);
      throw new Error('Kakao user info failed');
    }
    const kakaoUser = await userRes.json() as {
      id: number;
      properties?: { nickname?: string; profile_image?: string };
      kakao_account?: { email?: string };
    };

    // 3) Firebase 사용자 생성/업데이트
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
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );
    if (!signInRes.ok) {
      const signInErr = await signInRes.text();
      await logError('custom_token_signin', signInErr);
      throw new Error('Custom token sign-in failed');
    }
    const { idToken } = await signInRes.json() as { idToken: string };

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.redirect(`${appOrigin}/`);
    response.cookies.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    await logError('catch', msg);
    return NextResponse.redirect(`${appOrigin}/login?error=${encodeURIComponent(msg)}`);
  }
}
