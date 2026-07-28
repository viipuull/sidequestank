## Plan

1. **Confirm the failing redirect URL**
   - Reproduce the Google sign-in path on `https://www.sidequestank.fun/` and inspect the exact URL that becomes the Supabase 404.
   - Identify whether it is failing before Google, at the backend callback, or after returning to the app.

2. **Harden the app-side OAuth flow**
   - Add a public `/auth/callback` route for Supabase OAuth returns.
   - Update Google sign-in to redirect to the custom-domain-safe callback URL, then send the player to `/home` after the session is restored.
   - Preserve existing onboarding/profile redirects after the session loads.

3. **Fix Vercel routing for this TanStack app**
   - Replace the current static SPA rewrite if needed so Vercel does not incorrectly route every URL to `/index.html` in a way that breaks OAuth/callback handling.
   - Ensure `/auth`, `/auth/callback`, `/home`, and deep links can load directly on the custom domain.

4. **Dashboard configuration checklist for you**
   - I’ll give the exact URLs to add to your backend auth settings:
     - Site URL should use the canonical domain you want users to land on.
     - Redirect URLs must include the exact `https://www.sidequestank.fun/auth/callback` URL and, if you also use apex, the matching apex version.
   - If you use your own Google OAuth credentials, I’ll also list the exact Google Console authorized redirect URI.

5. **Verify**
   - Test sign-in from `https://www.sidequestank.fun/`.
   - Confirm the user returns to SideQuest, session is restored, and the app navigates to onboarding/profile/home instead of a Supabase 404.