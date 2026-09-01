# 🚀 Scribe-AI — Intelligent Email Automation Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Database-SQLite%20%7C%20Prisma%20ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Gmail API](https://img.shields.io/badge/Email-Official%20Gmail%20API%20%7C%20OAuth%202.0-EA4335?style=flat-square&logo=gmail&logoColor=white)](https://developers.google.com/gmail/api)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

An enterprise-grade, full-stack email automation system that uses **Google Gemini AI** and the **Official Gmail REST API** to transform natural language instructions into precisely classified, context-aware email drafts with an 11-step human-in-the-loop security verification pipeline.

---

## 📚 Table of Contents

- [🌟 Core Features](#-core-features)
- [🛠️ Tech Stack & Tools Breakdown](#️-tech-stack--tools-breakdown)
- [📁 Project Explorer Structure](#-project-explorer-structure)
- [⚡ 11-Step Human-in-the-Loop Workflow](#-11-step-human-in-the-loop-workflow)
- [📖 Documentation Links](#-documentation-links)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🛡️ Security & Privacy Model](#️-security--privacy-model)
- [📄 License](#-license)

---

## 🌟 Core Features

- **🧠 8-Situation AI Classification Engine**:
  Maps raw natural instructions into 8 distinct communication contexts with automatic priority and tone adjustment:
  1. 🚨 **Emergency** (High Priority, Urgent Tone)
  2. ⚠️ **Important / Necessary** (High/Medium Priority, Professional/Direct Tone)
  3. 💼 **Official / Professional** (Normal Priority, Professional Tone)
  4. 📅 **Leave / Holiday** (Normal Priority, Professional Tone)
  5. 📄 **Resume / Job Application** (Normal Priority, Formal/Professional Tone)
  6. 🔄 **Follow-up** (Normal Priority, Professional Tone)
  7. 💬 **Casual** (Normal Priority, Friendly/Casual Tone)
  8. 🎉 **Celebration / Occasion** (Normal Priority, Warm Tone)

- **🛡️ 11-Step Human-in-the-Loop Security Verification**:
  Prevents accidental sends with a zero-hallucination review stage, manual situation override controls, draft editing, and safety confirmation modals prior to API dispatch.

- **📮 Native Gmail API & OAuth 2.0 Integration**:
  Direct integration with Google Cloud OAuth 2.0 and Gmail REST API (`gmail.googleapis.com`), utilizing RFC 2822 MIME base64url encoding and automated token refresh.

- **👥 Intelligent Contacts & Tone Mapping**:
  Address book that auto-tunes email tone based on recipient relationship (HR, Client, Manager, Friend, Colleague).

- **🔔 Multi-Platform Login Security Alerts**:
  Audits client browser, operating system, and IP address on login, providing both in-app notification cards and security email alerts.

- **🗄️ Multi-User Data Isolation**:
  Isolated SQLite/Prisma records per user, ensuring complete confidentiality of drafts, contacts, notifications, and credentials.

---

## 🛠️ Tech Stack & Tools Breakdown

### Frontend (Client)
- **Framework**: [React 18](https://reactjs.org/) (Hooks, dynamic SPA routing)
- **Build System**: [Vite 5](https://vitejs.dev/) (Fast HMR & bundling)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) + Custom Glassmorphism CSS Design System
- **Icons**: [Lucide React](https://lucide.dev/) (Modern SVG UI icons)
- **Utilities**: Modular API client with authentication and base URL resolution

### Backend (Server)
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Server Framework**: [Express.js](https://expressjs.com/) (RESTful API architecture)
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) + [SQLite](https://www.sqlite.org/) (`dev.db`)
- **AI Integration**: [Google Gemini AI SDK](https://www.npmjs.com/package/@google/generative-ai) (`@google/generative-ai`)
- **Email Dispatch**: [Official Googleapis](https://www.npmjs.com/package/googleapis) Gmail REST API
- **Transactional Alerts**: [Nodemailer](https://nodemailer.com/)
- **File Uploads**: [Multer](https://www.npmjs.com/package/multer)

---

## 📁 Project Explorer Structure

```text
AI-Email/
├── docs/                              # 📚 Full Technical Documentation
│   ├── ARCHITECTURE.md                # System diagrams & data pipelines
│   ├── TECH_STACK.md                  # Comprehensive tool & dependency inventory
│   ├── API_DOCUMENTATION.md           # REST API endpoint reference
│   └── PROJECT_STRUCTURE.md           # Detailed file explorer walkthrough
│
├── client/                            # 🖥️ Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── components/                # Modular UI views (Compose, Dashboard, History, etc.)
│   │   ├── utils/                     # Authenticated apiFetch client
│   │   ├── App.jsx                    # Navigation and view routing
│   │   └── index.css                  # Design tokens & glassmorphism theme
│   ├── .env.example                   # Client environment variables template
│   └── vite.config.js                 # Vite config with /api proxy
│
├── server/                            # ⚙️ Backend (Node.js + Express)
│   ├── prisma/                        # Database schema & SQLite database
│   │   ├── schema.prisma              # Data models (User, Email, Contact, etc.)
│   │   └── dev.db                     # SQLite database file
│   ├── src/
│   │   ├── routes/api.js              # REST API route handlers
│   │   ├── aiService.js               # Gemini AI engine & fallback
│   │   ├── emailPatterns.js           # 8-Situation classification patterns
│   │   ├── gmailService.js            # Gmail OAuth 2.0 & MIME dispatcher
│   │   ├── securityService.js         # Device fingerprinting & login alerts
│   │   └── index.js                   # Express server entry point
│   ├── .env.example                   # Server environment variables template
│   └── uploads/                       # Temporary attachment storage
│
└── package.json                       # Monorepo task runner (concurrent dev scripts)
```

---

## 📖 Documentation Links

Explore the detailed architecture and API manuals inside the [`docs/`](file:///c:/Users/testm/Desktop/AI-Email/docs) folder:

- 🏛️ **[System Architecture & Workflow Deep Dive](file:///c:/Users/testm/Desktop/AI-Email/docs/ARCHITECTURE.md)**
- 🛠️ **[Tools & Technical Stack Reference](file:///c:/Users/testm/Desktop/AI-Email/docs/TECH_STACK.md)**
- 🌐 **[REST API Endpoint Specification](file:///c:/Users/testm/Desktop/AI-Email/docs/API_DOCUMENTATION.md)**
- 📁 **[Project Structure & File Guide](file:///c:/Users/testm/Desktop/AI-Email/docs/PROJECT_STRUCTURE.md)**

---

## ⚡ 11-Step Human-in-the-Loop Workflow

```text
1. Short Instruction ➔ 2. AI Intent Analysis ➔ 3. Situation & Priority Detection ➔
4. Draft Generation ➔ 5. Analysis Review ➔ 6. Manual Override (Optional) ➔
7. User Draft Customization ➔ 8. Attachment Upload ➔ 9. Security Confirmation Modal ➔
10. Gmail REST API Dispatch ➔ 11. Sent Confirmation & Audit History Log
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Installation
Clone the repository and install all dependencies in one command:
```bash
git clone https://github.com/yuvasriram2909/Scribe-AI.git
cd AI-Email
npm run install:all
```

### 3. Configure Server Environment
Create `server/.env` using the template provided in `server/.env.example`:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Initialize Database
```bash
cd server
npx prisma db push
npx prisma generate
node src/seed.js
cd ..
```

### 5. Start Development Servers
Run both client and backend servers concurrently:
```bash
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## 🛡️ Security & Privacy Model

- **Multi-Tenant Isolation**: Server-side user scoping on every database query prevents cross-tenant data access.
- **Official Google OAuth**: Uses limited `gmail.send` scope without reading private inbox emails.
- **Offline Fallback Engine**: If AI API keys or quota limits occur, the system smoothly falls back to built-in rule-based generators.
- **Device Fingerprinting**: Real-time identification of browser, OS, and IP address on login.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
