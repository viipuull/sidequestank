import { createFileRoute } from "@tanstack/react-router";

/**
 * Called by the database trigger whenever an in-app notification is created,
 * so every automatic game event also reaches the player's push devices.
 * Authenticated with the project's publishable key (same pattern as cron).
 */
export const Route = createFileRoute("/api/public/hooks/push-notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected =
          process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ?? process.env['SUPABASE_ANON_KEY'];
        const provided =
          request.headers.get("apikey") ??
          (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        if (!expected || !provided || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: { notification_id?: string };
        try {
          body = (await request.json()) as { notification_id?: string };
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const id = body.notification_id;
        if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Bad request", { status: 400 });

        try {
          const { pushNotificationToUser } = await import("@/lib/push-auto.server");
          const result = await pushNotificationToUser(id);
          return Response.json(result);
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "push failed" },
            { status: 200 },
          );
        }
      },
      GET: async () => Response.json({ ok: true, hint: "POST { notification_id } with apikey header" }),
    },
  },
});