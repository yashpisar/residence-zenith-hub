# Harmony Society

===========================================================

PREMIUM DESIGN SYSTEM

===========================================================

The UI should resemble a premium enterprise SaaS application similar to Linear, Notion, Stripe Dashboard, Microsoft Admin Center, Atlassian Jira, ClickUp and Vercel Dashboard.

The application should NOT look like a college project.

Avoid bright colors.

Avoid plain white backgrounds.

Avoid pure black backgrounds.

Create a modern premium corporate interface.

===========================================================

COLOR PALETTE

===========================================================

Main Background

#0B1220

Secondary Background

#111827

Sidebar

#0F172A

Navbar

#111827

Cards

#1E293B

Primary Accent

#14B8A6 (Premium Teal)

Secondary Accent

#F59E0B (Amber)

Success

#22C55E

Warning

#F97316

Danger

#EF4444

Information

#3B82F6

Primary Text

#F8FAFC

Secondary Text

#CBD5E1

Muted Text

#94A3B8

Borders

#334155

Hover

#0D9488

===========================================================

CARD DESIGN

===========================================================

Every card should include

- Rounded corners (18px)

- Soft shadow

- Thin border

- Smooth hover animation

- Slight lift effect

- Glassmorphism only for login and popup dialogs

Cards should contain

Large Icon

Title

Description

Statistics

Action Button

Hover should

Increase shadow

Move upward slightly

Highlight border

===========================================================

BUTTON DESIGN

===========================================================

Primary Button

Gradient

#14B8A6 → #0D9488

White Text

Rounded

Bold

Hover Animation

Secondary Button

Dark Background

Border

Rounded

Danger Button

Red Gradient

Success Button

Green Gradient

===========================================================

TABLE DESIGN

===========================================================

Modern enterprise tables.

Features

Sticky Header

Rounded Corners

Alternating Row Colors

Hover Highlight

Search

Sorting

Pagination

Export Buttons

Responsive Layout

===========================================================

INPUT DESIGN

===========================================================

Rounded Inputs

Dark Background

Border

Animated Focus

Floating Labels

Professional Validation Messages

Password Visibility Toggle

===========================================================

SIDEBAR DESIGN

===========================================================

Collapsible Sidebar

Smooth Animation

Large Icons

Notification Badges

Active Menu Highlight

Modern Hover Effects

Grouped Navigation

===========================================================

NAVBAR DESIGN

===========================================================

Sticky Navbar

Society Logo

Notification Center

Search

Profile Dropdown

Theme Toggle

Quick Actions

===========================================================

DASHBOARD CARDS

===========================================================

Statistics Cards

Large Number

Small Label

Icon

Mini Trend Graph

Percentage Change

Animated Counter

===========================================================

CHART DESIGN

===========================================================

Use Recharts.

Charts should have

Rounded Bars

Smooth Animations

Interactive Tooltips

Legends

Modern Color Palette

===========================================================

ICONS

===========================================================

Use Lucide React icons.

Every page should have meaningful icons.

===========================================================

TYPOGRAPHY

===========================================================

Use Inter Font.

Font Weights

400

500

600

700

Maintain consistent spacing.

===========================================================

ANIMATIONS

===========================================================

Use Framer Motion.

Page Transition

Card Hover

Fade In

Slide Up

Scale Animation

Loading Skeleton

===========================================================

RESPONSIVE DESIGN

===========================================================

Support

Desktop

Laptop

Tablet

Mobile

Collapsible Sidebar on Mobile.

Responsive Tables.

Responsive Charts.

===========================================================

THEME

===========================================================

Default Theme

Premium Corporate Dark

Provide Theme Toggle

Dark

Light

System

Remember user preference.

===========================================================

USER EXPERIENCE

===========================================================

Professional Empty States

Loading Skeleton

Confirmation Dialogs

Toast Notifications

Image Preview

Drag and Drop Upload

Infinite Scroll where applicable

Keyboard Accessibility

Accessible Color Contrast

Fast Navigation

===========================================================

FINAL REQUIREMENT

===========================================================

The final UI should feel like a premium enterprise management platform used by large residential societies and should be polished, modern, elegant, scalable, and production-ready.  ===========================================================

NAVIGATION

===========================================================

Resident Navigation

- Dashboard

- Register Complaint

- My Complaints

- Public Complaints

- Maintenance

- Payment History

- Visitor Approval

- Notices

- Documents

- Profile

- Settings

Secretary Navigation

- Dashboard

- Complaints

- Residents

- Flats

- Staff

- Maintenance

- Payments

- Visitor Reports

- Announcements

- Documents

- Analytics

- Settings

Security Guard Navigation

- Dashboard

- New Visitor

- Visitor History

- QR Scanner

- Deliveries

- Expected Visitors

- Emergency

- Profile

- Settings

===========================================================

REAL TIME FEATURES

===========================================================

The frontend should be designed to support real-time updates using Socket.io or WebSockets.

Real-time Features

- New Complaint Notification

- Complaint Status Updates

- Visitor Entry Notification

- Visitor Exit Notification

- New Announcement

- Maintenance Payment Notification

- Emergency Alerts

- Staff Assignment Notification

===========================================================

FRONTEND REQUIREMENTS

===========================================================

Use reusable React components throughout the project.

Use React Router for routing.

Use Axios for API communication.

Use Context API for authentication and global state.

Store JWT token securely.

Create protected routes for each role.

Implement responsive layouts for mobile, tablet, and desktop.

Follow a clean folder structure.

Use lazy loading for routes.

Optimize performance with code splitting.

Implement proper form validation.

Use loading indicators during API calls.

Use error boundaries to handle UI errors.

Implement image preview before upload.

Create reusable modals, cards, forms, tables, charts, and notification components.

Use professional animations with Framer Motion.

===========================================================

DESIGN GUIDELINES

===========================================================

The UI should resemble a premium SaaS application.

Use a modern blue, white, and gray color palette.

Rounded cards with subtle shadows.

Glassmorphism effects where appropriate.

Beautiful dashboards with animated charts.

Professional typography.

Consistent spacing.

Modern icons.

Excellent accessibility.

Pixel-perfect responsive layouts.

The application should be production-ready, scalable, and easy to connect with a Node.js + Express.js backend using MongoDB and REST APIs.


## Monorepo Architecture & Folder Structure

The project is structured into two clean directories:

```
residence-zenith-hub/
├── frontend/                     # React 19 + TanStack Router + Vite frontend
│   ├── src/
│   │   ├── components/           # Reusable UI, AppShell, Guard, Visitor dialogs
│   │   ├── contexts/             # AuthContext, SocietyContext
│   │   ├── routes/               # TanStack file-based routes
│   │   └── services/             # Axios API client, socket.service
│   ├── public/                   # Static assets & icons
│   ├── package.json              # Frontend dependencies & scripts
│   └── vite.config.js            # Vite configuration
│
├── backend/                      # Node.js + Express + Mongoose + Socket.io backend
│   ├── src/
│   │   ├── config/               # Database connection (Atlas + Memory fallback)
│   │   ├── controllers/          # Auth, Complaint, Maintenance, Visitor, etc.
│   │   ├── middleware/           # JWT auth, RBAC roles, rate-limiter, upload
│   │   ├── models/               # Mongoose schemas & indexes
│   │   ├── routes/               # Express REST route endpoints
│   │   ├── scripts/              # Database seeder (seed.js)
│   │   └── server.js             # Express application & HTTP server
│   ├── tests/                    # Jest automated test suites
│   ├── package.json              # Backend dependencies & scripts
│   └── .env                      # Environment variables & MongoDB URI
│
├── scripts/
│   └── dev.js                    # Cross-platform concurrent runner for both servers
├── start-all.bat                 # Windows 1-click launcher for Frontend + Backend
├── start-frontend.bat            # Windows 1-click launcher for Frontend only
├── start-backend.bat             # Windows 1-click launcher for Backend only
└── package.json                  # Root monorepo orchestrator
```

---

## Quick Start & Running the Project

### 1. Install Dependencies
Run from the root directory:
```sh
npm run install:all
```
*(Or install inside `frontend/` and `backend/` independently using `npm install`)*

### 2. Run Both Frontend and Backend Concurrently
From the root directory:
```sh
npm run dev
```
- **Frontend** runs on: `http://localhost:3000` (or next available port)
- **Backend API** runs on: `http://localhost:5000`

On Windows, you can also double-click:
- **`start-all.bat`** — Starts both services in a single terminal.

---

### 3. Run Frontend or Backend Individually

**Frontend Only:**
```sh
npm run dev:frontend
# Or: cd frontend && npm run dev
# Or double-click: start-frontend.bat
```

**Backend Only:**
```sh
npm run dev:backend
# Or: cd backend && npm run dev
# Or double-click: start-backend.bat
```

---

## Database Configuration & Local Development

The backend is configured with resilient dual-database support:

1. **MongoDB Atlas (Production & Staging):**
   - Configured via `MONGODB_URI` in `backend/.env`.
   - *Note on Auth Failure (`code: 8000`):* If MongoDB Atlas rejects the connection due to invalid/expired password, check MongoDB Atlas Dashboard -> **Security** -> **Database Access** -> **Database Users** and update the password.
2. **Automatic In-Memory Fallback (Local Development):**
   - If MongoDB Atlas is unavailable or authentication fails, the backend automatically spins up an embedded in-memory MongoDB instance and auto-seeds all demo accounts.
   - You can develop, login, and test immediately without any external database dependencies or hanging requests.

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Secretary (Admin)** | `secretary@harmony.com` | `Admin@123` |
| **Resident** | `resident@harmony.com` | `Resident@123` |
| **Security Guard** | `guard@harmony.com` | `Guard@123` |

---

## Build and Testing

**Compile Frontend for Production:**
```sh
npm run build
# Or: npm run build:frontend
```

**Run Backend Test Suite:**
```sh
npm test
# Or: npm run test:backend
```

**Re-seed Database:**
```sh
npm run seed
# Or: npm run seed:backend
```

