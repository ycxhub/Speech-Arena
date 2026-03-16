# Revert Route Restriction (March 16, 2025)

## What was changed

`src/middleware.ts` was updated to return 404 on all routes except `/pg`, `/admin`, `/auth`, and essential API routes (`/api/pg`, `/api/health`, `/api/cron`). The root `/` redirects to `/pg`.

## How to revert

### Option 1 — Ask the AI

Say: **"Run `scripts/revert-route-restriction.sh`"** (or simply "revert the route restriction").

### Option 2 — Run it yourself

```bash
bash scripts/revert-route-restriction.sh
```

It will print `SUCCESS: middleware.ts restored to pre-route-restriction state.` and you're done. Then redeploy.

## What the revert does

Both options overwrite `src/middleware.ts` with the saved backup at `scripts/middleware.ts.pre-route-restriction`. After reverting:

- All routes (`/blind-test`, `/leaderboard`, `/models/*`, `/listen-and-log/*`, etc.) will be accessible again
- `/` and auth redirects will point back to `/blind-test`

## Files involved

| File | Purpose |
|---|---|
| `scripts/middleware.ts.pre-route-restriction` | Exact copy of the original middleware |
| `scripts/revert-route-restriction.sh` | Shell script that restores it |
