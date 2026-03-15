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

async function checkErrors() {
  const limit = parseInt(process.argv[2] ?? '50', 10);

  const snapshot = await db
    .collection('errorLogs')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  if (snapshot.empty) {
    console.log('에러 로그가 없습니다.');
    return;
  }

  console.log(`최근 에러 로그 ${snapshot.size}건:\n`);

  for (const doc of snapshot.docs) {
    const d = doc.data();
    console.log(`[${d.timestamp}] source=${d.source} level=${d.level ?? 'error'}`);
    console.log(`  message: ${d.message}`);
    if (d.detail) console.log(`  detail:  ${d.detail}`);
    if (d.userId) console.log(`  userId:  ${d.userId}`);
    console.log();
  }
}

checkErrors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('조회 실패:', err);
    process.exit(1);
  });
