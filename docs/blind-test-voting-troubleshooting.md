# Blind Test: Unable to Vote — Troubleshooting

## Why Vote Buttons Are Disabled

The **Vote A** and **Vote B** buttons require:

1. **Both audio clips loaded** — Each card must show a **Play** button (not "Loading...")
2. **Listen time ≥ 3 seconds each** — You must **play** both clips for at least 3 seconds each
3. **Not currently voting** — No vote in progress

---

## "A Loading..." Stuck

If the audio card stays on "Loading...", the browser cannot load the audio. Common causes:

### 1. R2 CORS Not Configured

The R2 bucket must allow your app's origin to fetch audio. Presigned URLs are fetched directly by the browser, so CORS is required.

**Fix:** In Cloudflare Dashboard → R2 → your bucket → **Settings** → **CORS policy**:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3002",
      "https://your-app.vercel.app",
      "https://speecharena.org",
      "https://www.speecharena.org"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Add all origins where you run the app (localhost ports, Vercel preview/production, custom domain).

### 2. Audio Generation Failed

If `prepareNextRound` fails (e.g. no API keys, TTS provider error), the round may load with invalid URLs or no data. Check:

- **Browser DevTools → Network tab:** Do the audio requests return 200?
- **Server logs:** Any errors when loading the blind test page?
- **Admin:** Are providers active? Do models have API keys?

### 3. Presigned URL Expired

Presigned URLs expire after 1 hour. If you leave the page open for a long time, refresh to get new URLs.

---

## How to Vote (Correct Flow)

1. Wait for both cards to show **Play** (not "Loading...")
2. Click **Play** on card A → let it play for at least 3 seconds
3. Click **Play** on card B → let it play for at least 3 seconds
4. When both show "✓ Ready to vote", the Vote A / Vote B buttons enable
5. Click **Vote A** or **Vote B**

---

## Quick Checks

| Check | How |
|-------|-----|
| Browser console errors | F12 → Console — look for CORS, 403, or network errors |
| Audio request status | F12 → Network → filter by "mp3" or your R2 domain — status 200? |
| R2 CORS | Cloudflare R2 → bucket → Settings → CORS policy |
| Skip Round | If audio fails, use **Skip Round** to try another pair |
