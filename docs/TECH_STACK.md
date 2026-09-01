# 🛠️ Scribe-AI Technical Stack & Tools Reference

This document provides a comprehensive inventory of all technologies, frameworks, libraries, tools, and protocols used across the frontend, backend, AI integration, and database layers of **Scribe-AI**.

---

## 📊 Complete Technology Matrix

| Layer | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** | `^18.3.1` | Component-based interactive UI with React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) for reactive state management. |
| **Frontend Build Tool** | **Vite** | `^5.2.11` | Ultra-fast Hot Module Replacement (HMR), lightning-quick ES modules bundling, and built-in proxy support. |
| **Styling & Design** | **Tailwind CSS + Custom CSS** | `^3.4.3` | Utility-first styling combined with bespoke CSS variables for dark-mode glassmorphism, responsive grid layouts, and micro-interactions. |
| **CSS Preprocessing** | **PostCSS & Autoprefixer** | `^8.4.38` / `^10.4.19` | Cross-browser CSS vendor prefixing and CSS optimization. |
| **Iconography** | **Lucide React** | `^0.378.0` | Consistent, modern, lightweight SVG icons across all views and buttons. |
| **Backend Runtime** | **Node.js** | `>= 18.0.0` | High-performance asynchronous JavaScript runtime executing backend services using modern ES Modules (`import`/`export`). |
| **Backend Framework** | **Express.js** | `^4.19.2` | Fast, unopinionated, minimalist web framework for designing RESTful API endpoints and middleware pipelines. |
| **Artificial Intelligence** | **Google Gemini AI SDK** | `^0.11.0` (`@google/generative-ai`) | State-of-the-art LLM for intent analysis, 8-situation classification, priority detection, subject formulation, and email drafting. |
| **Database** | **SQLite** | `v3` | Lightweight, zero-configuration serverless SQL database engine, ideal for fast embedded queries and low-latency storage. |
| **ORM & Modeling** | **Prisma ORM** | `^5.14.0` | Declarative database schema, automated migrations (`prisma db push`), auto-generated type-safe database queries. |
| **Email Dispatch** | **Official Gmail API** | `^137.0.0` (`googleapis`) | Enterprise-grade direct integration with Google Workspace and Gmail REST API via OAuth 2.0. |
| **Security Alerts** | **Nodemailer** | `^9.0.5` | Transactional email transmission for multi-platform login security notices and system warnings. |
| **File Uploads** | **Multer** | `^1.4.5-lts.1` | Multipart form-data middleware handling email attachments with disk storage management. |
| **Security & Auth** | **JWT & Token Headers** | Standard | JSON Web Tokens for stateless API authentication and user isolation. |
| **Development Tooling** | **Concurrently** | `^8.2.2` | Orchestrates concurrent startup of frontend and backend servers in a single terminal command (`npm run dev`). |
| **Development Tooling** | **Nodemon** | `^3.1.0` | Automatically restarts the Node.js server upon backend source code changes during development. |

---

## 🎨 1. Frontend Architecture & Tools

### React 18 & Component Ecosystem
- **State Architecture**: Uses React Hooks to manage application state locally without the overhead of heavy external state managers.
- **Views**:
  - `ComposeWorkflow.jsx`: 11-step human-in-the-loop composition pipeline.
  - `Dashboard.jsx`: Analytics, counters, recent email feeds, and quick navigation.
  - `EmailHistory.jsx`: Complete audit log of sent, draft, and failed emails with search and filtering.
  - `ContactsManager.jsx`: Contact relationship organizer with tailored tone preferences.
  - `TemplatesLibrary.jsx`: Reusable canned templates for quick email dispatch.
  - `NotificationCenter.jsx`: Unread alerts, security notices, and bulk actions.
  - `SettingsView.jsx`: Google OAuth account connection, custom sender signatures, and default tone configuration.
  - `LoginPage.jsx`: Multi-user sign-in, account creation, and demo profiles.
  - `PublicLandingPage.jsx`: Modern showcase hero, feature highlights, and onboarding CTA.
  - `PrivacyPolicy.jsx` & `TermsOfService.jsx`: Compliant legal disclosures for Google OAuth verification.

### Styling & Glassmorphism Design System
- **Theme**: Premium futuristic dark mode with purple/indigo/emerald accent highlights.
- **Components**: Frosted glass containers (`backdrop-blur-md bg-slate-900/60 border border-slate-800`), gradient text highlights, animated loaders, and status pills.
- **Responsiveness**: Fully responsive grid and flexbox layout across Mobile, Tablet, and Desktop breakpoints.

---

## ⚙️ 2. Backend Architecture & Services

### Express.js REST API Server
- **Routing**: Clean route separation in [`server/src/routes/api.js`](file:///c:/Users/testm/Desktop/AI-Email/server/src/routes/api.js).
- **Middleware**:
  - `cors`: Handles Cross-Origin Resource Sharing with credentials support.
  - `express.json()` & `express.urlencoded()`: Parses incoming JSON and URL-encoded bodies up to 50MB.
  - `multer`: Intercepts file uploads for attachments.
  - `authMiddleware`: Extracts `x-user-email` and `Authorization: Bearer <token>` to authenticate every request and ensure tenant isolation.

### Google Gemini AI Engine (`aiService.js`)
- Uses `@google/generative-ai` to prompt Gemini models with strict JSON schema instructions.
- Categorizes inputs into 8 specific situations:
  1. 🚨 **Emergency**
  2. ⚠️ **Important / Necessary**
  3. 💼 **Official / Professional**
  4. 📅 **Leave / Holiday**
  5. 📄 **Resume / Job Application**
  6. 🔄 **Follow-up**
  7. 💬 **Casual**
  8. 🎉 **Celebration / Occasion**
- Features a **Heuristic Fallback Engine** (`emailPatterns.js`) that automatically triggers if the Gemini API key is missing or rate-limited, guaranteeing 100% uptime for users.

### Google OAuth 2.0 & Gmail API (`gmailService.js`)
- Authenticates users with Google Cloud via `OAuth2Client`.
- Manages refresh tokens, auto-refreshes expired access tokens, and securely stores tokens linked to user accounts.
- Encodes emails into standard RFC 2822 format with base64url encoding and dispatches them directly via `gmail.users.messages.send`.

### Security & Device Intelligence (`securityService.js`)
- Inspects incoming HTTP `User-Agent` and `x-forwarded-for` headers.
- Identifies browser (Chrome, Firefox, Safari, Edge), operating system (Windows, macOS, Linux, iOS, Android), and IP address.
- Generates in-app notifications and sends security alert emails when logins occur from new devices or locations.

---

## 🗄️ 3. Database Architecture (SQLite & Prisma)

### Database Models
- **`User`**: Core account entity with email, name, password hash, and relation to all user records.
- **`GmailAccount`**: Encrypted OAuth access/refresh tokens, status, and expiry for connected Google accounts.
- **`Email`**: Stores sent and draft emails, recipients, subjects, bodies, priority, tone, category, and Gmail message IDs.
- **`Attachment`**: Uploaded file metadata associated with emails.
- **`Notification`**: Real-time alerts, login notifications, and system messages with read/trash states.
- **`Contact`**: User's address book with relationship tags (HR, Client, Manager, Friend) and custom tone mappings.
- **`UserSignature`**: Customizable email signatures automatically appended to outbound emails.
- **`Template`**: Pre-configured email templates.
- **`SystemConfig`**: Key-value store for runtime dynamic configurations.
