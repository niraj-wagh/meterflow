'use strict';

const path = require('path');
const fs   = require('fs');
const http = require('http');   // built-in, no install needed

const BACKEND_ROOT = path.resolve(__dirname, '..');

// Parse .env manually
const envFile = path.join(BACKEND_ROOT, '.env');
if (!fs.existsSync(envFile)) {
  console.error('❌  .env not found. Run seed.js first.');
  process.exit(1);
}
fs.readFileSync(envFile, 'utf8').split(/\r?\n/).forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('=');
  if (eq === -1) return;
  const k = t.slice(0, eq).trim();
  const v = t.slice(eq + 1).trim().replace(/^["'](.*)["']$/, '$1');
  if (k && !process.env[k]) process.env[k] = v;
});

// Check node_modules
const nmPath = path.join(BACKEND_ROOT, 'node_modules');
if (!fs.existsSync(nmPath)) {
  console.error('\n❌  node_modules not found!');
  console.error('    Run: cd meterflow\\backend && npm install\n');
  process.exit(1);
}

process.chdir(BACKEND_ROOT);

let mongoose, ApiKey, User;
try {
  mongoose = require(path.join(BACKEND_ROOT, 'node_modules', 'mongoose'));
  ApiKey   = require(path.join(BACKEND_ROOT, 'models', 'ApiKey'));
  User     = require(path.join(BACKEND_ROOT, 'models', 'User'));
} catch(e) {
  console.error('\n❌  Cannot load modules:', e.message);
  console.error('    Run: cd meterflow\\backend && npm install\n');
  process.exit(1);
}

const PORT     = parseInt(process.env.PORT || '5000');
const INTERVAL = 3000;
const PATHS    = ['/pokemon/ditto','/pokemon/pikachu','/posts/1','/posts/2','/users/1','/products/1'];
const pick     = arr => arr[Math.floor(Math.random() * arr.length)];

let activeKeys = [];
let total = 0, errors = 0;

function fireRequest(keyStr, urlPath) {
  return new Promise(resolve => {
    const t0  = Date.now();
    const req = http.request(
      { hostname:'localhost', port:PORT, path:`/gateway${urlPath}`, method:'GET', headers:{ 'X-Api-Key': keyStr } },
      res => { res.resume(); resolve({ status: res.statusCode, ms: Date.now()-t0 }); }
    );
    req.on('error', ()  => resolve({ status: 0,   ms: Date.now()-t0, err: true }));
    req.setTimeout(6000, () => { req.destroy(); resolve({ status: 408, ms: 6000 }); });
    req.end();
  });
}

async function batch() {
  if (!activeKeys.length) return;
  for (let i = 0; i < 2; i++) {
    const k = pick(activeKeys);
    const p = pick(PATHS);
    const r = await fireRequest(k.key, p);
    total++;
    if (r.status === 0 || r.status >= 400) errors++;
    process.stdout.write(
      `\r  Sent: ${String(total).padStart(4)}  Errors: ${String(errors).padStart(3)}  Last: ${r.status} ${p.padEnd(24)} ${String(r.ms).padStart(4)}ms   `
    );
  }
}

async function run() {
  console.log('\n🚀  MeterFlow Traffic Simulator');
  console.log('    Connects to MongoDB to load keys, then hits the gateway\n');
  console.log('🔗  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  const dev = await User.findOne({ email: 'dev@example.com' });
  if (!dev) {
    console.error('❌  dev@example.com not found — run seed.js first!');
    process.exit(1);
  }
  activeKeys = await ApiKey.find({ owner: dev._id, status: 'active' });
  await mongoose.disconnect();

  if (!activeKeys.length) {
    console.error('❌  No active keys — run seed.js first!');
    process.exit(1);
  }
  console.log(`✅  Loaded ${activeKeys.length} active API keys\n`);
  console.log(`▶   Firing 2 requests every ${INTERVAL}ms to http://localhost:${PORT}`);
  console.log('    Make sure backend server is running (npm run dev)');
  console.log('    Press Ctrl+C to stop\n');

  await batch();
  setInterval(batch, INTERVAL);
}

run().catch(err => {
  console.error('\n❌  Error:', err.message);
  if (err.message.includes('Cannot find module')) {
    console.error('    Run: cd meterflow\\backend && npm install');
  }
  process.exit(1);
});