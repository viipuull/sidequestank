import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/liveops-tick")({
  server: {
    handlers: {
      POST: async () => {
        const url = process.env.SUPABASE_URL!;
        const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        if (!url || !service) return new Response("Missing config", { status: 500 });
        const { createClient } = await import("@supabase/supabase-js");
        const admin = createClient(url, service, { auth: { persistSession: false } });
        const { data, error } = await admin.rpc("tick_liveops");
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return Response.json({ ok: true, result: data ?? null });
      },
      GET: async () => Response.json({ ok: true, hint: "POST to tick liveops" }),
    },
  },
});