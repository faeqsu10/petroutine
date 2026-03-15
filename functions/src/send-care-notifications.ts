import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();
const db = getFirestore();

export const sendCareNotifications = onSchedule(
  { schedule: 'every day 00:00', timeZone: 'Asia/Seoul' },
  async () => {
    // 오늘 날짜 (KST)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const todayStr = kstDate.toISOString().split('T')[0];

    // 오늘 예정된 케어 스케줄 조회
    const schedulesSnap = await db.collection('careSchedules')
      .where('nextDueDate', '==', todayStr)
      .where('status', 'in', ['pending', 'due'])
      .get();

    if (schedulesSnap.empty) return;

    // careItem 정보 조회
    const careItemIds = [...new Set(schedulesSnap.docs.map(d => d.data().careItemId))];
    const careItemsMap = new Map<string, FirebaseFirestore.DocumentData>();
    for (const chunk of chunkArray(careItemIds, 10)) {
      const snap = await db.collection('careItems').where('__name__', 'in', chunk).get();
      snap.docs.forEach(d => careItemsMap.set(d.id, d.data()));
    }

    // userId별 그룹핑 (알림 활성 항목만)
    const userItems = new Map<string, string[]>();
    for (const scheduleDoc of schedulesSnap.docs) {
      const { careItemId } = scheduleDoc.data();
      const careItem = careItemsMap.get(careItemId);
      if (!careItem || !careItem.isActive || !careItem.notifyEnabled) continue;

      const userId = careItem.userId;
      if (!userItems.has(userId)) userItems.set(userId, []);
      userItems.get(userId)!.push(careItem.name);
    }

    // 사용자별 알림 발송
    const messaging = getMessaging();
    for (const [userId, itemNames] of userItems) {
      try {
        // 알림 설정 확인
        const settingsSnap = await db.doc(`users/${userId}/notificationSettings/general`).get();
        const settings = settingsSnap.data();
        if (settings && settings.globalEnabled === false) continue;

        // FCM 토큰 조회
        const tokensSnap = await db.collection(`users/${userId}/fcmTokens`).get();
        if (tokensSnap.empty) continue;
        const tokens = tokensSnap.docs.map(d => d.data().token as string);

        // 메시지 구성
        const title = 'Petroutine 케어 알림';
        const body = itemNames.length === 1
          ? `오늘 ${itemNames[0]} 예정이에요`
          : `오늘 ${itemNames.length}개 케어가 예정되어 있어요`;

        // 발송
        const result = await messaging.sendEachForMulticast({
          tokens,
          notification: { title, body },
          webpush: { fcmOptions: { link: '/care' } },
        });

        // 실패한 토큰 정리
        result.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
            const tokenDoc = tokensSnap.docs[idx];
            tokenDoc.ref.delete();
          }
        });
      } catch (err) {
        console.error(`Failed to send notification to user ${userId}:`, err);
      }
    }
  }
);

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
