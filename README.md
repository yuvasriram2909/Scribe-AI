# 🚀 Scribe-AI — Intelligent Email Automation Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20Production-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://scribe-ai-self.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yuvasriram2909/Scribe-AI)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%205-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Supabase%20Edge%20Functions-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Realtime-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![AI Engine](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Email](https://img.shields.io/badge/Email-Official%20Gmail%20REST%20API-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](https://developers.google.com/gmail/api)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

An enterprise-grade, full-stack email automation system that uses **Google Gemini AI** and the **Official Gmail REST API** to transform natural language instructions into precisely classified, context-aware email drafts with multi-user isolation and human-in-the-loop security verification.

---

## 🌐 Live Production Links & Repositories

- 🚀 **Live Production Application**: [https://scribe-ai-self.vercel.app](https://scribe-ai-self.vercel.app)
- 📦 **GitHub Source Repository**: [https://github.com/yuvasriram2909/Scribe-AI](https://github.com/yuvasriram2909/Scribe-AI)
- ⚡ **Backend Edge Functions**: [Supabase Edge Functions](https://bjxjorlxjijssrqjosed.supabase.co/functions/v1/api)

---

## 📚 Table of Contents

- [🌟 Core Capabilities](#-core-capabilities)
- [🎨 Editorial Minimalist Design System](#-editorial-minimalist-design-system)
- [🛠️ Tech Stack & Architecture](#️-tech-stack--architecture)
- [📁 Project Explorer Structure](#-project-explorer-structure)
- [⚡ 11-Step Human-in-the-Loop Workflow](#-11-step-human-in-the-loop-workflow)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🛡️ Security & Multi-User Isolation Model](#️-security--multi-user-isolation-model)
- [📄 License](#-license)

---

## 🌟 Core Capabilities

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
  Direct integration with Google Cloud OAuth 2.0 and Gmail REST API (gmail.googleapis.com), utilizing RFC 2822 MIME base64url encoding and automated token refresh.

- **👥 Intelligent Contacts & Tone Mapping**:
  Address book that auto-tunes email tone based on recipient relationship (HR, Client, Manager, Friend, Colleague).

- **🗄️ Multi-User Data Isolation**:
  Strict user-scoping on all database queries and Edge Functions, ensuring complete confidentiality of sent emails, drafts, contacts, notifications, and signatures across different users.

- **📜 Reverse-Chronological Sent History**:
  Real-time email history sorted strictly from most recent to oldest with status pills, snippet previews, and full details.

- **👋 Personalized Dynamic Hero Greeting**:
  Emoji-free, time-aware greeting dynamically adapting to local system hours (morning, afternoon, evening, night) and personalized with the authenticated user's display name or username.

---

## 🎨 Editorial Minimalist Design System

The application features a custom **Warm Cashmere & Charcoal** dark theme:
- **Canvas / Background**: #121211 (Deep warm soot)
- **Surfaces / Cards**: #1A1918 (Subtle warm stone container)
- **Elevated Surfaces**: #22211F (Popovers & dropdowns)
- **Borders & Dividers**: #2E2D2B (Soft warm graphite hairline border)
- **Primary Text**: #F5F3EF (Editorial cream / warm off-white)
- **Secondary Text**: #99958F (Warm stone gray)
- **Primary Accent**: #D4A373 (Soft muted almond / warm camel)
- **Secondary Accent**: #ECE8E1 (Warm bone)

---

## 🛠️ Tech Stack & Architecture

### Frontend (Client)
- **Framework**: [React 18](https://reactjs.org/) (Hooks, dynamic SPA routing)
- **Build System**: [Vite 5](https://vitejs.dev/) (Fast HMR & production bundling)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) + Custom Glassmorphism CSS Design System
- **Icons**: [Lucide React](https://lucide.dev/) (Modern SVG UI icons)
- **Hosting**: [Vercel](https://vercel.com/) (Edge Network with SPA rewrite routing)

### Backend (Serverless Edge Function)
- **Runtime**: Deno / TypeScript via [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with Row-Level Security (RLS) & Realtime Channels
- **Authentication**: Supabase Auth + Google OAuth 2.0
- **AI Integration**: [Google Gemini 1.5 Flash](https://ai.google.dev/) + Built-in Rule Engine Fallback
- **Email Dispatch**: Official Google Gmail REST API (gmail.googleapis.com)

---

## 📁 Project Explorer Structure

`	ext
AI-Email/
├── client/                            # 🖥️ Frontend SPA (React 18 + Vite 5)
│   ├── src/
│   │   ├── components/                # Modular views (Dashboard, Compose, Settings, etc.)
│   │   ├── utils/                     # API client, Supabase client, AI engine
│   │   ├── App.jsx                    # Navigation, state management & routing
│   │   ├── main.jsx                   # Theme enforcer & ErrorBoundary
│   │   └── index.css                  # Design tokens & warm cashmere styles
│   ├── public/                        # Static assets (favicon.svg, favicon.ico, sw.js)
│   ├── tailwind.config.js             # Semantic color scales
│   ├── vite.config.js                 # Bundler config & proxy
│   └── vercel.json                    # Client-specific Vercel routing
│
├── supabase/                          # ⚡ Serverless Backend
│   ├── functions/api/                 # Deno TypeScript Edge Function
│   └── schema.sql                     # PostgreSQL schema & functions
│
├── vercel.json                        # Root Vercel deployment configuration
├── package.json                       # Monorepo task runner & build scripts
└── README.md                          # Repository documentation
`

---

## ⚡ 11-Step Human-in-the-Loop Workflow

`	ext
1. Short Instruction ➔ 2. AI Intent Analysis ➔ 3. Situation & Priority Detection ➔
4. Draft Generation ➔ 5. Analysis Review ➔ 6. Manual Override (Optional) ➔
7. User Draft Customization ➔ 8. Attachment Upload ➔ 9. Security Confirmation Modal ➔
10. Gmail REST API Dispatch ➔ 11. Sent Confirmation & Audit History Log
`

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher

### 2. Installation
`ash
git clone https://github.com/yuvasriram2909/Scribe-AI.git
cd Scribe-AI/client
npm install
`

### 3. Local Development
`ash
npm run dev
`
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Production Build
`ash
npm run build
`

---

## 🛡️ Security & Multi-User Isolation Model

- **Multi-Tenant Isolation**: Server-side user scoping on every database query prevents cross-tenant data access.
- **Official Google OAuth**: Uses limited gmail.send scope without reading private inbox emails.
- **Offline Fallback Engine**: If AI API keys or quota limits occur, the system smoothly falls back to built-in rule-based generators.
- **Permanent Dark Theme**: Locked to high-contrast Warm Cashmere & Charcoal theme for professional SaaS environments.

---

## 📄 License

Distributed under the **MIT License**. See LICENSE for details.
