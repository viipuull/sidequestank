## Goal
Wire the Firebase web config you sent into the push system so notifications can register tokens.

## What I'll do
1. Fill `src/lib/push/config.ts` with your real values: authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId, and the VAPID key.
2. Handle the API key: the browser can't read backend secrets, so the literal key must live in code (Firebase web API keys are publishable by design — they're restricted by Firebase security rules, not secrecy). I'll read it from `import.meta.env.VITE_FIREBASE_API_KEY` with a fallback to an inline constant, and leave a single clearly-marked spot for the `AIza...` value. Until that value is present, `pushConfigured` stays false and the push prompt simply doesn't appear (no crashes).
3. Type the config as `FirebaseOptions` and keep `swUrl()` passing the public config to the service worker (it already does).

## Note
Once you paste the `AIza...` key (Firebase console → Project settings → Your apps), push registration will go live immediately — nothing else needs changing. The private service-account JSON stays server-side in secrets.
