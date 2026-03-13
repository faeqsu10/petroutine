import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// .env.local 직접 파싱 (dotenv 의존성 불필요)
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

const DEFAULT_CATEGORIES = [
  { name: '사료/간식', icon: '🍖', color: '#F59E0B', sortOrder: 1 },
  { name: '의료/병원', icon: '🏥', color: '#EF4444', sortOrder: 2 },
  { name: '미용/위생', icon: '✂️', color: '#8B5CF6', sortOrder: 3 },
  { name: '용품/장난감', icon: '🧸', color: '#3B82F6', sortOrder: 4 },
  { name: '보험', icon: '🛡️', color: '#10B981', sortOrder: 5 },
  { name: '기타', icon: '📦', color: '#6B7280', sortOrder: 6 },
];

async function seed() {
  const existing = await db
    .collection('expenseCategories')
    .where('isDefault', '==', true)
    .get();

  if (!existing.empty) {
    console.log(`기본 카테고리 ${existing.size}개가 이미 존재합니다. 스킵합니다.`);
    return;
  }

  const batch = db.batch();
  const now = new Date().toISOString();

  for (const cat of DEFAULT_CATEGORIES) {
    const ref = db.collection('expenseCategories').doc();
    batch.set(ref, {
      ...cat,
      isDefault: true,
      userId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
  console.log(`기본 지출 카테고리 ${DEFAULT_CATEGORIES.length}개를 추가했습니다.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('시딩 실패:', err);
    process.exit(1);
  });
