## The problem

Google Sign-In works on the Lovable-hosted URL but fails on your Vercel-hosted `https://www.sidequestank.fun/`. The button uses `redirectTo: window.location.origin`, so on the custom domain the redirect target becomes `https://www.sidequestank.fun`. Supabase Auth rejects any redirect URL that isn't in its allow-list, and Google will only return to the exact Authorized redirect URI configured in the Google Cloud OAuth client. Either side can cause the "404 / doesn't come back / provider error" symptom.

## What needs to change

This is a **configuration fix**, not a code change. Nothing in the app needs to be edited.

### 1. Supabase Auth URL Configuration
In **Backend → Users → Authentication Settings → URL Configuration**:
- **Site URL:** `https://www.sidequestank.fun`
- **Additional Redirect URLs** (add all so previews + apex + Lovable URL keep working):
  - `https://www.sidequestank.fun/**`
  - `https://sidequestank.fun/**`
  - `https://sidequestank.lovable.app/**`
  - `http://localhost:8080/**` (optional, for local dev)

### 2. Google Cloud OAuth Client
In the Google Cloud Console OAuth 2.0 Client that Supabase uses:
- **Authorized JavaScript origins:** add `https://www.sidequestank.fun` and `https://sidequestank.fun`
- **Authorized redirect URIs:** must contain the Supabase callback shown in Backend → Auth → Providers → Google (looks like `https://<project-ref>.supabase.co/auth/v1/callback`). If Supabase is using its own managed Google credentials you can skip this step — but if you provided your own client ID/secret, this is required.

### 3. Vercel custom domain
Confirm both `www.sidequestank.fun` and `sidequestank.fun` resolve to the Vercel deployment and one redirects to the other consistently (usually apex → www). If a user starts on the apex and Supabase only knows www, the callback lands off-allow-list.

### 4. Verify
After saving: open `https://www.sidequestank.fun/auth` in an incognito window, click Continue with Google, and confirm it returns to `/home`. If it fails, check browser devtools Network for the exact error from `/auth/v1/authorize` or the Google consent page — that pinpoints which of the three above is still misaligned.

## What I need from you to proceed

Since these changes live in dashboards I can't touch, tell me:
1. Are you using **Supabase-managed Google credentials** or your **own Google OAuth client**? (Backend → Auth → Providers → Google shows this.)
2. What's the exact error you see on `www.sidequestank.fun` — a Google error page, a Supabase error, or a silent redirect back to `/auth`?

Once configured, no code changes are required. If you'd rather I also add a small hardening tweak (explicit `redirectTo` to a dedicated `/auth/callback` route so the redirect target is stable regardless of where the user started), say the word and I'll include that as a follow-up.
