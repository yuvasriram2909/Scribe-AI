# 📁 Scribe-AI Project Structure & File Explorer Guide

This document provides a detailed walkthrough of the entire Scribe-AI workspace layout, explaining the exact role of every directory and file.

---

## 🌳 High-Level File Explorer Tree

```text
AI-Email/
├── .gitignore                         # Git exclusion rules (builds, .env secrets, SQLite DBs)
├── package.json                       # Root monorepo orchestrator scripts (dev, build, db)
├── README.md                          # Main project overview, quick start, and feature showcase
│
├── docs/                              # 📚 Comprehensive Technical Documentation
│   ├── ARCHITECTURE.md                # System architecture, data flow & security diagrams
│   ├── TECH_STACK.md                  # Comprehensive breakdown of tools, libraries & frameworks
│   ├── API_DOCUMENTATION.md           # REST API endpoint reference and payload specifications
│   └── PROJECT_STRUCTURE.md           # This file explorer guide
│
├── client/                            # 💻 Frontend Application (React 18 + Vite)
│   ├── .env.example                   # Client-side environment variables template
│   ├── index.html                     # HTML5 entry point & web font integrations
│   ├── package.json                   # Frontend dependencies (React, Lucide, Tailwind, Vite)
│   ├── postcss.config.js              # PostCSS plugin pipeline configuration
│   ├── tailwind.config.js             # Tailwind CSS design system tokens and theme extensions
│   ├── vercel.json                    # Single Page Application (SPA) rewrite rules for Vercel
│   ├── vite.config.js                 # Vite bundling configuration & local /api proxy
│   └── src/                           # Frontend source code
│       ├── main.jsx                   # React root bootstrap & DOM mounting
│       ├── App.jsx                    # Root component, navigation state & active view router
│       ├── index.css                  # Custom design system (glassmorphism, animations, gradients)
│       ├── components/                # Modular React UI view components
│       │   ├── ComposeWorkflow.jsx    # 11-step human-in-the-loop AI email drafting interface
│       │   ├── Dashboard.jsx          # Analytics summary, stats cards, and quick actions
│       │   ├── EmailHistory.jsx       # Sent email log, status filters, and detail drawer
│       │   ├── ContactsManager.jsx    # Address book with auto-tuned tone mapping
│       │   ├── TemplatesLibrary.jsx   # Canned email templates with quick-load actions
│       │   ├── NotificationCenter.jsx # Real-time alerts, login warnings & system notifications
│       │   ├── SettingsView.jsx       # Gmail OAuth connect, user profile, and email signatures
│       │   ├── LoginPage.jsx          # Authentication portal (Email/Password & Demo accounts)
│       │   ├── PublicLandingPage.jsx  # Unauthenticated marketing landing page
│       │   ├── TrashView.jsx          # Deleted items recovery and permanent deletion
│       │   ├── PrivacyPolicy.jsx      # Google OAuth compliant Privacy Policy page
│       │   └── TermsOfService.jsx     # Service terms and usage agreements
│       └── utils/
│           └── api.js                 # Authenticated HTTP client wrapper (`apiFetch`)
│
└── server/                            # ⚙️ Backend Application (Node.js + Express)
    ├── .env                           # Server environment variables (local secrets)
    ├── .env.example                   # Server environment variables template
    ├── package.json                   # Backend dependencies (Express, Prisma, Gemini, Googleapis)
    ├── uploads/                       # Temp directory for attachment uploads (.gitkeep preserved)
    ├── prisma/                        # Database modeling & ORM configuration
    │   ├── schema.prisma              # SQLite schema definition (User, Email, GmailAccount, etc.)
    │   └── dev.db                     # Local SQLite database file (auto-generated)
    └── src/                           # Backend server source code
        ├── index.js                   # Express server entry point, middleware & boot sequence
        ├── aiService.js               # Google Gemini AI generation & situation detection
        ├── emailPatterns.js           # 8-Situation classification rules & natural language templates
        ├── gmailService.js            # Google OAuth 2.0 client & Gmail REST API HTTPS dispatcher
        ├── securityService.js         # Device fingerprinting, login audits & security alert emails
        ├── seed.js                    # Database seeder (sample templates, contacts & test user)
        ├── resetDb.js                 # Utility script to safely reset and migrate database
        └── routes/
            └── api.js                 # Express router containing all REST API endpoint handlers
```

---

## 🔍 Directory Breakdown & Responsibilities

### 1. Root Workspace (`/`)
- **`package.json`**: Acts as the root task runner. Uses `concurrently` to run both the frontend Vite dev server and backend Express server simultaneously using `npm run dev`.
- **`.gitignore`**: Guarantees sensitive files (`.env`, `dev.db`, `uploads/`, `node_modules/`, `dist/`) are excluded from version control.
- **`docs/`**: Central knowledge repository detailing architecture, API endpoints, tools, and technical specifications.

### 2. Frontend (`/client`)
- **`src/components/ComposeWorkflow.jsx`**: The core AI drafting studio. Features live AI streaming/generation, situation selection cards (Emergency, Leave, Job Application, etc.), priority toggles, tone adjusters, attachment uploaders, and Gmail OAuth dispatch verification modals.
- **`src/components/Dashboard.jsx`**: Real-time KPI metrics, sent email counters, quick-action shortcuts, and recent activity timelines.
- **`src/components/SettingsView.jsx`**: Direct integration UI for connecting Google Accounts via OAuth 2.0, managing sender signatures, and tweaking AI tone preferences.
- **`src/utils/api.js`**: Standardized HTTP utility that injects authentication headers (`x-user-email`, `Authorization: Bearer`), resolves environment base URLs dynamically, and gracefully handles error payloads.

### 3. Backend (`/server`)
- **`src/index.js`**: Configures Express, CORS, JSON parsers, static asset delivery, and runs automated database schema syncing on startup via `prisma db push`.
- **`src/routes/api.js`**: Centralized routing hub providing endpoints for:
  - Authentication (`/api/auth/*`)
  - AI Generation & Analysis (`/api/ai/generate`, `/api/ai/analyze`)
  - Email Management (`/api/emails/*`, `/api/emails/send`)
  - Contacts Management (`/api/contacts/*`)
  - Templates (`/api/templates/*`)
  - Notifications (`/api/notifications/*`)
  - User Settings & Signatures (`/api/settings/*`)
- **`src/aiService.js`**: Connects with `@google/generative-ai` (Gemini) to perform intent classification, situation tagging, subject generation, and draft composition. Includes an automated offline fallback engine.
- **`src/emailPatterns.js`**: Rule-based fallback catalog covering all 8 email situations, ensuring high availability even if external AI rate limits occur.
- **`src/gmailService.js`**: Manages Google OAuth 2.0 tokens, refreshes expired tokens, constructs RFC 2822 compliant MIME emails, and dispatches them via `gmail.users.messages.send`.
- **`src/securityService.js`**: Extracts IP address, OS, browser, and device signatures on login, alerting users of new sign-ins.
- **`prisma/schema.prisma`**: Single source of truth for the database schema, defining relations between `User`, `GmailAccount`, `Contact`, `Email`, `Attachment`, `Notification`, and `UserSignature`.
