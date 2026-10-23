import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

import { getFirestore, isFirestoreActive } from './firestore.js';

const BLOB_URL = 'https://ae1nkbba9sxv7ktd.public.blob.vercel-storage.com/hackaaroh_data.json';

async function syncFirestoreToBlob() {
  console.log('========================================================');
  console.log('   FIRESTORE -> VERCEL BLOB MERGE & SYNC TOOL           ');
  console.log('========================================================\n');

  const db = getFirestore();
  if (!db) {
    console.error('❌ Could not connect to Firestore. Check credentials in .env');
    process.exit(1);
  }

  // 1. Fetch current live Blob data
  console.log('📡 Fetching current live Vercel Blob data...');
  let blobData = null;
  try {
    const blobRes = await fetch(`${BLOB_URL}?t=${Date.now()}`);
    if (blobRes.ok) {
      blobData = await blobRes.json();
      console.log(`✓ Blob loaded: ${blobData.users?.length || 0} users, ${blobData.pullRequests?.length || 0} PRs`);
    }
  } catch (err) {
    console.warn('⚠️ Could not load remote Blob, falling back to server/data.json:', err.message);
  }

  if (!blobData) {
    const localPath = path.join(__dirname, 'data.json');
    blobData = JSON.parse(fs.readFileSync(localPath, 'utf8'));
  }

  // 2. Query Firestore collections
  console.log('\n🔥 Querying Cloud Firestore for all collections...');
  let fsSprint = null;
  let fsUsers = [];
  let fsPrs = [];
  let fsLogs = [];

  try {
    const sprintDoc = await db.collection('sprints').doc('sprint-hackaaroh-current').get();
    if (sprintDoc.exists) fsSprint = sprintDoc.data();

    const usersSnap = await db.collection('users').get();
    fsUsers = usersSnap.docs.map(d => ({ ...d.data(), _docId: d.id }));

    const prsSnap = await db.collection('pullRequests').get();
    fsPrs = prsSnap.docs.map(d => ({ ...d.data(), _docId: d.id }));

    const logsSnap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(100).get();
    fsLogs = logsSnap.docs.map(d => ({ ...d.data(), _docId: d.id }));

    console.log(`✓ Firestore returned:`);
    console.log(`  - Users: ${fsUsers.length}`);
    console.log(`  - PRs:   ${fsPrs.length}`);
    console.log(`  - Logs:  ${fsLogs.length}`);
  } catch (err) {
    if (err.message.includes('Quota exceeded') || err.code === 8) {
      console.error('\n❌ Firestore is currently locked by Google: 8 RESOURCE_EXHAUSTED (Daily quota exceeded).');
      console.error('Google blocks all read/write requests until midnight PST (1:30 PM IST) or until upgraded to Blaze plan.');
      console.log('\nChecking local backup comparison instead...');

      const backupPath = path.join(__dirname, 'backups/firestore_backup_2026-10-21T05-14-28-947Z.json');
      if (fs.existsSync(backupPath)) {
        const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        fsUsers = backup.users || [];
        fsPrs = backup.pullRequests || [];
        console.log(`Loaded last Firestore backup snapshot: ${fsUsers.length} users, ${fsPrs.length} PRs.`);
      } else {
        process.exit(1);
      }
    } else {
      console.error('❌ Firestore read failed:', err.message);
      process.exit(1);
    }
  }

  // 3. Intelligent Merge: Find any PRs or Users in Firestore missing from Blob
  console.log('\n🔄 Comparing and merging any missing Firestore records...');
  const currentPrKeys = new Set((blobData.pullRequests || []).map(p => `${p.repo}#${p.githubPrNumber}`.toLowerCase()));
  const currentPrIds = new Set((blobData.pullRequests || []).map(p => String(p.id).toLowerCase()));
  const currentUsernames = new Set((blobData.users || []).map(u => u.username.toLowerCase()));

  let addedPrs = 0;
  let addedUsers = 0;

  // Merge missing users
  for (const u of fsUsers) {
    if (u.username && !currentUsernames.has(u.username.toLowerCase())) {
      blobData.users.push(u);
      currentUsernames.add(u.username.toLowerCase());
      addedUsers++;
      console.log(`  + Added missing user: @${u.username}`);
    }
  }

  // Merge missing PRs
  for (const p of fsPrs) {
    const key = `${p.repo}#${p.githubPrNumber}`.toLowerCase();
    const idKey = p.id ? String(p.id).toLowerCase() : '';
    if (!currentPrKeys.has(key) && (!idKey || !currentPrIds.has(idKey))) {
      blobData.pullRequests.unshift(p);
      currentPrKeys.add(key);
      if (idKey) currentPrIds.add(idKey);
      addedPrs++;
      console.log(`  + Added missing PR: #${p.githubPrNumber} in ${p.repo} (@${p.author})`);
    }
  }

  console.log(`\nMerge Summary: Added ${addedUsers} new users and ${addedPrs} new PRs from Firestore.`);

  if (addedUsers > 0 || addedPrs > 0) {
    // 4. Save to local data.json
    const dataPath = path.join(__dirname, 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify(blobData, null, 2), 'utf8');
    console.log('💾 Saved updated dataset to server/data.json');

    // 5. Upload to Vercel Blob
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      console.log('📤 Uploading updated dataset to Vercel Blob...');
      await put('hackaaroh_data.json', JSON.stringify(blobData, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 0,
        token
      });
      console.log('✅ Successfully synced to Vercel Blob!');
    }
  } else {
    console.log('✅ All Firestore records are already 100% present in Vercel Blob! Zero missing items.');
  }

  console.log('\n========================================================');
  console.log('🎉 SYNC COMPLETE! Total dataset:');
  console.log(`   Users:         ${blobData.users.length}`);
  console.log(`   Pull Requests: ${blobData.pullRequests.length}`);
  console.log('========================================================');
}

syncFirestoreToBlob().catch(console.error);
