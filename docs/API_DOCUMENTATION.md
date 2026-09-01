# 🌐 Scribe-AI REST API Specification

All backend endpoints are prefixed with `/api`. Requests must include appropriate authentication headers when accessing protected endpoints.

---

## 🔑 Authentication Headers

| Header | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `x-user-email` | Active user's account email address | Yes (for protected endpoints) | `user@example.com` |
| `Authorization` | Bearer token formatted string | Optional / Recommended | `Bearer <token>` |

---

## 📌 Summary of Endpoints

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Service health status and timestamp |
| **Auth** | `POST` | `/api/auth/register` | Register new user account |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & trigger security fingerprinting |
| **Auth** | `GET` | `/api/auth/google/url` | Retrieve Google OAuth 2.0 consent screen URL |
| **Auth** | `GET` | `/api/auth/google/callback` | OAuth redirect callback handler |
| **Auth** | `GET` | `/api/auth/gmail/status` | Check user's connected Gmail OAuth status |
| **AI** | `POST` | `/api/ai/generate` | Classify situation & generate structured email draft |
| **AI** | `POST` | `/api/ai/analyze` | Standalone situation & urgency detection |
| **Emails** | `GET` | `/api/emails` | List all emails for the authenticated user |
| **Emails** | `POST` | `/api/emails/save-draft` | Save or update an email draft |
| **Emails** | `POST` | `/api/emails/send` | Dispatch email via connected Gmail account |
| **Emails** | `DELETE`| `/api/emails/:id` | Delete an email record |
| **Contacts**| `GET` | `/api/contacts` | Retrieve address book contacts |
| **Contacts**| `POST` | `/api/contacts` | Add a new contact with relationship & tone tags |
| **Contacts**| `DELETE`| `/api/contacts/:id` | Remove a contact from the address book |
| **Templates**| `GET` | `/api/templates` | Retrieve system & user canned email templates |
| **Notifications**| `GET` | `/api/notifications` | Fetch real-time user notification cards |
| **Notifications**| `PATCH`| `/api/notifications/:id/read` | Mark a notification as read |
| **Notifications**| `PATCH`| `/api/notifications/:id/trash`| Move notification to trash |
| **Settings**| `GET` | `/api/settings/signature` | Fetch user email signature |
| **Settings**| `POST` | `/api/settings/signature` | Save or update user signature details |

---

## 🔍 Detailed Endpoint Payloads

### 1. AI Generation (`POST /api/ai/generate`)

**Request Payload:**
```json
{
  "instruction": "Ask manager for leave tomorrow due to high fever",
  "recipient": "manager@company.com",
  "recipientName": "Sarah",
  "selectedSituation": "📅 Leave / Holiday"
}
```

**Response (200 OK):**
```json
{
  "situation": "📅 Leave / Holiday",
  "category": "Leave/Holiday",
  "priority": "Normal",
  "tone": "Professional",
  "suggested_subject": "Leave Request for Tomorrow due to Unwell Health",
  "greeting": "Dear Sarah,",
  "email_body": "I am writing to formally request a day of leave for tomorrow due to a high fever. I will ensure all urgent tasks are handled prior to stepping away and will keep you informed of my recovery.",
  "closing": "Warm regards,",
  "sign_off": "Your Name"
}
```

---

### 2. Email Dispatch (`POST /api/emails/send`)

**Request Payload:**
```json
{
  "emailId": "optional-existing-draft-id",
  "recipient": "client@example.com",
  "cc": "team@example.com",
  "bcc": "",
  "subject": "Project Milestone 3 Update",
  "body": "Hello,\n\nPlease find attached the status report for Milestone 3.",
  "situation": "💼 Official / Professional",
  "priority": "Normal",
  "tone": "Professional"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email sent successfully via Gmail API!",
  "email": {
    "id": "c1f7b0e2-...",
    "status": "Sent",
    "gmailMessageId": "18f9d0c2e9b81234",
    "sentAt": "2026-08-14T14:25:00.000Z"
  }
}
```

---

### 3. Google OAuth Status (`GET /api/auth/gmail/status`)

**Response (200 OK):**
```json
{
  "connected": true,
  "email": "user@gmail.com",
  "status": "CONNECTED",
  "tokenExpiry": "2026-08-14T16:00:00.000Z"
}
```
