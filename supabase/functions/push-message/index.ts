import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

// POST { senderId?, senderName?, text?, targetUserId? (admin->client) | toAdmins?:true (client->admin) }
// Déploiement :
//   supabase secrets set VAPID_PRIVATE_KEY=... VAPID_PUBLIC_KEY=... VAPID_SUBJECT=mailto:contact@ztc.shop
//   supabase functions deploy push-message

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { senderId, senderName, text, targetUserId, toAdmins } = await req.json();
    const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const VAPID_PUB = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIV = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contact@ztc.shop";
    const admin = createClient(SUPA_URL, SERVICE_KEY);

    // Gardien : expéditeur = utilisateur JWT si présent, sinon senderId explicite
    let authId = senderId || null;
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (jwt && jwt !== Deno.env.get("SUPABASE_ANON_KEY")) {
      try {
        const tmp = createClient(SUPA_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
        const { data } = await tmp.auth.getUser(jwt);
        if (data?.user) authId = data.user.id;
      } catch { /* mode démo : on garde senderId */ }
    }

    let q = admin.from("push_subscriptions").select("endpoint,p256dh,auth,user_id");
    if (toAdmins) {
      const { data: admins } = await admin.from("profiles").select("id").eq("is_admin", true);
      const ids = (admins || []).map((a: { id: string }) => a.id);
      if (!ids.length) return Response.json({ sent: 0 }, { headers: cors });
      q = q.in("user_id", ids);
    } else if (targetUserId) {
      q = q.eq("user_id", targetUserId);
    } else {
      return Response.json({ error: "no target" }, { status: 400, headers: cors });
    }
    if (authId) q = q.neq("user_id", authId);
    const { data: subs } = await q;
    if (!subs?.length) return Response.json({ sent: 0 }, { headers: cors });

    webpush.setVapidDetails(SUBJECT, VAPID_PUB, VAPID_PRIV);
    const payload = JSON.stringify({
      title: senderName ? `💬 ${String(senderName).slice(0, 40)} — ZTC Support` : "💬 ZTC Support",
      body: String(text || "Nouveau message").slice(0, 120),
      url: toAdmins ? "/admin" : "/support",
    });
    let sent = 0;
    let removed = 0;
    await Promise.all(
      (subs || []).map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
        } catch (e: unknown) {
          const code = (e as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            removed++;
            await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
        }
      }),
    );
    return Response.json({ sent, removed }, { headers: cors });
  } catch (e) {
    return Response.json({ error: String((e as Error)?.message || e) }, { status: 500, headers: cors });
  }
});
