# 🚀 MeterFlow – Usage-Based API Billing Platform

> A full-stack SaaS platform for metering, billing, and managing API usage — inspired by Stripe Billing, RapidAPI, and AWS API Gateway.

---

## 📸 Dashboards

| Admin Dashboard | Developer Dashboard |
|---|---|
| Platform-wide metrics, user management, audit logs | My APIs, API keys, analytics, billing, playground |

---

## 🧱 Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + Refresh tokens |
| Real-time | Socket.io |
| Queue | BullMQ |
| Caching / Rate limiting | Redis (ioredis) |
| Logging | Winston |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Server state | TanStack Query (React Query v5) |
| Client state | Zustand |
| Charts | Recharts |
| HTTP | Axios |
| Real-time | Socket.io-client |
| Notifications | react-hot-toast |

---

## 🗄 Database Design

```
Users         → id, email, password, role, plan, planLimits
APIs          → id, owner(User), name, baseUrl, rateLimit, pricing
ApiKeys       → id, api(Api), owner(User), key, status, rateLimit
UsageLogs     → id, apiKey, api, user, endpoint, method, statusCode, latency, cost
Billing       → id, user, period, totalRequests, billableRequests, amount, status
Webhooks      → id, user, url, events[], isActive
AuditLogs     → id, user, action, ipAddress, timestamp
```

---

## ⚙️ Core System Architecture

```
Client Request
      │
      ▼
MeterFlow Gateway (/gateway/*)
      │
      ├── 1. Validate API Key (ApiKey model lookup)
      ├── 2. Check key status (active / revoked / expired)
      ├── 3. Apply rate limiting (Redis / in-memory)
      ├── 4. Forward request → Target API (axios proxy)
      ├── 5. Log usage (UsageLog model)
      ├── 6. Emit real-time event (Socket.io)
      └── 7. Return response to client
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Backend
cd backend
cp .env.example .env         # fill in your values
npm install
npm run dev                  # starts on :5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                  # starts on :3000
```

### 2. Environment Variables

```env
# backend/.env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/meterflow
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
STRIPE_SECRET_KEY=sk_test_...
CLIENT_URL=http://localhost:3000
```

### 3. Create Admin User

```bash
# Use MongoDB Compass or Atlas UI to set role: "admin"
# Or seed via script:
node scripts/seed.js
```

---

## 🔑 Authentication & Roles

| Role | Capabilities |
|---|---|
| `admin` | Full platform access, user management, audit logs |
| `api_owner` | Create APIs, generate keys, view analytics & billing |
| `consumer` | Use API keys (future expansion) |

---

## 📡 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/refresh
PUT    /api/auth/profile
PUT    /api/auth/password
POST   /api/auth/logout
```

### APIs
```
GET    /api/apis              # List my APIs
POST   /api/apis              # Create API
GET    /api/apis/:id
PUT    /api/apis/:id
DELETE /api/apis/:id
```

### API Keys
```
GET    /api/keys              # List all my keys
POST   /api/keys              # Generate key
GET    /api/keys/api/:apiId   # Keys for specific API
PUT    /api/keys/:id/revoke
PUT    /api/keys/:id/rotate
DELETE /api/keys/:id
```

### Usage & Analytics
```
GET    /api/usage             # Logs (paginated + filterable)
GET    /api/usage/summary     # Summary stats
GET    /api/usage/realtime    # Last-hour breakdown
GET    /api/analytics/overview
GET    /api/analytics/requests
GET    /api/analytics/top-apis
GET    /api/analytics/latency
```

### Billing
```
GET    /api/billing           # Invoice history
GET    /api/billing/current   # Current month
POST   /api/billing/upgrade   # Upgrade plan
GET    /api/billing/:id       # Invoice detail
```

### Admin
```
GET    /api/admin/stats       # Platform dashboard
GET    /api/admin/users       # All users
PUT    /api/admin/users/:id/status
GET    /api/admin/usage       # Platform-wide usage
GET    /api/admin/audit       # Audit logs
```

### Gateway (proxy)
```
ALL    /gateway/*             # Proxied with X-Api-Key header
```

---

## 🌐 API Gateway Usage

```bash
# All gateway requests require: X-Api-Key header
curl -X GET \
  http://localhost:5000/gateway/pokemon/ditto \
  -H "X-Api-Key: mf_your_key_here"

# Response includes:
# X-MeterFlow-RequestId: <log_id>
# X-MeterFlow-Latency: <ms>
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 59
```

---

## 💰 Pricing Model

| Plan | Requests | Price |
|---|---|---|
| Free | 1,000/month | ₹0 |
| Pro | 100,000/month | ₹499/month |
| Enterprise | Unlimited | Custom |
| Overage | Per request | ₹0.005/request |

---

## 🔌 WebSocket Events

```js
// Client connects and joins user room:
socket.emit('join-user-room', userId)

// Events received in real-time:
socket.on('new-request', { endpoint, statusCode, latency, isError, timestamp })
socket.on('rate-limit-exceeded', { apiKeyId, apiKeyName, timestamp })

// Admin-only:
socket.emit('join-admin-room')
socket.on('platform-request', { userId, apiName, statusCode, latency })
```

---

## 📁 Folder Structure

```
meterflow/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Business logic
│   ├── middleware/       # auth, error, rateLimit
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── services/        # Background jobs, billing engine
│   ├── utils/           # logger, jwt helpers
│   └── server.js
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── auth/        # Login, Register
        │   ├── admin/       # Admin dashboard, users, audit
        │   └── customer/    # Dashboard, APIs, keys, billing…
        ├── services/        # API calls (axios)
        ├── store/           # Zustand auth store
        ├── hooks/           # useSocket
        └── App.jsx
```

---

## 🚀 Deployment

```bash
# Backend → Railway / Render
# Set all env vars in dashboard
# Start command: node server.js

# Frontend → Vercel
# Build command: npm run build
# Output dir: dist
# Env: VITE_API_URL=https://your-backend.railway.app

# Database → MongoDB Atlas (free tier available)
```

---

## 💼 Resume Description

> **MeterFlow – API Billing & Metering Platform** (MERN Stack)
> - Built a scalable API gateway system that intercepts, validates, rate-limits, and logs every request in real time
> - Implemented JWT authentication with role-based access control (Admin / API Owner)
> - Designed a usage-based billing engine with tiered pricing and automated invoice generation
> - Developed real-time analytics dashboard using React, Recharts, and Socket.io
> - Integrated webhook delivery system for billing alerts and usage threshold notifications
> - Deployed on Railway (backend), Vercel (frontend), and MongoDB Atlas

---

## 🧪 Test APIs (for Playground)

| API | Base URL |
|---|---|
| PokéAPI | `https://pokeapi.co/api/v2` |
| JSONPlaceholder | `https://jsonplaceholder.typicode.com` |
| DummyJSON | `https://dummyjson.com` |
| CoinGecko | `https://api.coingecko.com/api/v3` |

---

*MeterFlow — built with ❤️ to simulate real-world API monetization platforms.*
