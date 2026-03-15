import { adminDb } from '@/lib/firebase/admin';

export async function logError(source: string, message: string, detail?: string, userId?: string) {
  try {
    await adminDb.collection('errorLogs').add({
      source,
      level: 'error',
      message,
      detail: detail ?? null,
      userId: userId ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch { /* 로깅 실패는 무시 */ }
}
