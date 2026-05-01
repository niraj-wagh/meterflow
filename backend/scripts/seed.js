'use strict';

const path = require('path');
const fs   = require('fs');

// ── Step 1: Resolve backend root ─────────────────────────────────────────────
const BACKEND_ROOT = path.resolve(__dirname, '..');

// ── Step 2: Parse .env manually (no dotenv package needed) ───────────────────
const envFile = path.join(BACKEND_ROOT, '.env');
if (!fs.existsSync(envFile)) {
  console.error('\n❌  .env file not found!');
  console.error('    Do this first:');
  console.error('    cd meterflow/backend');
  console.error('    copy .env.example .env     (Windows)');
  console.error('    cp .env.example .env       (Mac/Linux)');
  console.error('    Then add your MONGO_URI\n');
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
console.log('\n✅  .env loaded');

if (!process.env.MONGO_URI) {
  console.error('❌  MONGO_URI is missing from your .env file');
  console.error('    Add this line to .env:');
  console.error('    MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/meterflow\n');
  process.exit(1);
}

// ── Step 3: Check node_modules exists ────────────────────────────────────────
const nmPath = path.join(BACKEND_ROOT, 'node_modules');
if (!fs.existsSync(nmPath)) {
  console.error('\n❌  node_modules not found!');
  console.error('    You must run this first:');
  console.error('    cd meterflow\\backend');
  console.error('    npm install\n');
  process.exit(1);
}

// ── Step 4: Add backend to module resolution path ─────────────────────────────
process.chdir(BACKEND_ROOT);
// Patch module paths so requires resolve from backend root
const Module = require('module');
const _orig = Module._resolveFilename.bind(Module);
Module._resolveFilename = function(request, parent, isMain, options) {
  return _orig(request, parent, isMain, options);
};
// Force NODE_PATH to backend root
process.env.NODE_PATH = BACKEND_ROOT;
Module._initPaths();

// ── Step 5: Load packages ─────────────────────────────────────────────────────
let mongoose, bcrypt;
try {
  mongoose = require(path.join(BACKEND_ROOT, 'node_modules', 'mongoose'));
  bcrypt   = require(path.join(BACKEND_ROOT, 'node_modules', 'bcryptjs'));
} catch (e) {
  console.error('\n❌  Cannot load packages:', e.message);
  console.error('    Run: cd meterflow\\backend && npm install\n');
  process.exit(1);
}

// ── Step 6: Load models using absolute paths ──────────────────────────────────
const User     = require(path.join(BACKEND_ROOT, 'models', 'User'));
const Api      = require(path.join(BACKEND_ROOT, 'models', 'Api'));
const ApiKey   = require(path.join(BACKEND_ROOT, 'models', 'ApiKey'));
const UsageLog = require(path.join(BACKEND_ROOT, 'models', 'UsageLog'));
const Billing  = require(path.join(BACKEND_ROOT, 'models', 'Billing'));
const Webhook  = require(path.join(BACKEND_ROOT, 'models', 'Webhook'));
const AuditLog = require(path.join(BACKEND_ROOT, 'models', 'AuditLog'));

console.log('✅  Models loaded\n');

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand = (mn, mx) => Math.floor(Math.random() * (mx - mn + 1)) + mn;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const ENDPOINTS = ['/pokemon/ditto','/pokemon/pikachu','/pokemon/charizard','/posts/1','/posts/2','/users/1','/products/1','/weather/mumbai','/coins/bitcoin'];
const METHODS   = ['GET','GET','GET','POST','GET','PUT'];
const STATUS    = [200,200,200,200,201,200,200,400,404,500];
const IPS       = ['103.21.244.0','192.168.1.1','10.0.0.5','52.14.200.100','185.220.101.45'];
const AGENTS    = ['Mozilla/5.0 (Windows)','PostmanRuntime/7.36','axios/1.6.2','curl/7.88.1'];

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🔗  Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected!\n');

  // Clear old seed
  console.log('🗑   Removing old seed data...');
  await Promise.all([
    User.deleteMany({ email: { $in: ['admin@meterflow.com','dev@example.com','alice@startup.com','bob@corp.com'] } }),
    Api.deleteMany({ name:  { $in: ['PokéAPI Gateway','JSONPlaceholder','Weather API','CoinGecko Crypto','DummyJSON Products'] } }),
  ]);
  console.log('    Done\n');

  // ── Admin ─────────────────────────────────────────────────────────────────
  console.log('👑  Creating Admin account...');
  const admin = await User.create({
    name: 'Admin User', email: 'admin@meterflow.com', password: 'admin123',
    role: 'admin', plan: 'enterprise', isActive: true, isEmailVerified: true,
    company: 'MeterFlow Inc.',
    planLimits: { requestsPerMonth: 10000000, apisAllowed: 999, keysPerApi: 999 },
    lastLogin: new Date(),
  });
  console.log('    Email   : admin@meterflow.com');
  console.log('    Password: admin123\n');

  // ── Developer ─────────────────────────────────────────────────────────────
  console.log('👤  Creating Developer account...');
  const dev = await User.create({
    name: 'Dev Developer', email: 'dev@example.com', password: 'password123',
    role: 'api_owner', plan: 'pro', isActive: true, isEmailVerified: true,
    company: 'Startup Labs',
    planLimits: { requestsPerMonth: 100000, apisAllowed: 20, keysPerApi: 50 },
    lastLogin: new Date(Date.now() - 7200000),
  });
  console.log('    Email   : dev@example.com');
  console.log('    Password: password123\n');

  // ── Extra users ───────────────────────────────────────────────────────────
  console.log('👥  Creating extra users...');
  const hashed = await bcrypt.hash('password123', 12);
  const extras = await User.insertMany([
    { name:'Alice Startup', email:'alice@startup.com', password:hashed, role:'api_owner', plan:'free',  isActive:true, company:'AlphaTech', planLimits:{requestsPerMonth:1000,  apisAllowed:3,  keysPerApi:5},  lastLogin:new Date(Date.now()-86400000) },
    { name:'Bob Corp',      email:'bob@corp.com',     password:hashed, role:'api_owner', plan:'pro',   isActive:true, company:'BigCorp',   planLimits:{requestsPerMonth:100000, apisAllowed:20, keysPerApi:50}, lastLogin:new Date(Date.now()-18000000) },
  ]);
  console.log('    alice@startup.com (free plan)');
  console.log('    bob@corp.com (pro plan)\n');

  // ── APIs ──────────────────────────────────────────────────────────────────
  console.log('🔌  Creating APIs...');
  const apis = await Api.insertMany([
    { owner:dev._id, name:'PokéAPI Gateway',    description:'Pokemon data via MeterFlow',        baseUrl:'https://pokeapi.co/api/v2',            version:'v2', category:'data',    status:'active',   isPublic:true,  rateLimit:{requestsPerMinute:60, requestsPerHour:1000,requestsPerDay:10000}, pricing:{model:'per_request',freeRequests:1000,pricePerRequest:0.005,currency:'INR'}, tags:['pokemon','data'],    totalRequests:4280, totalRevenue:16.4 },
    { owner:dev._id, name:'JSONPlaceholder',    description:'Fake REST API for testing',          baseUrl:'https://jsonplaceholder.typicode.com', version:'v1', category:'data',    status:'active',   isPublic:true,  rateLimit:{requestsPerMinute:100,requestsPerHour:2000,requestsPerDay:20000}, pricing:{model:'per_request',freeRequests:2000,pricePerRequest:0.003,currency:'INR'}, tags:['rest','test'],       totalRequests:2100, totalRevenue:0.3  },
    { owner:dev._id, name:'Weather API',        description:'Real-time weather worldwide',         baseUrl:'https://wttr.in',                      version:'v1', category:'weather', status:'active',   isPublic:false, rateLimit:{requestsPerMinute:30, requestsPerHour:500, requestsPerDay:5000},  pricing:{model:'per_request',freeRequests:500, pricePerRequest:0.01, currency:'INR'}, tags:['weather'],            totalRequests:980,  totalRevenue:4.8  },
    { owner:dev._id, name:'CoinGecko Crypto',   description:'Crypto prices and market data',      baseUrl:'https://api.coingecko.com/api/v3',     version:'v3', category:'finance', status:'active',   isPublic:false, rateLimit:{requestsPerMinute:50, requestsPerHour:1000,requestsPerDay:10000}, pricing:{model:'per_request',freeRequests:1000,pricePerRequest:0.008,currency:'INR'}, tags:['crypto','finance'],  totalRequests:1560, totalRevenue:4.48 },
    { owner:dev._id, name:'DummyJSON Products', description:'Fake product catalog for testing',   baseUrl:'https://dummyjson.com',                version:'v1', category:'data',    status:'inactive', isPublic:false, rateLimit:{requestsPerMinute:60, requestsPerHour:1000,requestsPerDay:10000}, pricing:{model:'free',       freeRequests:1000,pricePerRequest:0,   currency:'INR'}, tags:['ecommerce'],          totalRequests:340,  totalRevenue:0    },
  ]);
  apis.forEach(a => console.log(`    ✓ ${a.name} (${a.status})`));
  console.log();

  // ── API Keys ──────────────────────────────────────────────────────────────
  console.log('🔑  Creating API Keys...');
  const keys = await ApiKey.insertMany([
    { api:apis[0]._id, owner:dev._id, name:'Production Key',  key:'mf_prod_poke_a1b2c3d4e5f6789012345678', status:'active',  totalRequests:3200, lastUsed:new Date(Date.now()-1800000)  },
    { api:apis[0]._id, owner:dev._id, name:'Staging Key',     key:'mf_stag_poke_b2c3d4e5f6789012345678a1', status:'active',  totalRequests:1080, lastUsed:new Date(Date.now()-7200000)  },
    { api:apis[1]._id, owner:dev._id, name:'Dev Key',         key:'mf_dev_json_c3d4e5f6789012345678a1b2',  status:'active',  totalRequests:2100, lastUsed:new Date(Date.now()-3600000)  },
    { api:apis[2]._id, owner:dev._id, name:'Weather Prod',    key:'mf_prod_wthr_d4e5f6789012345678a1b2c3', status:'active',  totalRequests:980,  lastUsed:new Date(Date.now()-2700000)  },
    { api:apis[3]._id, owner:dev._id, name:'Crypto Key',      key:'mf_prod_coin_e5f6789012345678a1b2c3d4', status:'active',  totalRequests:1560, lastUsed:new Date(Date.now()-600000)   },
    { api:apis[0]._id, owner:dev._id, name:'Old Revoked Key', key:'mf_revk_poke_f6789012345678a1b2c3d4e5', status:'revoked', totalRequests:200  },
  ]);
  keys.forEach(k => console.log(`    ✓ ${k.name} → ${k.key} (${k.status})`));
  console.log();

  // ── Usage Logs ────────────────────────────────────────────────────────────
  console.log('📊  Generating 2400 usage logs (30 days of traffic)...');
  const logs = [];
  const msIn30Days = 30 * 24 * 3600000;
  const activeKeys = keys.filter(k => k.status === 'active');
  for (let i = 0; i < 2400; i++) {
    const apiIdx = pick([0,0,0,1,1,2,3,4]);
    const api    = apis[Math.min(apiIdx, apis.length-1)];
    const key    = activeKeys.find(k => k.api.toString() === api._id.toString()) || activeKeys[0];
    const sc     = pick(STATUS);
    const lat    = sc >= 500 ? rand(800,3000) : sc >= 400 ? rand(200,800) : rand(50,600);
    logs.push({
      apiKey:key._id, api:api._id, user:dev._id,
      endpoint:pick(ENDPOINTS), method:pick(METHODS),
      statusCode:sc, latency:lat, isError:sc>=400,
      errorMessage:sc>=400 ? `HTTP ${sc}` : undefined,
      ipAddress:pick(IPS), userAgent:pick(AGENTS),
      responseSize:rand(200,8000), cost:sc<400?0.005:0,
      timestamp:new Date(Date.now() - rand(0, msIn30Days)),
    });
  }
  await UsageLog.insertMany(logs);
  console.log('    ✓ 2400 log entries created\n');

  // ── Billing ───────────────────────────────────────────────────────────────
  console.log('💰  Creating billing records...');
  const bills = [];
  for (let m = 0; m < 3; m++) {
    const d     = new Date();
    const start = new Date(d.getFullYear(), d.getMonth()-m, 1);
    const end   = new Date(d.getFullYear(), d.getMonth()-m+1, 0);
    const reqs  = rand(800,4500);
    const free  = Math.min(reqs,1000);
    const bill  = Math.max(0,reqs-free);
    bills.push({
      user:dev._id, period:{start,end},
      totalRequests:reqs, billableRequests:bill, freeRequests:free,
      amount:parseFloat((bill*0.005).toFixed(2)), currency:'INR',
      status: m===0 ? 'pending' : 'paid',
      paidAt: m===0 ? undefined : new Date(end.getTime()+2*86400000),
      breakdown:[
        { api:apis[0]._id, apiName:'PokéAPI Gateway', requests:Math.round(reqs*0.45), freeRequests:Math.min(Math.round(reqs*0.45),500), billableRequests:Math.max(0,Math.round(reqs*0.45)-500), amount:parseFloat((Math.max(0,Math.round(reqs*0.45)-500)*0.005).toFixed(2)) },
        { api:apis[1]._id, apiName:'JSONPlaceholder',  requests:Math.round(reqs*0.30), freeRequests:Math.min(Math.round(reqs*0.30),300), billableRequests:Math.max(0,Math.round(reqs*0.30)-300), amount:parseFloat((Math.max(0,Math.round(reqs*0.30)-300)*0.003).toFixed(2)) },
        { api:apis[2]._id, apiName:'Weather API',      requests:Math.round(reqs*0.25), freeRequests:Math.min(Math.round(reqs*0.25),200), billableRequests:Math.max(0,Math.round(reqs*0.25)-200), amount:parseFloat((Math.max(0,Math.round(reqs*0.25)-200)*0.01).toFixed(2))  },
      ],
    });
  }
  await Billing.insertMany(bills);
  console.log('    ✓ 3 billing records (2 paid, 1 pending)\n');

  // ── Webhooks ──────────────────────────────────────────────────────────────
  console.log('🔔  Creating webhooks...');
  await Webhook.insertMany([
    { user:dev._id, name:'Slack Billing Alerts', url:'https://hooks.slack.com/services/T000/B000/demo', events:['billing.invoice_created','usage.limit_reached'],    isActive:true },
    { user:dev._id, name:'Rate Limit Notifier',  url:'https://webhook.site/demo-endpoint',              events:['api.rate_limit_exceeded','usage.threshold'],        isActive:true },
  ]);
  console.log('    ✓ 2 webhooks\n');

  // ── Audit Logs ────────────────────────────────────────────────────────────
  console.log('📋  Creating audit logs...');
  const auditRows = [
    { user:admin._id,     action:'USER_LOGIN',        ipAddress:'103.21.244.0',   status:'success' },
    { user:dev._id,       action:'USER_REGISTER',     ipAddress:'192.168.1.1',    status:'success' },
    { user:dev._id,       action:'USER_LOGIN',        ipAddress:'192.168.1.1',    status:'success' },
    { user:dev._id,       action:'API_CREATED',       ipAddress:'192.168.1.1',    status:'success', resourceId:apis[0]._id },
    { user:dev._id,       action:'API_CREATED',       ipAddress:'192.168.1.1',    status:'success', resourceId:apis[1]._id },
    { user:dev._id,       action:'API_KEY_GENERATED', ipAddress:'192.168.1.1',    status:'success', resourceId:keys[0]._id },
    { user:dev._id,       action:'API_KEY_GENERATED', ipAddress:'192.168.1.1',    status:'success', resourceId:keys[1]._id },
    { user:dev._id,       action:'API_KEY_REVOKED',   ipAddress:'52.14.200.100',  status:'success', resourceId:keys[5]._id },
    { user:dev._id,       action:'API_KEY_ROTATED',   ipAddress:'192.168.1.1',    status:'success', resourceId:keys[2]._id },
    { user:admin._id,     action:'USER_LOGIN',        ipAddress:'10.0.0.5',       status:'success' },
    { user:extras[0]._id, action:'USER_REGISTER',     ipAddress:'185.220.101.45', status:'success' },
    { user:extras[0]._id, action:'USER_LOGIN',        ipAddress:'185.220.101.45', status:'success' },
    { user:extras[1]._id, action:'USER_REGISTER',     ipAddress:'10.0.0.5',       status:'success' },
    { user:dev._id,       action:'API_UPDATED',       ipAddress:'192.168.1.1',    status:'success', resourceId:apis[2]._id },
    { user:dev._id,       action:'USER_LOGIN',        ipAddress:'103.21.244.0',   status:'failed'  },
    { user:dev._id,       action:'USER_LOGIN',        ipAddress:'192.168.1.1',    status:'success' },
  ];
  auditRows.forEach((r,i) => { r.timestamp = new Date(Date.now()-(auditRows.length-i)*7200000); });
  await AuditLog.insertMany(auditRows);
  console.log('    ✓ 16 audit log entries\n');

  // ── Done ──────────────────────────────────────────────────────────────────
  const sep = '═'.repeat(50);
  console.log(sep);
  console.log('  SEED COMPLETE! Everything is ready.');
  console.log(sep);
  console.log('\n  ADMIN DASHBOARD');
  console.log('  URL      : http://localhost:3000');
  console.log('  Email    : admin@meterflow.dev');
  console.log('  Password : admin123');
  console.log('\n  DEVELOPER DASHBOARD');
  console.log('  URL      : http://localhost:3000');
  console.log('  Email    : dev@example.com');
  console.log('  Password : password123');
  console.log('\n  GATEWAY TEST:');
  console.log('  curl http://localhost:5000/gateway/pokemon/ditto ^');
  console.log('    -H "X-Api-Key: mf_prod_poke_a1b2c3d4e5f6789012345678"');
  console.log('\n' + sep + '\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌  SEED FAILED:', err.message, '\n');
  if (err.message.includes('Cannot find module')) {
    console.error('  FIX: cd meterflow\\backend && npm install\n');
  } else if (err.message.includes('ECONNREFUSED') || err.message.includes('connect ETIMEDOUT') || err.message.includes('querySrv')) {
    console.error('  FIX: Check MONGO_URI in your .env file');
    console.error('       Make sure MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0)\n');
  } else if (err.code === 11000) {
    console.error('  FIX: Duplicate data. Try running seed.js again (it clears old data first)\n');
  }
  process.exit(1);
});