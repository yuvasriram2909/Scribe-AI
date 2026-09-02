/**
 * ============================================================================
 * Scribe AI — Supabase Edge Function Backend (api)
 * ============================================================================
 * Complete Deno / TypeScript Edge Function implementation:
 * - Full CORS Handling & Preflight Support
 * - User Authentication (Register, Login, Me, Logout) with JWT & Password Hashing
 * - Single Google OAuth 2.0 Client & Multi-User Gmail API Email Dispatch
 * - AI Situation Classification & Content Generation (Gemini API + Pattern Engine)
 * - Email History, Contacts, Templates, Notifications, and Signatures
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-email",
  "Access-Control-Max-Age": "86400",
};

// Response helpers
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function errorResponse(error: string, status = 400) {
  return jsonResponse({ success: false, error }, status);
}

// ----------------------------------------------------
// Web Crypto Helpers (AES-256-GCM, SHA-256, HMAC, JWT)
// ----------------------------------------------------

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  
  // PBKDF2 format
  if (storedHash.startsWith("pbkdf2:")) {
    const [, saltHex, hashHex] = storedHash.split(":");
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    const checkHashHex = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === checkHashHex;
  }

  // SHA-256 legacy check
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(password));
  const sha256Hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  if (storedHash === sha256Hex) return true;

  // Fallback for direct match
  return storedHash === password;
}

// Token encryption for OAuth tokens at rest
async function getCryptoKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("ENCRYPTION_KEY") || Deno.env.get("JWT_SECRET") || "scribe_ai_default_encryption_secret_key_32_chars";
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptToken(text: string): Promise<string> {
  if (!text) return "";
  try {
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const encHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${ivHex}:${encHex}`;
  } catch (err) {
    console.warn("Token encryption warning:", err);
    return text;
  }
}

async function decryptToken(cipherText: string): Promise<string> {
  if (!cipherText || !cipherText.includes(":")) return cipherText;
  try {
    const [ivHex, encHex] = cipherText.split(":");
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
    const encrypted = new Uint8Array(encHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
    const key = await getCryptoKey();
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn("Token decryption notice:", err);
    return cipherText;
  }
}

// ----------------------------------------------------
// Authentication Resolution Helper
// ----------------------------------------------------

async function getAuthUser(req: Request, supabase: any) {
  let targetEmail = req.headers.get("x-user-email");

  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    try {
      // Decode JWT payload without third-party library
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload.email) targetEmail = payload.email.toLowerCase();
        if (payload.id) {
          const { data: userById } = await supabase
            .from("User")
            .select("*, signature:UserSignature(*), gmailAccounts:GmailAccount(*)")
            .eq("id", payload.id)
            .maybeSingle();
          if (userById) return userById;
        }
      }
    } catch (_) {}
  }

  if (targetEmail) {
    const { data: userByEmail } = await supabase
      .from("User")
      .select("*, signature:UserSignature(*), gmailAccounts:GmailAccount(*)")
      .eq("email", targetEmail.trim().toLowerCase())
      .maybeSingle();
    if (userByEmail) return userByEmail;
  }

  return null;
}

// ----------------------------------------------------
// Main Edge Function Server Handler
// ----------------------------------------------------

serve(async (req: Request) => {
  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Normalize path removing function prefix
  let path = url.pathname.replace(/^\/functions\/v1\/api/, "").replace(/^\/api/, "") || "/";
  if (!path.startsWith("/")) path = "/" + path;
  const method = req.method;

  // Supabase Client Initialization
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ----------------------------------------------------
    // Healthcheck
    // ----------------------------------------------------
    if (path === "/health" || path === "/") {
      return jsonResponse({
        status: "online",
        service: "Scribe AI Supabase Edge Function",
        endpoint: "https://bjxjorlxjjssrqjosed.supabase.co/functions/v1/api",
        timestamp: new Date().toISOString(),
      });
    }

    // ----------------------------------------------------
    // User Authentication: Register, Login, Me, Logout
    // ----------------------------------------------------

    if (path === "/auth/register" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { name, email, password, confirmPassword } = body;

      if (!name || !name.trim()) return errorResponse("Full Name is required.");
      if (!email || !email.trim()) return errorResponse("Valid email address is required.");
      if (!password || password.trim().length < 6) return errorResponse("Password must be at least 6 characters long.");
      if (confirmPassword !== undefined && password.trim() !== confirmPassword.trim()) {
        return errorResponse("Password and Confirm Password do not match.");
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check existing user
      const { data: existing } = await supabase
        .from("User")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existing) {
        return jsonResponse({ error: "An account with this email already exists. Please log in." }, 409);
      }

      const passwordHash = await hashPassword(password.trim());
      const now = new Date().toISOString();

      // Insert User
      const { data: newUser, error: createErr } = await supabase
        .from("User")
        .insert({
          id: crypto.randomUUID(),
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (createErr) throw createErr;

      // Create default user signature
      await supabase.from("UserSignature").insert({
        id: crypto.randomUUID(),
        userId: newUser.id,
        name: name.trim(),
        designation: "",
        company: "",
        phone: "",
        website: "",
        preferredTone: "Professional",
        enabled: true,
        createdAt: now,
        updatedAt: now,
      });

      return jsonResponse({
        success: true,
        message: "Account created successfully! Please log in with your credentials.",
      }, 201);
    }

    if (path === "/auth/login" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { email, password } = body;

      if (!email || !password) return errorResponse("Email and Password are required.");

      const cleanEmail = email.trim().toLowerCase();
      const { data: user, error: userErr } = await supabase
        .from("User")
        .select("*, signature:UserSignature(*), gmailAccounts:GmailAccount(*)")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (userErr || !user || !user.passwordHash) {
        return jsonResponse({ error: "Invalid email or password." }, 401);
      }

      const isValid = await verifyPassword(password.trim(), user.passwordHash);
      if (!isValid) {
        return jsonResponse({ error: "Invalid email or password." }, 401);
      }

      // Generate simple JWT
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({ id: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 7 * 86400 }));
      const token = `${header}.${payload}.signature`;

      // Update lastLoginAt
      await supabase
        .from("User")
        .update({ lastLoginAt: new Date().toISOString() })
        .eq("id", user.id);

      return jsonResponse({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          signature: user.signature?.[0] || null,
          gmailAccounts: user.gmailAccounts || [],
        },
      });
    }

    if (path === "/auth/logout") {
      return jsonResponse({ success: true, message: "Logged out successfully." });
    }

    if (path === "/auth/me" && method === "GET") {
      const user = await getAuthUser(req, supabase);
      if (!user) return jsonResponse({ authenticated: false, error: "Not authenticated." }, 401);

      return jsonResponse({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          signature: user.signature?.[0] || null,
          gmailAccounts: user.gmailAccounts || [],
        },
      });
    }

    // ----------------------------------------------------
    // Google OAuth 2.0 & Gmail Status / URL / Callback
    // ----------------------------------------------------

    if (path === "/auth/status" && method === "GET") {
      const user = await getAuthUser(req, supabase);
      if (!user) {
        return jsonResponse({
          isConnected: false,
          status: "DISCONNECTED",
          connectedEmail: null,
          isGoogleConfigured: true,
          mode: "Not Logged In",
        });
      }

      const { data: accounts } = await supabase
        .from("GmailAccount")
        .select("*")
        .eq("userId", user.id);

      const account = accounts?.[0];
      const isConnected = !!account && account.status !== "DISCONNECTED";

      return jsonResponse({
        isConnected,
        status: account ? (account.status || "CONNECTED") : "DISCONNECTED",
        connectedEmail: account?.gmailEmail || null,
        isGoogleConfigured: true,
        mode: isConnected ? "Google OAuth Connected ✓" : "Not Connected",
      });
    }

    if ((path === "/auth/google" || path === "/auth/google/url") && method === "GET") {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID") || "";
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://scribe-ai-self.vercel.app";
      const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI") || `${url.origin}/functions/v1/api/auth/google/callback`;

      if (!clientId) {
        return errorResponse("Google Client ID is not configured in Supabase Edge Function Secrets.");
      }

      const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/gmail.send",
      ].join(" ");

      const userEmail = req.headers.get("x-user-email") || "";
      const state = btoa(`${userEmail}:${Date.now()}`);

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(
        scopes
      )}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

      return jsonResponse({ configured: true, url: googleAuthUrl });
    }

    if (path === "/auth/google/callback" && method === "GET") {
      const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://scribe-ai-self.vercel.app";
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const oauthError = url.searchParams.get("error");

      if (oauthError) {
        return Response.redirect(`${frontendUrl}?gmail=cancelled`, 302);
      }

      if (!code) return errorResponse("Authorization code missing.", 400);

      let targetEmail = "";
      if (state) {
        try {
          const decoded = atob(state);
          targetEmail = decoded.split(":")[0];
        } catch (_) {}
      }

      const { data: user } = await supabase
        .from("User")
        .select("id, email")
        .eq("email", targetEmail.toLowerCase())
        .maybeSingle();

      if (!user) {
        return Response.redirect(`${frontendUrl}?error=user_not_found`, 302);
      }

      // Exchange code with Google
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID") || "";
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
      const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI") || `${url.origin}/functions/v1/api/auth/google/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error || "Token exchange failed");
      }

      // Fetch user profile from Google
      let authorizedEmail = user.email;
      if (tokenData.access_token) {
        try {
          const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const profile = await profileRes.json();
          if (profile.email) authorizedEmail = profile.email;
        } catch (_) {}
      }

      const encryptedRefreshToken = tokenData.refresh_token ? await encryptToken(tokenData.refresh_token) : "";

      // Remove existing account for this user and insert new
      await supabase.from("GmailAccount").delete().eq("userId", user.id);

      const now = new Date().toISOString();
      await supabase.from("GmailAccount").insert({
        id: crypto.randomUUID(),
        userId: user.id,
        gmailEmail: authorizedEmail,
        encryptedAccessToken: tokenData.access_token || "",
        encryptedRefreshToken,
        status: "CONNECTED",
        createdAt: now,
        updatedAt: now,
      });

      return Response.redirect(`${frontendUrl}?gmail=connected`, 302);
    }

    if (path === "/auth/google/disconnect" && (method === "POST" || method === "DELETE")) {
      const user = await getAuthUser(req, supabase);
      if (!user) return errorResponse("Unauthorized", 401);

      await supabase.from("GmailAccount").delete().eq("userId", user.id);
      return jsonResponse({ success: true, message: "Gmail account disconnected successfully." });
    }

    // ----------------------------------------------------
    // AI Situation Categorization & Generation
    // ----------------------------------------------------

    if (path === "/ai/categorize" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const input = body.instruction || body.subject || "";
      if (!input.trim()) return errorResponse("Please enter a subject or instruction.");

      const lower = input.toLowerCase();
      let situation = "💼 Official / Professional";
      let category = "Official/Professional";
      let priority = "Normal";
      let tone = "Professional";

      if (lower.includes("leave") || lower.includes("vacation") || lower.includes("sick") || lower.includes("holiday") || lower.includes("wfh") || lower.includes("work from home")) {
        situation = "📅 Leave / Holiday";
        category = "Leave/Holiday";
        tone = "Polite";
      } else if (lower.includes("urgent") || lower.includes("emergency") || lower.includes("asap") || lower.includes("outage")) {
        situation = "🚨 Emergency";
        category = "Emergency";
        priority = "High";
        tone = "Urgent";
      } else if (lower.includes("resume") || lower.includes("job") || lower.includes("apply") || lower.includes("interview") || lower.includes("application")) {
        situation = "📄 Resume / Job Application";
        category = "Resume/Job Application";
        tone = "Formal";
      } else if (lower.includes("payment") || lower.includes("invoice") || lower.includes("salary") || lower.includes("dues")) {
        situation = "⚠️ Important / Necessary";
        category = "Important";
        priority = "High";
        tone = "Direct";
      } else if (lower.includes("follow") || lower.includes("status update") || lower.includes("checking in")) {
        situation = "🔄 Follow-up";
        category = "Follow-up";
        tone = "Professional";
      }

      return jsonResponse({
        success: true,
        situation,
        category,
        pattern: situation,
        detectedFormat: situation,
        tone,
        priority,
        urgency: priority,
        attachment_recommended: situation.includes("Resume"),
        attachment_filename: situation.includes("Resume") ? "resume.pdf" : null,
      });
    }

    if (path === "/ai/generate" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { instruction, subject, situation, category, tone, priority, recipient, recipientName } = body;
      const input = instruction || subject || "";
      if (!input.trim()) return errorResponse("Please enter a subject or instruction.");

      const user = await getAuthUser(req, supabase);
      const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

      let generatedSubject = subject || `Regarding: ${input.slice(0, 40)}`;
      let generatedBody = "";
      const greeting = recipientName ? `Dear ${recipientName},` : "Dear Sir/Madam,";
      const signatureName = user?.signature?.[0]?.name || user?.name || "[Your Name]";
      const closing = `Best regards,\n${signatureName}`;

      if (geminiApiKey) {
        try {
          const geminiPrompt = `You are a professional email assistant. Write a high quality email body based strictly on this request:
User Problem/Instruction: "${input}"
Subject: "${subject || ''}"
Tone: "${tone || 'Professional'}"
Recipient: "${recipientName || 'Manager/Client'}"

RULES:
1. Do not hallucinate fake dates, order numbers, or company names; use placeholders like [Date], [Company Name] if not given.
2. Structure with proper paragraphs.
3. Return ONLY valid JSON:
{
  "subject": "Clear email subject",
  "body": "Full body text"
}`;

          const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: geminiPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
              }),
            }
          );
          const aiData = await aiRes.json();
          const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed.subject) generatedSubject = parsed.subject;
            if (parsed.body) generatedBody = parsed.body;
          }
        } catch (e) {
          console.warn("Gemini generation fallback:", e);
        }
      }

      if (!generatedBody) {
        generatedBody = `${greeting}\n\nI am writing to formally communicate regarding ${input}.\n\nPlease let me know if any additional details are needed, and thank you for your understanding.\n\n${closing}`;
      }

      return jsonResponse({
        success: true,
        situation: situation || "💼 Official / Professional",
        category: category || "Official/Professional",
        tone: tone || "Professional",
        priority: priority || "Normal",
        subject: generatedSubject,
        suggested_subject: generatedSubject,
        body: generatedBody,
        email_body: generatedBody,
        greeting,
        closing: `Best regards,\n${signatureName}`,
      });
    }

    // ----------------------------------------------------
    // Send Email via Gmail REST API
    // ----------------------------------------------------

    if ((path === "/emails/send" || path === "/email/send") && method === "POST") {
      const user = await getAuthUser(req, supabase);
      if (!user) return errorResponse("Authentication required to send emails.", 401);

      const body = await req.json().catch(() => ({}));
      const { recipient, cc, bcc, subject, body: emailBody, category, situation, priority, tone } = body;

      if (!recipient || !subject || !emailBody) {
        return errorResponse("Recipient, Subject, and Body are required.");
      }

      const { data: accounts } = await supabase
        .from("GmailAccount")
        .select("*")
        .eq("userId", user.id);

      const account = accounts?.[0];
      if (!account || (!account.encryptedAccessToken && !account.encryptedRefreshToken)) {
        return errorResponse("Please connect your Gmail account in Settings first.");
      }

      let accessToken = account.encryptedAccessToken;
      const refreshToken = await decryptToken(account.encryptedRefreshToken);

      // Refresh Google Access Token if refresh token is available
      if (refreshToken) {
        const clientId = Deno.env.get("GOOGLE_CLIENT_ID") || "";
        const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.access_token) {
          accessToken = refreshData.access_token;
          await supabase
            .from("GmailAccount")
            .update({ encryptedAccessToken: accessToken, updatedAt: new Date().toISOString() })
            .eq("id", account.id);
        }
      }

      // Encode RFC 2822 MIME Email
      const emailLines = [
        `From: ${account.gmailEmail}`,
        `To: ${recipient}`,
        cc ? `Cc: ${cc}` : "",
        bcc ? `Bcc: ${bcc}` : "",
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 7bit",
        "",
        emailBody,
      ].filter(Boolean).join("\r\n");

      const rawBase64 = btoa(unescape(encodeURIComponent(emailLines)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawBase64 }),
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok || sendData.error) {
        throw new Error(sendData.error?.message || "Failed to send email through Gmail API");
      }

      // Record email in database
      const now = new Date().toISOString();
      const { data: emailRecord } = await supabase
        .from("Email")
        .insert({
          id: crypto.randomUUID(),
          userId: user.id,
          recipient,
          cc: cc || null,
          bcc: bcc || null,
          subject,
          body: emailBody,
          category: category || "Official/Professional",
          situation: situation || "💼 Official / Professional",
          priority: priority || "Normal",
          tone: tone || "Professional",
          status: "Sent",
          sentAt: now,
          gmailMessageId: sendData.id || null,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      // Create notification
      await supabase.from("Notification").insert({
        id: crypto.randomUUID(),
        userId: user.id,
        emailId: emailRecord?.id || null,
        notificationType: category || "General",
        message: `Email "${subject}" successfully sent to ${recipient} via Gmail.`,
        createdAt: now,
        updatedAt: now,
      });

      return jsonResponse({
        success: true,
        message: `Email sent successfully from ${account.gmailEmail}!`,
        gmailMessageId: sendData.id,
        email: emailRecord,
      });
    }

    // ----------------------------------------------------
    // Contacts, Templates, Notifications, Signatures
    // ----------------------------------------------------

    if (path === "/contacts" && method === "GET") {
      const user = await getAuthUser(req, supabase);
      if (!user) return errorResponse("Unauthorized", 401);

      const { data: contacts } = await supabase
        .from("Contact")
        .select("*")
        .eq("userId", user.id)
        .order("name", { ascending: true });

      return jsonResponse(contacts || []);
    }

    if (path === "/contacts" && method === "POST") {
      const user = await getAuthUser(req, supabase);
      if (!user) return errorResponse("Unauthorized", 401);

      const body = await req.json().catch(() => ({}));
      const { name, email, relationship } = body;
      if (!name || !email) return errorResponse("Name and email are required.");

      const now = new Date().toISOString();
      const { data: contact, error: cntErr } = await supabase
        .from("Contact")
        .insert({
          id: crypto.randomUUID(),
          userId: user.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          relationship: relationship || "Other",
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (cntErr) throw cntErr;
      return jsonResponse(contact, 201);
    }

    if (path.startsWith("/contacts/") && method === "DELETE") {
      const user = await getAuthUser(req, supabase);
      if (!user) return errorResponse("Unauthorized", 401);
      const id = path.split("/")[2];

      await supabase.from("Contact").delete().eq("id", id).eq("userId", user.id);
      return jsonResponse({ success: true, message: "Contact deleted." });
    }

    if (path === "/emails" && method === "GET") {
      const user = await getAuthUser(req, supabase);
      if (!user) return errorResponse("Unauthorized", 401);

      const statusQuery = url.searchParams.get("status");
      let query = supabase.from("Email").select("*, attachments:Attachment(*)").eq("userId", user.id);
      if (statusQuery) query = query.eq("status", statusQuery);

      const { data: emails } = await query.order("createdAt", { ascending: false });
      return jsonResponse(emails || []);
    }

    if (path.startsWith("/emails/") && method === "DELETE") {
      const user = await getAuthUser(req, supabase);
      if (!user) return errorResponse("Unauthorized", 401);
      const id = path.split("/")[2];

      await supabase.from("Email").delete().eq("id", id).eq("userId", user.id);
      return jsonResponse({ success: true, message: "Email removed." });
    }

    if (path === "/templates" && method === "GET") {
      const { data: templates } = await supabase
        .from("Template")
        .select("*")
        .order("createdAt", { ascending: true });
      return jsonResponse(templates || []);
    }

    if (path === "/notifications" && method === "GET") {
      const user = await getAuthUser(req, supabase);
      if (!user) return jsonResponse({ notifications: [], unreadCount: 0 });

      const { data: notifications } = await supabase
        .from("Notification")
        .select("*")
        .eq("userId", user.id)
        .eq("isTrashed", false)
        .order("createdAt", { ascending: false });

      const unreadCount = (notifications || []).filter((n: any) => !n.read).length;
      return jsonResponse({ notifications: notifications || [], unreadCount });
    }

    if (path === "/notifications/read-all" && (method === "POST" || method === "PATCH")) {
      const user = await getAuthUser(req, supabase);
      if (!user) return errorResponse("Unauthorized", 401);

      await supabase
        .from("Notification")
        .update({ read: true, updatedAt: new Date().toISOString() })
        .eq("userId", user.id)
        .eq("read", false);

      return jsonResponse({ success: true, message: "All notifications marked as read." });
    }

    if (path === "/settings/signature" && method === "GET") {
      const user = await getAuthUser(req, supabase);
      if (!user) return errorResponse("Unauthorized", 401);

      const { data: sig } = await supabase
        .from("UserSignature")
        .select("*")
        .eq("userId", user.id)
        .maybeSingle();

      return jsonResponse(sig || { name: user.name, preferredTone: "Professional", enabled: true });
    }

    if (path === "/settings/signature" && method === "PUT") {
      const user = await getAuthUser(req, supabase);
      if (!user) return errorResponse("Unauthorized", 401);

      const body = await req.json().catch(() => ({}));
      const now = new Date().toISOString();

      const { data: updated } = await supabase
        .from("UserSignature")
        .upsert({
          userId: user.id,
          name: body.name || user.name,
          designation: body.designation || "",
          company: body.company || "",
          phone: body.phone || "",
          website: body.website || "",
          preferredTone: body.preferredTone || "Professional",
          enabled: body.enabled !== undefined ? !!body.enabled : true,
          updatedAt: now,
        })
        .select()
        .single();

      return jsonResponse(updated);
    }

    // Default 404 for unmatched paths
    return errorResponse(`API endpoint not found: ${method} ${path}`, 404);
  } catch (err: any) {
    console.error("Edge Function Handler Error:", err);
    return errorResponse(err.message || "Internal server error", 500);
  }
});
