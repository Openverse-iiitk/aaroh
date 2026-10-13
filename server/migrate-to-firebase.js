import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initFirestore, isFirestoreActive, seedFirestoreFromData, loadAllFromFirestore } from './firestore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files
dotenv.config({ path: path.join(__dirname, '../.env') });
if (fs.existsSync(path.join(__dirname, '../.env.local'))) {
  dotenv.config({ path: path.join(__dirname, '../.env.local') });
}

async function runMigration() {
  console.log('==================================================');
  console.log('   HACKAAROH -> FIREBASE FIRESTORE MIGRATION TOOL  ');
  console.log('==================================================\n');

  const db = initFirestore();
  if (!db || !isFirestoreActive()) {
    console.error('❌ Firebase credentials not detected!\n');
    console.log('Please provide your Firebase credentials using ONE of the following methods in .env or .env.local:');
    console.log('\nMethod 1: Place serviceAccountKey.json in the project root');
    console.log('  Download from: Firebase Console -> Project Settings -> Service accounts -> Generate new private key');
    console.log('\nMethod 2: Set FIREBASE_SERVICE_ACCOUNT in .env:');
    console.log('  FIREBASE_SERVICE_ACCOUNT=\'{"type":"service_account","project_id":"...","private_key":"..."}\'');
    console.log('\nMethod 3: Set individual variables in .env:');
    console.log('  FIREBASE_PROJECT_ID=your-project-id');
    console.log('  FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com');
    console.log('  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    console.log('\n==================================================');
    process.exit(1);
  }

  const dataFile = path.join(__dirname, 'data.json');
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ Source data file not found at: ${dataFile}`);
    process.exit(1);
  }

  console.log(`📖 Reading source data from ${dataFile}...`);
  const raw = fs.readFileSync(dataFile, 'utf-8');
  const sourceData = JSON.parse(raw);

  console.log(`Found:`);
  console.log(`- Sprint: ${sourceData.sprint?.name || 'Unnamed'}`);
  console.log(`- Users: ${(sourceData.users || []).length}`);
  console.log(`- Pull Requests: ${(sourceData.pullRequests || []).length}`);
  console.log(`- Audit Logs: ${(sourceData.auditLogs || []).length}`);

  console.log('\n🚀 Uploading collections to Cloud Firestore...');
  await seedFirestoreFromData(sourceData);

  console.log('\n🔍 Verifying data stored in Firestore...');
  const remote = await loadAllFromFirestore();

  console.log('\n✅ Verification result:');
  console.log(`- Sprint doc: ${remote?.sprint ? 'Verified (id: ' + remote.sprint.id + ')' : 'Missing'}`);
  console.log(`- Users in Firestore: ${(remote?.users || []).length}`);
  console.log(`- PRs in Firestore: ${(remote?.pullRequests || []).length}`);
  console.log(`- Audit Logs in Firestore: ${(remote?.auditLogs || []).length}`);

  console.log('\n==================================================');
  console.log('🎉 Migration to Firebase Cloud Firestore COMPLETE!');
  console.log('Your backend is now synchronized with Cloud Firestore.');
  console.log('==================================================');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
