# 🏛️ Scribe-AI System Architecture & Workflow Deep Dive

This document details the high-level architecture, end-to-end data pipelines, security models, and system interactions powering **Scribe-AI**.

---

## 📐 1. System Architecture Overview

```mermaid
graph TD
    subgraph ClientLayer["🖥️ Frontend Client Layer (React 18 + Vite)"]
        UI["User Interface (SPA)"]
        Components["Views & Components\n(Compose, Dashboard, History, Settings)"]
        APIFetch["apiFetch Utility\n(Auth Headers & Base URL Injection)"]
        UI --> Components
        Components --> APIFetch
    end

    subgraph ServerLayer["⚙️ Backend Server Layer (Node.js + Express)"]
        API["REST API Router (/api)"]
        AuthMiddleware["Tenant Auth & Security Middleware"]
        AISvc["Gemini AI Service\n(Classification & Drafting)"]
        GmailSvc["Gmail OAuth & API Service\n(MIME Builder & Dispatcher)"]
        SecuritySvc["Security & Device Fingerprinting Service"]
        
        API --> AuthMiddleware
        AuthMiddleware --> AISvc
        AuthMiddleware --> GmailSvc
        AuthMiddleware --> SecuritySvc
    end

    subgraph DataLayer["🗄️ Database & Storage Layer"]
        Prisma["Prisma ORM Client"]
        SQLite[("SQLite Embedded Database\n(dev.db)")]
        Uploads["Local Uploads Storage\n(/uploads)"]
        
        Prisma --> SQLite
    end

    subgraph ExternalServices["🌐 External Cloud Services"]
        GeminiAPI["Google Gemini AI API\n(gemini-1.5-flash / pro)"]
        GoogleOAuth["Google Cloud OAuth 2.0 Provider"]
        GmailREST["Official Gmail REST API\n(gmail.googleapis.com)"]
        NodemailerSMTP["Transactional SMTP Service"]
    end

    APIFetch -->|HTTPS / JSON| API
    AISvc -->|Generative Prompts| GeminiAPI
    GmailSvc -->|OAuth 2.0 Auth Code/Tokens| GoogleOAuth
    GmailSvc -->|RFC 2822 Encoded Emails| GmailREST
    SecuritySvc -->|Alert Emails| NodemailerSMTP
    ServerLayer --> Prisma
    ServerLayer --> Uploads
```

---

## ⚡ 2. The 11-Step Human-in-the-Loop AI Email Workflow

Scribe-AI prioritizes email accuracy, human verification, and zero accidental sends through a rigorous 11-step human-in-the-loop workflow:

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User
    participant Frontend as 🖥️ Compose Interface
    participant Backend as ⚙️ Express API
    participant AI as 🧠 Google Gemini AI
    participant DB as 🗄️ SQLite Database
    participant Gmail as 📮 Official Gmail API

    User->>Frontend: 1. Inputs short natural instruction + recipient
    Frontend->>Backend: 2. POST /api/ai/generate { instruction, recipient }
    Backend->>AI: 3. Intent analysis & situation classification
    AI-->>Backend: 4. Returns JSON { situation, priority, tone, subject, body }
    Backend-->>Frontend: 5. Delivers structured AI draft payload
    Frontend->>User: 6. Displays AI Situation Tag & Priority Badge
    User->>Frontend: 7. (Optional) Manually overrides situation/tone/priority
    User->>Frontend: 8. Reviews, customizes, and edits subject & body
    User->>Frontend: 9. Clicks "Send via Gmail" & approves Security Modal
    Frontend->>Backend: 10. POST /api/emails/send { emailId, subject, body, ... }
    Backend->>Gmail: 11. Constructs RFC 2822 MIME & calls Gmail API
    Gmail-->>Backend: Confirms message dispatched (messageId)
    Backend->>DB: Records sent email in history + creates notification
    Backend-->>Frontend: Returns HTTP 200 OK
    Frontend->>User: Displays success confirmation & updates audit log
```

---

## 🔐 3. Security & Multi-User Isolation Model

### Multi-Tenant Isolation
1. **User Identifier Injection**: Every request sent via [`apiFetch`](file:///c:/Users/testm/Desktop/AI-Email/client/src/utils/api.js) automatically injects the `x-user-email` and `Authorization: Bearer` headers.
2. **Server-Side Verification**: Backend routes strictly query the database using the authenticated `userId`:
   ```javascript
   const user = await prisma.user.findUnique({ where: { email: userEmail } });
   const userEmails = await prisma.email.findMany({ where: { userId: user.id } });
   ```
3. **OAuth Token Security**: Connected Google OAuth tokens (`encryptedAccessToken`, `encryptedRefreshToken`) are scoped strictly to the authenticated user's ID.

### Device & Login Fingerprinting
On every sign-in attempt:
1. The backend parses the client's `User-Agent` to determine the browser (e.g. Chrome, Firefox) and Operating System (Windows, macOS, Linux, iOS, Android).
2. The client's IP address is extracted from `x-forwarded-for` or socket connection.
3. A security log entry and in-app notification are generated.
4. If configured, a transactional security notification is dispatched to notify the user of new device logins.

---

## 📊 4. Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ GMAIL_ACCOUNT : "has"
    USER ||--o{ EMAIL : "sends"
    USER ||--o{ CONTACT : "manages"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o| USER_SIGNATURE : "configures"
    EMAIL ||--o{ ATTACHMENT : "contains"
    EMAIL ||--o{ NOTIFICATION : "triggers"

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        datetime createdAt
    }

    GMAIL_ACCOUNT {
        string id PK
        string userId FK
        string gmailEmail
        string encryptedAccessToken
        string encryptedRefreshToken
        string status
        datetime tokenExpiry
    }

    EMAIL {
        string id PK
        string userId FK
        string recipient
        string subject
        string body
        string category
        string situation
        string priority
        string tone
        string status
        string gmailMessageId
        datetime createdAt
        datetime sentAt
    }

    CONTACT {
        string id PK
        string userId FK
        string name
        string email
        string relationship
        datetime createdAt
    }

    NOTIFICATION {
        string id PK
        string userId FK
        string emailId FK
        string notificationType
        string message
        boolean read
        boolean isTrashed
        datetime createdAt
    }

    USER_SIGNATURE {
        string id PK
        string userId FK
        string name
        string designation
        string company
        string preferredTone
        boolean enabled
    }

    ATTACHMENT {
        string id PK
        string emailId FK
        string filename
        string fileUrl
        string fileType
    }
```
