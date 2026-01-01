// Simple smoke test runner for Safe Bazaar AI backend
// Requires Node 18+ (global fetch)

const BASE = process.env.BASE || 'http://localhost:5000/api';

function log(...args) { console.log(...args); }

async function post(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch (e) { json = txt; }
  return { status: res.status, body: json };
}

async function run() {
  log('Smoke test starting against', BASE);

  const ts = Date.now();
  const email = `smoke+${ts}@example.com`;
  const password = 'Password123!';

  log('1) Signup', email);
  const signup = await post('/auth/signup', { firstName: 'Smoke', lastName: 'Test', email, password });
  log('->', signup.status, signup.body);

  log('2) Signin');
  const signin = await post('/auth/signin', { email, password });
  log('->', signin.status, signin.body);
  if (signin.status !== 200 || !signin.body.accessToken) {
    throw new Error('Signin failed; aborting smoke tests');
  }
  const token = signin.body.accessToken;

  log('3) Perform 4 scans (expect 3 succeed, 4th fail for free user)');
  for (let i = 1; i <= 4; i++) {
    const payload = { scanType: 'fraud_check', scanQuery: `http://example.com/test-${i}` };
    const scanReq = await post('/scans/perform', payload, token);
    log(`scan #${i}:`, scanReq.status, scanReq.body && (scanReq.body.message || scanReq.body.error || JSON.stringify(scanReq.body)));
  }

  log('Smoke test completed');
}

run().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
