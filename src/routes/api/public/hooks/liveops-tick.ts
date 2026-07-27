import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/liveops-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env.SUPABASE_URL!;
        const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const secret = process.env.LIVEOPS_TICK_SECRET;
        if (!url || !service) return new Response("Missing config", { status: 500 });
        // Require a shared secret so this internet-reachable route cannot be
        // used to trigger privileged live-ops processing anonymously.
        if (!secret) return new Response("Endpoint disabled", { status: 503 });
        const provided =
          request.headers.get("x-liveops-secret") ??
          (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        if (!provided || provided !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { createClient } = await import("@supabase/supabase-js");
        const admin = createClient(url, service, { auth: { persistSession: false } });
        const { data, error } = await admin.rpc("tick_liveops");
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return Response.json({ ok: true, result: data ?? null });
      },
      GET: async () => Response.json({ ok: true, hint: "POST with x-liveops-secret header" }),
    },
  },
});