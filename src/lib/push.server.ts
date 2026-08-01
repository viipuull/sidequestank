/** Firebase Cloud Messaging HTTP v1 sender (Workers-safe, no Node SDK). */

type ServiceAccount = { client_email: string; private_key: string; project_id: string };

function b64url(input: ArrayBuffer | string) {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const raw = atob(body);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

function serviceAccount(): ServiceAccount {
  const raw = process.env['FIREBASE_SERVICE_ACCOUNT_JSON'];
  if (!raw) throw new Error("Push is not configured yet (missing Firebase service account).");
  const parsed = JSON.parse(raw) as ServiceAccount;
  parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  return parsed;
}

let cachedToken: { value: string; expires: number } | null = null;

async function accessToken() {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const sa = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claim}`),
  );
  const jwt = `${header}.${claim}.${b64url(signature)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(`Firebase auth failed: ${json.error_description ?? res.status}`);
  }
  cachedToken = { value: json.access_token, expires: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

export type PushPayload = {
  title: string;
  body: string;
  image?: string | null;
  deep_link: string;
  action_label?: string | null;
  action_url?: string | null;
  kind: string;
  campaign_id?: string | null;
};

export type SendResult = { token: string; success: boolean; error?: string; invalid?: boolean };

/** Sends one data-only message per token. Data-only lets the SW render actions. */
export async function sendToTokens(tokens: string[], payload: PushPayload): Promise<SendResult[]> {
  if (tokens.length === 0) return [];
  const sa = serviceAccount();
  const bearer = await accessToken();
  const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  const data: Record<string, string> = {
    title: payload.title,
    body: payload.body,
    deep_link: payload.deep_link,
    kind: payload.kind,
  };
  if (payload.image) data['image'] = payload.image;
  if (payload.action_label) data['action_label'] = payload.action_label;
  if (payload.action_url) data['action_url'] = payload.action_url;
  if (payload.campaign_id) data['campaign_id'] = payload.campaign_id;

  const results: SendResult[] = [];
  const CONCURRENCY = 12;
  for (let i = 0; i < tokens.length; i += CONCURRENCY) {
    const slice = tokens.slice(i, i + CONCURRENCY);
    const batch = await Promise.all(
      slice.map(async (token): Promise<SendResult> => {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { authorization: `Bearer ${bearer}`, "content-type": "application/json" },
            body: JSON.stringify({
              message: {
                token,
                data,
                webpush: {
                  headers: { Urgency: "high", TTL: "86400" },
                  fcm_options: { link: payload.deep_link },
                },
              },
            }),
          });
          if (res.ok) return { token, success: true };
          const err = (await res.json().catch(() => ({}))) as { error?: { status?: string; message?: string } };
          const status = err.error?.status ?? String(res.status);
          const invalid =
            res.status === 404 ||
            status === "NOT_FOUND" ||
            status === "UNREGISTERED" ||
            status === "INVALID_ARGUMENT";
          return { token, success: false, error: err.error?.message ?? status, invalid };
        } catch (e) {
          return { token, success: false, error: e instanceof Error ? e.message : "send failed" };
        }
      }),
    );
    results.push(...batch);
  }
  return results;
}