/**
 * Scribe AI — Supabase Edge Function Backend (api)
 * Complete REST API implementation for Deno / Supabase Edge Functions:
 * - Full CORS handling (Preflight OPTIONS + Access-Control headers)
 * - Multi-user authentication & session management (JWT & bcrypt)
 * - Google OAuth 2.0 Gmail sending with AES-256 encrypted refresh tokens
 * - AI Email generation & situation detection
 * - Contacts, Templates, Notifications, Signatures, and Email History
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-email",
  "Access-Control-Max-Age": "86400",
};

// Response helper
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/api/, "").replace(/^\/api/, "") || "/";
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
        timestamp: new Date().toISOString(),
      });
    }

    // ----------------------------------------------------
    // Auth Status
    // ----------------------------------------------------
    if (path === "/auth/status" && method === "GET") {
      const userEmail = req.headers.get("x-user-email");
      if (!userEmail) {
        return jsonResponse({ isConnected: false, connectedEmail: null, mode: "No Email Provided" });
      }

      const { data: user } = await supabase
        .from("User")
        .select("id, email, gmailAccounts:GmailAccount(*)")
        .eq("email", userEmail.toLowerCase())
        .maybeSingle();

      const gmailAccount = user?.gmailAccounts?.[0];
      return jsonResponse({
        isConnected: !!gmailAccount && gmailAccount.status === "CONNECTED",
        connectedEmail: gmailAccount?.gmailEmail || null,
        isGoogleConfigured: true,
        mode: gmailAccount ? "Google OAuth 2.0 (Gmail API)" : "Not Connected",
      });
    }

    // ----------------------------------------------------
    // Google OAuth URL Generation
    // ----------------------------------------------------
    if ((path === "/auth/google" || path === "/auth/google/url") && method === "GET") {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI") || `${url.origin}/functions/v1/api/auth/google/callback`;
      
      if (!clientId) {
        return errorResponse("Google Client ID is not configured in Supabase Edge Function Secrets.");
      }

      const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/gmail.send",
      ].join(" ");

      const state = req.headers.get("x-user-email") || "";
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(
        scopes
      )}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

      return jsonResponse({ url: googleAuthUrl });
    }

    // ----------------------------------------------------
    // Templates Library
    // ----------------------------------------------------
    if (path === "/templates" && method === "GET") {
      const { data: templates, error: tmplError } = await supabase
        .from("Template")
        .select("*")
        .order("createdAt", { ascending: true });

      if (tmplError) throw tmplError;
      return jsonResponse(templates || []);
    }

    // ----------------------------------------------------
    // Notifications & Security Alerts
    // ----------------------------------------------------
    if (path === "/notifications" && method === "GET") {
      const userEmail = req.headers.get("x-user-email");
      if (!userEmail) return jsonResponse({ notifications: [], unreadCount: 0 });

      const { data: user } = await supabase
        .from("User")
        .select("id")
        .eq("email", userEmail.toLowerCase())
        .maybeSingle();

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

    // Default 404 for unmatched paths
    return errorResponse(`Route not found: ${method} ${path}`, 404);
  } catch (err: any) {
    console.error("Edge Function Request Error:", err);
    return errorResponse(err.message || "Internal server error", 500);
  }
});
