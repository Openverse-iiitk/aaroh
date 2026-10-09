import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Run the real API client with browser globals, without adding a test framework.
const source = readFileSync(new URL('../src/api/client.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

function createClient({ response, ok = true, url = 'https://aaroh.test/leaderboard', stored = {} }) {
  const storage = new Map(Object.entries(stored));
  const requests = [];
  const window = {
    location: new URL(url),
    history: {
      replaceState(_state, _title, nextUrl) {
        window.location = new URL(nextUrl);
      },
    },
  };
  const exports = {};
  runInNewContext(outputText, {
    exports,
    URL,
    URLSearchParams,
    window,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key),
    },
    fetch: async (requestUrl, options) => {
      requests.push({ url: requestUrl, ...options });
      return { ok, json: async () => response };
    },
  });
  return { client: exports, storage, requests, window };
}

for (const username of [
  'vipulreddyvemula', 'VIPULREDDYVEMULA', 'rohan-satheesh', 'deva4509',
  'manav-codes', 'sarah-dev', 'admin-starlit', 'ptr25', 'another-contributor',
]) {
  test(`keeps the server-verified session for ${username}`, async () => {
    const user = { username, role: 'contributor' };
    const { client, storage } = createClient({
      response: { user },
      stored: { reflect_session_token: 'verified-session' },
    });

    assert.deepEqual(await client.fetchCurrentUser(), user);
    assert.equal(storage.get('reflect_session_token'), 'verified-session');
    assert.equal(storage.get('reflect_active_user'), username);
    assert.deepEqual(await client.fetchCurrentUser(), user);
  });
}

test('restores an OAuth session and removes only the token from the redirect URL', async () => {
  const user = { username: 'vipulreddyvemula', role: 'contributor' };
  const { client, storage, requests, window } = createClient({
    response: { user },
    url: 'https://aaroh.test/leaderboard?token=fresh-session&tab=mine#results',
    stored: { reflect_admin_token: 'old-admin-session' },
  });

  assert.deepEqual(await client.fetchCurrentUser(), user);
  assert.equal(storage.get('reflect_session_token'), 'fresh-session');
  assert.equal(requests[0].url, '/api/auth/me');
  assert.equal(requests[0].credentials, 'include');
  assert.equal(requests[0].headers.Authorization, 'Bearer fresh-session');
  assert.equal(requests[0].headers['x-session-token'], 'fresh-session');
  assert.equal(window.location.href, 'https://aaroh.test/leaderboard?tab=mine#results');

  assert.deepEqual(await client.fetchCurrentUser(), user);
  assert.equal(requests[1].headers.Authorization, 'Bearer fresh-session');
});

test('restores a cookie-authenticated session without a local token', async () => {
  const user = { username: 'vipulreddyvemula', role: 'contributor' };
  const { client, storage, requests } = createClient({ response: { user } });

  assert.deepEqual(await client.fetchCurrentUser(), user);
  assert.equal(requests[0].credentials, 'include');
  assert.equal(requests[0].headers.Authorization, undefined);
  assert.equal(storage.get('reflect_active_user'), user.username);
});

for (const scenario of [
  { name: 'rejected authentication', ok: false, response: {} },
  { name: 'no authenticated user', response: { user: null } },
  { name: 'participant logins paused', response: { user: null, paused: true } },
  { name: 'a paused user response', response: { user: { username: 'participant' }, paused: true } },
]) {
  test(`clears stored credentials when the server reports ${scenario.name}`, async () => {
    const { client, storage } = createClient({
      ...scenario,
      stored: {
        reflect_session_token: 'old-session',
        reflect_admin_token: 'old-admin-session',
        reflect_active_user: 'participant',
      },
    });

    assert.equal(await client.fetchCurrentUser(), null);
    assert.equal(storage.size, 0);
  });
}
