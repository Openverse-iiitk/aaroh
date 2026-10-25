import crypto from 'crypto';
import { db, isUserPurged } from './db.js';

async function runAuthTests() {
  console.log('====================================================');
  console.log('         HACKAAROH AUTHENTICATION TEST SUITE         ');
  console.log('====================================================');

  const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.ADMIN_SECRET_KEY || 'aaroh-admin-2026') + '_event_kickoff_clean_2026_x7a91';

  // Helper to create token matching the server logic
  function makeToken(username, role = 'contributor', isAdmin = false, name = null, avatarUrl = null) {
    const payload = JSON.stringify({
      u: username,
      r: role,
      adm: Boolean(isAdmin),
      gh: null,
      n: name || username,
      av: avatarUrl || `https://avatars.githubusercontent.com/u/${username}?v=4`,
      t: Date.now()
    });
    const b64 = Buffer.from(payload).toString('base64url');
    const sig = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
    return `${b64}.${sig}`;
  }

  // 1. Test Purged User Detection
  console.log('\n[Test 1/5] Purged User Defense Check:');
  const purgedBanned = isUserPurged('rohan-satheesh');
  const legitimateAllowed = isUserPurged('fresh-contributor-2026');
  console.log(`  - Banned user 'rohan-satheesh' blocked: ${purgedBanned ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`  - Legitimate new user 'fresh-contributor-2026' allowed: ${!legitimateAllowed ? 'PASS ✓' : 'FAIL ✗'}`);

  // 2. Test GitHub OAuth URL Endpoint
  console.log('\n[Test 2/5] GitHub OAuth URL Configuration:');
  try {
    const res = await fetch('http://localhost:3001/api/auth/github/url');
    const data = await res.json();
    console.log(`  - Configured: ${data.configured}`);
    console.log(`  - URL present: ${Boolean(data.url)}`);
    console.log(`  - Redirect URI: ${data.redirectUri}`);
    if (data.configured && data.url) {
      console.log('  PASS ✓ GitHub OAuth URL is valid.');
    } else {
      console.log('  WARNING: GitHub OAuth is not configured on local.');
    }
  } catch (err) {
    console.error('  FAIL ✗ Could not reach local server:', err.message);
  }

  // 3. Test Brand New Account Self-Healing via /api/auth/me
  console.log('\n[Test 3/5] Brand New Account Authentication & Self-Healing:');
  const newAccountUsername = `new-hacker-${Date.now().toString().slice(-4)}`;
  const newAccountName = 'Alex Innovator';
  const newAccountToken = makeToken(newAccountUsername, 'contributor', false, newAccountName);

  try {
    const res = await fetch('http://localhost:3001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${newAccountToken}`,
        'x-session-token': newAccountToken
      }
    });
    const data = await res.json();
    console.log(`  - HTTP status: ${res.status}`);
    console.log(`  - User object returned:`, data.user ? {
      username: data.user.username,
      name: data.user.name,
      role: data.user.role
    } : 'null');

    if (data.user && data.user.username.toLowerCase() === newAccountUsername.toLowerCase()) {
      console.log('  PASS ✓ Brand new account successfully authenticated and self-healed into database!');
    } else {
      console.error('  FAIL ✗ Server rejected new account session token.');
    }
  } catch (err) {
    console.error('  FAIL ✗ Error testing /api/auth/me:', err.message);
  }

  // 4. Test Mock-Login Endpoint for New User
  console.log('\n[Test 4/5] Mock-Login Flow for New User:');
  const mockUsername = `tester-${Math.random().toString(36).substring(2, 6)}`;
  try {
    const res = await fetch('http://localhost:3001/api/auth/mock-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: mockUsername,
        name: 'Automated Tester',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      })
    });
    const data = await res.json();
    console.log(`  - Mock login status: ${res.status}`);
    console.log(`  - Returned user:`, data.user?.username);
    console.log(`  - Token issued: ${Boolean(data.token)}`);

    if (data.user && data.token) {
      // Now verify this token works on /api/auth/me
      const meRes = await fetch('http://localhost:3001/api/auth/me', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      const meData = await meRes.json();
      console.log(`  - /api/auth/me verification: ${meData.user?.username === mockUsername ? 'PASS ✓' : 'FAIL ✗'}`);
    } else {
      console.error('  FAIL ✗ Mock login failed:', data);
    }
  } catch (err) {
    console.error('  FAIL ✗ Mock login error:', err.message);
  }

  // 5. Test Production API (/api/auth/github/url and /api/sprint)
  console.log('\n[Test 5/5] Production Live Endpoint Checks:');
  try {
    const prodSprint = await fetch('https://hackaaroh-main.vercel.app/api/sprint').then(r => r.json());
    console.log(`  - Production Sprint status: ${prodSprint.status}`);
    console.log(`  - Production loginsPaused: ${prodSprint.loginsPaused}`);
    if (!prodSprint.loginsPaused && prodSprint.status === 'ACTIVE') {
      console.log('  PASS ✓ Live event is active and logins are not paused.');
    } else {
      console.log('  WARNING: Logins may be paused on production.');
    }

    const prodAuthUrl = await fetch('https://hackaaroh-main.vercel.app/api/auth/github/url').then(r => r.json());
    console.log(`  - Production GitHub OAuth configured: ${prodAuthUrl.configured}`);
    if (prodAuthUrl.configured) {
      console.log('  PASS ✓ Production GitHub OAuth is properly configured.');
    }
  } catch (err) {
    console.error('  FAIL ✗ Production check error:', err.message);
  }

  console.log('\n====================================================');
  console.log('             AUTHENTICATION TESTS FINISHED           ');
  console.log('====================================================\n');
}

runAuthTests().catch(console.error);
