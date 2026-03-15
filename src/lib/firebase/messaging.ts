// FCM 클라이언트 메시징 모듈
// getMessaging()은 SSR에서 에러나므로 반드시 dynamic import 사용

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const { getMessaging, getToken } = await import('firebase/messaging');
  const { auth, db } = await import('@/lib/firebase/client');
  const messaging = getMessaging();

  const sw = await navigator.serviceWorker.getRegistration('/');
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: sw,
  });

  // Firestore에 토큰 저장
  const uid = auth.currentUser?.uid;
  if (uid && token) {
    const { doc, setDoc } = await import('firebase/firestore');
    const tokenHash = token.substring(0, 16);
    await setDoc(doc(db, 'users', uid, 'fcmTokens', tokenHash), {
      token,
      deviceInfo: navigator.userAgent.substring(0, 100),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
  }
  return token;
}
