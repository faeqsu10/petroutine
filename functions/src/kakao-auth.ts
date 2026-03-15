import { onRequest } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (getApps().length === 0) initializeApp();

export const kakaoAuth = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { accessToken } = req.body;
    if (!accessToken) {
      res.status(400).json({ error: 'Missing accessToken' });
      return;
    }

    try {
      // 카카오 API로 사용자 정보 조회
      const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!kakaoRes.ok) throw new Error('Kakao API failed');
      const kakaoUser = await kakaoRes.json() as {
        id: number;
        kakao_account?: { email?: string };
        properties?: { nickname?: string; profile_image?: string };
      };

      const uid = `kakao:${kakaoUser.id}`;
      const email = kakaoUser.kakao_account?.email ?? null;
      const displayName = kakaoUser.properties?.nickname ?? '';
      const photoURL = kakaoUser.properties?.profile_image ?? null;

      // Firebase 사용자 생성 또는 업데이트
      const auth = getAuth();
      try {
        await auth.updateUser(uid, { displayName, photoURL: photoURL ?? undefined, ...(email ? { email } : {}) });
      } catch {
        await auth.createUser({ uid, displayName, photoURL: photoURL ?? undefined, ...(email ? { email } : {}) });
      }

      // Custom Token 발급
      const customToken = await auth.createCustomToken(uid);
      res.status(200).json({ customToken });
    } catch (error) {
      console.error('Kakao auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
);
