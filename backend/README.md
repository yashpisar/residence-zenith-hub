# Harmony Society Management System — Backend & Database

This is the production-grade, modular Node.js/Express.js backend and MongoDB database service for the **Harmony Society Management System**.

---

## 1. Technology Stack

- **Runtime**: Node.js (ES Modules, `"type": "module"`)
- **Framework**: Express.js
- **Database**: MongoDB Atlas / Local MongoDB via Mongoose ODM
- **Authentication**: JWT (Access Tokens + Rotating Refresh Tokens with reuse detection) & bcryptjs
- **Real-Time**: Socket.IO with JWT authorization and society/user room scoping
- **Security**: Helmet, CORS, express-rate-limit, express-validator
- **File Uploads**: Multer with MIME validation and secure UUID filenames
- **Testing**: Jest, Supertest & MongoMemoryServer

---

## 2. Directory Structure

```text
backend/
├── package.json
├── .env.example
├── .env
├── uploads/              # Local upload storage (ignored in git)
├── tests/
│   ├── setup.js          # In-memory Mongo test environment
│   ├── auth.test.js      # Auth, password hashing & refresh token rotation tests
│   └── workflows.test.js # Multi-society isolation, complaints, and payments tests
└── src/
    ├── app.js            # Express app, middleware, routes, error handling
    ├── server.js         # HTTP and Socket.IO server startup & graceful shutdown
    ├── config/
    │   ├── database.js   # Mongoose connection & event listeners
    │   └── socket.js     # Socket.IO authenticated rooms and emitters
    ├── models/           # 17 Mongoose models with compound unique indexes
    ├── controllers/      # Auth, Societies, Complaints, Finance, Visitors, Community, Files
    ├── routes/           # REST API route handlers
    ├── middleware/       # JWT auth, society context, role authorization, error handling
    ├── utils/            # Token generation, standard API responses
    ├── validators/       # Input validation rules
    └── scripts/
        └── seed.js       # Repeatable database seed script
```

---

## 3. Installation & Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000,http://localhost:5173,http://localhost:4173

# MongoDB Atlas or Local MongoDB Connection
MONGODB_URI=mongodb://127.0.0.1:27017/harmony_society

# JWT Keys
JWT_ACCESS_SECRET=harmony_jwt_access_secret_key_change_in_production_89412
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=harmony_jwt_refresh_secret_key_change_in_production_56214
JWT_REFRESH_EXPIRES_IN=7d

# File Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=15

# Payment Mode
PAYMENT_MODE=demo
```

### 3. Setting Up MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Network Access**, add your IP address (or `0.0.0.0/0` for cloud deployment).
3. Under **Database Access**, create a user with read/write privileges.
4. Copy your connection string into `MONGODB_URI` in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/harmony_society?retryWrites=true&w=majority
   ```

### 4. Run Database Seed Script
To seed demo societies, flats, and users for all roles:
```bash
npm run seed
```

### 5. Start the Server
```bash
# Development (with nodemon auto-reload)
npm run dev

# Production
npm start
```

---

## 4. Demo Accounts

All seeded accounts use password: `password123`

| Role | Email | Society | Default Flat |
| :--- | :--- | :--- | :--- |
| **Resident** | `demo@resident.com` | Harmony Heights | Wing A, Flat A-402 |
| **Secretary** | `demo@secretary.com` | Harmony Heights | Wing B, Flat B-101 |
| **Security Guard** | `demo@security.com` | Harmony Heights | Main Gate |
| **Superadmin** | `admin@harmony.com` | All Societies | System Administrator |

---

## 5. REST API Documentation (`/api/v1`)

### Authentication (`/api/v1/auth`)
- `POST /login`: Logs in user with email & password, returns JWT access token and rotating refresh token.
- `POST /refresh`: Rotates refresh token and issues new access token. Detects token reuse.
- `POST /logout`: Revokes refresh token in database.
- `POST /forgot-password`: Generates 15-minute single-use reset token.
- `POST /reset-password`: Verifies token and updates bcrypt password hash.
- `GET /me`: Returns authenticated user profile and society memberships.

### Societies (`/api/v1/societies`)
- `GET /`: Lists active societies with lean projection.
- `GET /:id`: Fetches society profile by ID, slug, or registration number.
- `POST /`: Creates a new society (Authenticated).
- `PATCH /:id`: Updates society details (Secretary / Superadmin).
- `GET /:id/stats`: Returns live dashboard summary stats for the society.

### Complaints (`/api/v1/complaints`)
- `GET /`: Paginated list of complaints (Resident sees own + public; Secretary sees all in society).
- `GET /public`: Public community complaints with upvote counts.
- `POST /`: Raises a new complaint with auto-generated sequential number (`CMP-YYYY-XXX`).
- `PATCH /:id/status`: Updates complaint status (`Pending` -> `In Progress` -> `Resolved` -> `Closed`).
- `PATCH /:id/assign`: Assigns maintenance staff member to ticket.
- `POST /:id/support`: Atomic upvote toggle for public complaints.

### Maintenance & Payments (`/api/v1`)
- `GET /maintenance`: Bills for resident's flat, or all flat dues for secretary.
- `POST /maintenance/generate-bills`: Batch generates monthly bills (compound unique index prevents duplicate billing).
- `GET /payments`: Verified transaction history and downloadable receipts.
- `POST /payments/create-order`: Validates bill balance server-side and issues pending payment order.
- `POST /payments/verify`: Verifies signature/hash, updates bill atomically to `Paid`, generates `RCP-YYYY-MM-XXXX` receipt.
- `POST /payments/cash`: Audited cash collection recorded by secretary.
- `GET /payments/:id/receipt`: Downloadable receipt metadata.

### Visitors (`/api/v1/visitors`)
- `GET /`: Visitor gate logs (filtered by flat for residents, all for guards).
- `GET /expected`: Today's expected pre-approved visitors for guard.
- `POST /`: Registers walk-in visitor (status `Pending`) or pre-approved resident guest.
- `PATCH /:id/approve`: Resident approves gate entry request.
- `PATCH /:id/reject`: Resident denies gate entry request.
- `PATCH /:id/entry`: Guard logs timestamped entry (only permitted if approved).
- `PATCH /:id/exit`: Guard logs timestamped exit.

### Community & Operations (`/api/v1`)
- `GET/POST /notices`: Notice board management.
- `GET/POST /documents`: Document vault (Rules, Meeting Minutes, Financials).
- `GET/POST /residents`: Secretary resident directory and flat assignments.
- `GET/POST /flats`: Society wings, flats, and occupancy tracking.
- `GET/POST /staff`: Security and facility staff directory and shifts.
- `GET/POST /deliveries`: Guard package check-in and resident pickup.
- `GET/POST /emergency`: SOS Panic Alert broadcast to guards and secretaries.
- `GET/PATCH /notifications`: User notification inbox and mark-as-read.
- `GET /analytics/overview`: Secretary analytics metrics and Recharts data.

### File Uploads (`/api/v1/files`)
- `POST /upload`: Secure multipart upload with MIME and size validation. Returns UUID URL.
- `GET /:filename`: Protected file serving.

---

## 6. Real-Time Socket.IO Architecture

Socket.IO connections are authenticated during handshake using `Authorization: Bearer <token>` and `X-Society-Id`.

### Room Partitioning:
- `user:<userId>`: Direct resident alerts (e.g., visitor waiting at gate).
- `society:<societyId>`: Broadcast alerts (notices, emergency alarms).
- `flat:<flatId>`: Flat-level visitor and delivery updates.
- `guards:<societyId>`: Gate updates (resident approved/rejected visitor).
- `secretaries:<societyId>`: Administrator updates (new complaints, SOS alerts).

### Supported Events:
- `complaint:created`, `complaint:updated`, `complaint:assigned`
- `visitor:approval_requested`, `visitor:approved`, `visitor:rejected`, `visitor:entered`, `visitor:exited`
- `maintenance:bill_created`, `payment:confirmed`
- `notice:published`, `emergency:created`, `delivery:received`

---

## 7. Automated Tests

The backend includes a comprehensive Jest and Supertest suite using an in-memory MongoDB server:

```bash
cd backend
npm test
```

### Test Coverage Includes:
1. **Authentication**: Login validation, invalid credentials, suspended user blocking.
2. **Refresh Token Lifecycle**: Token rotation and token-reuse attack detection.
3. **Multi-Society Isolation**: Verifying user from Society A cannot access or modify records of Society B.
4. **Complaint Concurrency**: Sequential complaint numbers and duplicate upvote prevention.
5. **Payment Correctness**: Batch bill generation, duplicate bill prevention via compound unique indexes, and atomic balance updates.
