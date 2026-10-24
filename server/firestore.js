import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firestoreInstance = null;
let isConfigured = false;
let initError = null;

/**
 * Safely parse Firebase service account credentials from environment variables or local key file.
 */
function parseCredentials() {
  // Option 1: Full JSON string or base64 in FIREBASE_SERVICE_ACCOUNT
  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saEnv) {
    try {
      const trimmed = saEnv.trim();
      if (trimmed.startsWith('{')) {
        return JSON.parse(trimmed);
      }
      const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
      if (decoded.startsWith('{')) {
        return JSON.parse(decoded);
      }
    } catch (e) {
      console.warn('[Firebase] Warning: Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    }
  }

  // Option 2: Individual environment variables
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    };
  }

  // Option 3: GOOGLE_APPLICATION_CREDENTIALS or local serviceAccountKey.json
  const candidatePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(__dirname, '../serviceAccountKey.json'),
    path.join(__dirname, '../firebase-key.json'),
    path.join(process.cwd(), 'serviceAccountKey.json')
  ].filter(Boolean);

  for (const credPath of candidatePaths) {
    if (fs.existsSync(credPath)) {
      try {
        const content = fs.readFileSync(credPath, 'utf-8');
        return JSON.parse(content);
      } catch (e) {
        console.warn(`[Firebase] Warning: Failed to read credentials at ${credPath}:`, e.message);
      }
    }
  }

  return null;
}

/**
 * Initialize Firebase Admin SDK if credentials exist.
 */
export function initFirestore() {
  if (firestoreInstance) return firestoreInstance;

  try {
    const apps = getApps();
    if (apps.length > 0) {
      firestoreInstance = getAdminFirestore(apps[0]);
      isConfigured = true;
      return firestoreInstance;
    }

    const credentials = parseCredentials();
    if (!credentials) {
      isConfigured = false;
      return null;
    }

    const app = initializeApp({
      credential: cert(credentials)
    });

    firestoreInstance = getAdminFirestore(app);
    firestoreInstance.settings({ ignoreUndefinedProperties: true });
    isConfigured = true;
    console.log(`[Firebase] Successfully connected to Cloud Firestore (Project: ${credentials.projectId || credentials.project_id || 'active'})`);
    return firestoreInstance;
  } catch (err) {
    initError = err;
    isConfigured = false;
    console.error('[Firebase] Failed to initialize Firebase Admin SDK:', err.message);
    return null;
  }
}

export function isFirestoreActive() {
  if (firestoreInstance) return true;
  return Boolean(initFirestore());
}

export function getFirestore() {
  return initFirestore();
}

/**
 * Sanitize ID to be valid as a Firestore document ID (no '/' or other forbidden chars).
 */
export function encodeDocId(id) {
  if (!id) return 'unknown';
  return encodeURIComponent(String(id).trim().toLowerCase())
    .replace(/\./g, '%2E')
    .replace(/\//g, '%2F');
}

/**
 * Fetch all data from Firestore collections into a unified database object.
 * Checks consolidated snapshots/latest first (1 document read instead of 490 reads).
 */
export async function loadAllFromFirestore() {
  const db = getFirestore();
  if (!db) return null;

  try {
    // 0. Ultra-efficient snapshot read: 1 read instead of 490 reads!
    try {
      const snapDoc = await db.collection('snapshots').doc('latest').get();
      if (snapDoc.exists) {
        const snap = snapDoc.data();
        if (snap && snap.sprint && Array.isArray(snap.users) && Array.isArray(snap.pullRequests)) {
          return {
            sprint: snap.sprint,
            users: snap.users,
            pullRequests: snap.pullRequests,
            auditLogs: snap.auditLogs || [],
            deletedPrIds: snap.deletedPrIds || []
          };
        }
      }
    } catch (_) {
      // Fallback to individual collections if snapshot read fails or not yet populated
    }

    // 1. Fallback: Load Sprint Doc
    const sprintDoc = await db.collection('sprints').doc('sprint-hackaaroh-current').get();
    const sprint = sprintDoc.exists ? sprintDoc.data() : null;

    // 2. Load Users
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs.map(doc => doc.data());

    // 3. Load Pull Requests
    const prsSnap = await db.collection('pullRequests').get();
    const pullRequests = prsSnap.docs.map(doc => doc.data());

    // 4. Load Audit Logs (latest 80)
    let auditLogs = [];
    try {
      const logsSnap = await db.collection('auditLogs').orderBy('timestamp', 'desc').limit(80).get();
      auditLogs = logsSnap.docs.map(doc => doc.data());
    } catch (_) {
      const logsSnap = await db.collection('auditLogs').get();
      auditLogs = logsSnap.docs.map(doc => doc.data()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 80);
    }

    // 5. Load Meta (deletedPrIds)
    const metaDoc = await db.collection('meta').doc('config').get();
    const deletedPrIds = metaDoc.exists ? (metaDoc.data()?.deletedPrIds || []) : [];

    return {
      sprint,
      users,
      pullRequests,
      auditLogs,
      deletedPrIds
    };
  } catch (err) {
    console.error('[Firebase] Error loading collections from Firestore:', err.message);
    return null;
  }
}

/**
 * Save consolidated database snapshot to Firestore (1 write, speeds up reads 490x).
 */
export async function saveSnapshotToFirestore(data) {
  const db = getFirestore();
  if (!db || !data?.sprint) return;
  try {
    await db.collection('snapshots').doc('latest').set({
      sprint: data.sprint,
      users: data.users || [],
      pullRequests: data.pullRequests || [],
      auditLogs: (data.auditLogs || []).slice(0, 80),
      deletedPrIds: data.deletedPrIds || [],
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Firebase] Error saving snapshot to Firestore:', err.message);
  }
}

/**
 * Save Sprint details to Firestore.
 */
export async function saveSprintToFirestore(sprintData) {
  const db = getFirestore();
  if (!db) return;
  await db.collection('sprints').doc('sprint-hackaaroh-current').set(sprintData, { merge: true });
}

/**
 * Save or update a single User in Firestore.
 */
export async function saveUserToFirestore(user) {
  const db = getFirestore();
  if (!db || !user?.username) return;
  const docId = encodeDocId(user.username);
  await db.collection('users').doc(docId).set(user, { merge: true });
}

/**
 * Delete a user from Firestore.
 */
export async function deleteUserFromFirestore(username) {
  const db = getFirestore();
  if (!db || !username) return;
  const docId = encodeDocId(username);
  await db.collection('users').doc(docId).delete();

  // Also remove their pull requests
  const prsSnap = await db.collection('pullRequests').where('author', '==', username).get();
  const batch = db.batch();
  prsSnap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

/**
 * Save or update a Pull Request in Firestore.
 */
export async function savePullRequestToFirestore(pr) {
  const db = getFirestore();
  if (!db || !pr?.id) return;
  const docId = encodeDocId(pr.id);
  await db.collection('pullRequests').doc(docId).set(pr, { merge: true });
}

/**
 * Delete a Pull Request from Firestore and track in deletedPrIds.
 */
export async function deletePullRequestFromFirestore(prId) {
  const db = getFirestore();
  if (!db || !prId) return;
  const docId = encodeDocId(prId);
  await db.collection('pullRequests').doc(docId).delete();

  const metaRef = db.collection('meta').doc('config');
  await db.runTransaction(async (t) => {
    const doc = await t.get(metaRef);
    const existing = doc.exists ? (doc.data()?.deletedPrIds || []) : [];
    const normalized = String(prId).trim().toLowerCase();
    if (!existing.includes(normalized)) {
      t.set(metaRef, { deletedPrIds: [...existing, normalized] }, { merge: true });
    }
  });
}

/**
 * Append an Audit Log entry in Firestore.
 */
export async function saveAuditLogToFirestore(entry) {
  const db = getFirestore();
  if (!db || !entry?.id) return;
  const docId = encodeDocId(entry.id);
  await db.collection('auditLogs').doc(docId).set(entry);
}

/**
 * Seed or overwrite Firestore from an entire data bundle.
 */
export async function seedFirestoreFromData(data) {
  const db = getFirestore();
  if (!db || !data) return;

  console.log('[Firebase] Seeding Firestore with database bundle...');
  const batch = db.batch();

  if (data.sprint) {
    batch.set(db.collection('sprints').doc('sprint-hackaaroh-current'), data.sprint, { merge: true });
  }

  if (Array.isArray(data.users)) {
    data.users.forEach(u => {
      if (u.username) {
        batch.set(db.collection('users').doc(encodeDocId(u.username)), u, { merge: true });
      }
    });
  }

  if (Array.isArray(data.pullRequests)) {
    data.pullRequests.forEach(pr => {
      if (pr.id) {
        batch.set(db.collection('pullRequests').doc(encodeDocId(pr.id)), pr, { merge: true });
      }
    });
  }

  if (Array.isArray(data.auditLogs)) {
    data.auditLogs.slice(0, 80).forEach(log => {
      if (log.id) {
        batch.set(db.collection('auditLogs').doc(encodeDocId(log.id)), log, { merge: true });
      }
    });
  }

  if (Array.isArray(data.deletedPrIds)) {
    batch.set(db.collection('meta').doc('config'), { deletedPrIds: data.deletedPrIds }, { merge: true });
  }

  await batch.commit();
  console.log('[Firebase] Successfully seeded Cloud Firestore!');
}
