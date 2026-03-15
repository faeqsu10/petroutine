import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// .env.local 직접 파싱
const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function cleanupDuplicates() {
  const careItemsSnap = await db.collection('careItems').where('isActive', '==', true).get();

  // petId + name 조합으로 그룹핑
  const groups = new Map<string, { id: string; createdAt: string }[]>();

  for (const doc of careItemsSnap.docs) {
    const data = doc.data();
    const key = `${data.petId}::${data.name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ id: doc.id, createdAt: data.createdAt });
  }

  // 중복 찾기 (같은 key에 2개 이상)
  let totalDeleted = 0;

  for (const [key, items] of groups) {
    if (items.length <= 1) continue;

    // createdAt 기준 정렬 → 가장 오래된 것(첫 번째) 유지, 나머지 삭제
    items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const keep = items[0];
    const duplicates = items.slice(1);

    console.log(`[${key}] ${items.length}개 중 ${duplicates.length}개 삭제 (유지: ${keep.id})`);

    for (const dup of duplicates) {
      const batch = db.batch();

      // 1) careItem 비활성화
      batch.update(db.doc(`careItems/${dup.id}`), {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });

      // 2) 연결된 careSchedules 취소
      const schedulesSnap = await db.collection('careSchedules')
        .where('careItemId', '==', dup.id)
        .where('status', 'in', ['pending', 'due', 'overdue'])
        .get();

      for (const schedDoc of schedulesSnap.docs) {
        batch.update(schedDoc.ref, {
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      totalDeleted++;
    }
  }

  console.log(`\n완료: ${totalDeleted}개 중복 케어 항목 비활성화`);
}

cleanupDuplicates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('정리 실패:', err);
    process.exit(1);
  });
