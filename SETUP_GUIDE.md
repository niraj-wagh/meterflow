# 🚀 MeterFlow – Complete Setup Guide

Follow these steps **in order** to get everything running with real data.

---

## STEP 1 — Install dependencies

Open **two terminals**.

**Terminal 1 (Backend):**
```bash
cd meterflow/backend
npm install
```

**Terminal 2 (Frontend):**
```bash
cd meterflow/frontend
npm install
```

---

## STEP 2 — Configure environment

```bash
cd meterflow/backend
cp .env.example .env
```

Edit `.env` and fill in your **MongoDB Atlas** connection string:

```env
PORT=5000
NODE_ENV=development

# Get this from: https://cloud.mongodb.com → Connect → Drivers
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/meterflow?retryWrites=true&w=majority

JWT_SECRET=any_random_long_string_here_123
JWT_REFRESH_SECRET=another_random_string_here_456

CLIENT_URL=http://localhost:3000
```

> ✅ Free MongoDB Atlas cluster is enough.  
> Create one at https://cloud.mongodb.com (free forever tier)

---

## STEP 3 — Seed the database (REQUIRED for demo accounts)

```bash
cd meterflow/backend
node scripts/seed.js
```

You will see:
```
🌱  MeterFlow Seeder starting…
✅  MongoDB connected
🗑   Clearing old seed data…
👑  Creating admin user…
   ✓  admin@meterflow.dev  /  admin123
👤  Creating developer account…
   ✓  dev@example.com  /  password123
🔌  Creating APIs…  (5 APIs)
🔑  Creating API keys…  (6 keys)
📊  Generating usage logs…  (2400 entries)
💰  Creating billing records…
🎉  Seed complete!
```

---

## STEP 4 — Start the servers

**Terminal 1 — Backend:**
```bash
cd meterflow/backend
npm run dev
# → Server running on http://localhost:5000
# → MongoDB Atlas connected
```

**Terminal 2 — Frontend:**
```bash
cd meterflow/frontend
npm run dev
# → Local: http://localhost:3000
```

---

## STEP 5 — Login with demo accounts

Open **http://localhost:3000**

### 👑 Admin Dashboard
```
Email:    admin@meterflow.dev
Password: admin123
```
**You'll see:**
- Platform-wide request metrics
- User management (ban/activate users)
- 30-day usage chart
- Plan distribution pie chart
- Audit logs of all actions

### 👤 Developer Dashboard
```
Email:    dev@example.com
Password: password123
```
**You'll see:**
- 5 pre-created APIs
- 6 API keys (1 revoked)
- 2,400 usage log entries
- Analytics charts (7d/30d)
- Billing invoices (2 paid, 1 pending)
- Webhooks

---

## STEP 6 — Test the live gateway

Copy a key from **Dashboard → API Keys**, then:

```bash
# Test PokéAPI through MeterFlow gateway
curl http://localhost:5000/gateway/pokemon/ditto \
  -H "X-Api-Key: mf_prod_poke_a1b2c3d4e5f6789012345678"

# Test JSONPlaceholder
curl http://localhost:5000/gateway/posts/1 \
  -H "X-Api-Key: mf_dev_json_c3d4e5f6789012345678a1b2"
```

Each request:
1. ✅ Validates the API key
2. ✅ Checks rate limits
3. ✅ Proxies to the target API
4. ✅ Logs usage to MongoDB
5. ✅ Emits Socket.io event (visible in dashboard)
6. ✅ Tracks cost for billing

---

## STEP 7 — Watch real-time updates (optional)

**Terminal 3 — Traffic simulator:**
```bash
cd meterflow/backend
node scripts/simulate.js
```

This fires real requests through the gateway every 3 seconds.  
Watch your **Admin Dashboard** update in real time via Socket.io! 🔴

---

## STEP 8 — Use the API Playground

In the **Developer Dashboard → Playground**:
1. Select an API key from dropdown
2. Method: `GET`, Path: `/pokemon/ditto`
3. Click **Send request**
4. See live response + latency

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Invalid credentials` on demo login | Run `node scripts/seed.js` first |
| MongoDB connection error | Check your `MONGO_URI` in `.env` |
| Gateway returns 401 | API key must be active (not revoked) |
| Charts show no data | Run seed.js — it creates 2,400 log entries |
| `secretOrPrivateKey must have a value` | Add `JWT_SECRET` to your `.env` |
| CORS error | Make sure `CLIENT_URL=http://localhost:3000` in `.env` |

---

## Demo Account Summary

| Account | Email | Password | Role | Plan |
|---|---|---|---|---|
| Admin | admin@meterflow.dev | admin123 | admin | Enterprise |
| Developer | dev@example.com | password123 | api_owner | Pro |
| Alice | alice@startup.io | password123 | api_owner | Free |
| Bob | bob@corp.com | password123 | api_owner | Pro |

---

## API Gateway Quick Reference

```
Base URL: http://localhost:5000/gateway

Required Header: X-Api-Key: mf_your_key_here

Rate limit headers returned:
  X-RateLimit-Limit     → max requests per minute
  X-RateLimit-Remaining → remaining this window
  X-RateLimit-Reset     → timestamp when window resets
  X-MeterFlow-Latency   → ms taken
  X-MeterFlow-RequestId → log entry ID
```

---

*MeterFlow — built for your portfolio 🚀*
