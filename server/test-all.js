import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { db, isUserPurged, PURGED_USERNAMES } from './db.js';
import { isFirestoreActive, getFirestore, loadAllFromFirestore } from './firestore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runComprehensiveTests() {
  console.log('================================================================');
  console.log('       HACKAAROH COMPLETE SYSTEM & LEADERBOARD TEST SUITE       ');
  console.log('================================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  // -------------------------------------------------------------
  // Test Suite 1: Database Connectivity & Health
  // -------------------------------------------------------------
  console.log('\n[Suite 1/6] Database Health & Firestore Operations:');
  const firestoreActive = isFirestoreActive();
  assert(firestoreActive, 'Cloud Firestore is connected and active');

  const firestoreDb = getFirestore();
  let writeOk = false;
  try {
    const probeDoc = firestoreDb.collection('meta').doc('system_test_probe');
    await probeDoc.set({ timestamp: Date.now() });
    await probeDoc.delete();
    writeOk = true;
  } catch (_) {}
  assert(writeOk, 'Firestore WRITE operations are unblocked');

  await db.ensureLoaded();
  const loadedData = await loadAllFromFirestore();
  assert(Boolean(loadedData && loadedData.sprint), 'Firestore READ snapshot operations loaded successfully');
  assert(Array.isArray(loadedData?.users) && loadedData.users.length > 0, `Firestore users collection loaded (${loadedData?.users?.length} users)`);
  assert(Array.isArray(loadedData?.pullRequests) && loadedData.pullRequests.length > 0, `Firestore PRs collection loaded (${loadedData?.pullRequests?.length} PRs)`);

  // -------------------------------------------------------------
  // Test Suite 2: Leaderboard Integrity & Test Participant Purge
  // -------------------------------------------------------------
  console.log('\n[Suite 2/6] Leaderboard Integrity & Zero Test Participants:');
  const leaderboard = db.getLeaderboard();
  assert(Array.isArray(leaderboard) && leaderboard.length > 0, `Leaderboard generated successfully with ${leaderboard.length} ranked contributors`);

  // Assert NO test users or banned users exist on leaderboard
  const testUsernames = ['new-hacker-9827', 'tester-gn0s', 'new-hacker-9933', 'tester-dylz', 'zpao', 'vipulreddyvemula'];
  let testUsersOnLeaderboard = 0;
  let purgedUsersOnLeaderboard = 0;

  for (const entry of leaderboard) {
    const u = entry.user;
    if (testUsernames.includes(u.username?.toLowerCase())) {
      testUsersOnLeaderboard++;
    }
    if (isUserPurged(u.username, u.name)) {
      purgedUsersOnLeaderboard++;
    }
  }

  assert(testUsersOnLeaderboard === 0, `Zero test accounts on leaderboard (Found: ${testUsersOnLeaderboard})`);
  assert(purgedUsersOnLeaderboard === 0, `Zero purged accounts on leaderboard (Found: ${purgedUsersOnLeaderboard})`);

  // Check top rank integrity
  assert(leaderboard[0].rank === 1 && leaderboard[0].totalCredits > 0, `Top contributor #${leaderboard[0].user.username} has valid rank 1 with ${leaderboard[0].totalCredits} credits`);

  // -------------------------------------------------------------
  // Test Suite 3: Pull Request Integrity & Scoring Safety
  // -------------------------------------------------------------
  console.log('\n[Suite 3/6] Pull Request Scoring & Evaluation Integrity:');
  const prs = db.getPullRequests();
  assert(Array.isArray(prs) && prs.length >= 280, `Authoritative PR collection is intact with ${prs.length} PRs`);

  let invalidScores = 0;
  let reviewedWithoutScore = 0;
  for (const pr of prs) {
    if (pr.reviewStatus === 'REVIEWED') {
      if (typeof pr.creditScore !== 'number' || pr.creditScore <= 0) {
        reviewedWithoutScore++;
      }
    }
    if (pr.creditScore < 0) {
      invalidScores++;
    }
  }
  assert(invalidScores === 0, 'Zero PRs have negative scores');
  assert(reviewedWithoutScore === 0, 'Zero reviewed PRs are missing positive credit scores');

  // -------------------------------------------------------------
  // Test Suite 4: PR Submission Pipeline Latency (<250ms)
  // -------------------------------------------------------------
  console.log('\n[Suite 4/6] PR Submission Latency Benchmark:');
  const tempPr = {
    id: `pr-benchmark-${Date.now()}`,
    githubPrNumber: 999991,
    repo: 'openverse/benchmark-test',
    title: 'test: benchmark submission pipeline latency',
    author: 'Sayandevxyz',
    url: 'https://github.com/openverse/benchmark-test/pull/999991',
    state: 'open',
    dayOfSprint: 18,
    reviewStatus: 'PENDING_REVIEW',
    creditScore: 0,
    additions: 15,
    deletions: 5,
    commitsCount: 1,
    createdAt: new Date().toISOString()
  };

  const benchStart = Date.now();
  await db.addPullRequest(tempPr);
  const benchDuration = Date.now() - benchStart;
  assert(benchDuration < 250, `PR submission completes in sub-250ms (Actual: ${benchDuration}ms)`);

  // Clean up benchmark PR
  await db.deletePullRequest(tempPr.id);
  const cleanedUp = !db.getPullRequests().some(p => p.id === tempPr.id);
  assert(cleanedUp, 'Benchmark PR cleaned up immediately without residue');

  // -------------------------------------------------------------
  // Test Suite 5: Security & Session Defense Checks
  // -------------------------------------------------------------
  console.log('\n[Suite 5/6] Security, Purged Defense & Session Verification:');
  assert(isUserPurged('rohan-satheesh'), 'Blocked banned account @rohan-satheesh');
  assert(isUserPurged('vipulreddyvemula'), 'Blocked removed account @vipulreddyvemula');
  assert(isUserPurged('new-hacker-1234'), 'Blocked dynamic test account pattern /^new-hacker-\\d+/');
  assert(isUserPurged('tester-abc1'), 'Blocked dynamic test account pattern /^tester-[a-z0-9]+/');
  assert(isUserPurged('any-user', 'Automated Tester'), 'Blocked test name Automated Tester');
  assert(isUserPurged('any-user', 'Alex Innovator'), 'Blocked test name Alex Innovator');
  assert(!isUserPurged('legitimate-participant-2026'), 'Allowed legitimate participant');

  // -------------------------------------------------------------
  // Test Suite 6: Production Live Endpoints Check
  // -------------------------------------------------------------
  console.log('\n[Suite 6/6] Production Live Endpoint Health:');
  try {
    const prodSprintRes = await fetch('https://hackaaroh-main.vercel.app/api/sprint');
    assert(prodSprintRes.ok, `Production /api/sprint returned HTTP 200 (Cache-Control: ${prodSprintRes.headers.get('cache-control') || 'none'})`);

    const prodLbRes = await fetch('https://hackaaroh-main.vercel.app/api/leaderboard');
    assert(prodLbRes.ok, `Production /api/leaderboard returned HTTP 200 (Cache-Control: ${prodLbRes.headers.get('cache-control') || 'none'})`);

    const prodPrsRes = await fetch('https://hackaaroh-main.vercel.app/api/pull-requests');
    assert(prodPrsRes.ok, `Production /api/pull-requests returned HTTP 200`);
    const prodPrs = await prodPrsRes.json();
    assert(Array.isArray(prodPrs) && prodPrs.length >= 280, `Production has full PR dataset (${prodPrs?.length} PRs)`);
  } catch (err) {
    console.error('  ✗ Production endpoints check error:', err.message);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`        TEST SUITE COMPLETED: ${passedTests}/${totalTests} TESTS PASSED        `);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runComprehensiveTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
