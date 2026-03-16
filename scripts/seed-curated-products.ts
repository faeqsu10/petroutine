import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { DEFAULT_CURATED_PRODUCTS } from '../src/lib/curated-products';

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

async function seed() {
  const now = new Date().toISOString();
  const batch = db.batch();

  for (const product of DEFAULT_CURATED_PRODUCTS) {
    const ref = db.collection('curatedProducts').doc(product.id);
    batch.set(ref, {
      ...product,
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
  }

  await batch.commit();
  console.log(`큐레이션 상품 ${DEFAULT_CURATED_PRODUCTS.length}개를 업서트했습니다.`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('큐레이션 상품 시딩 실패:', error);
    process.exit(1);
  });
