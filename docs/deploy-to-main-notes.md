# Deploy to Main Notes

Deployment history for the main branch, ordered from oldest to newest. Each push to main triggers a Vercel deployment.

**Complexity heuristic:** Low (< 50 lines) | Medium (50–200 lines & < 10 files) | High (> 200 lines, or 50–200 lines & ≥ 10 files)

---

## 1. Project foundation and tech stack setup (PRD 01) [High]

**Date & Time (IST):** 12 Feb 2026, 1:22 PM

**Deployment notes:**
- feat: project foundation and tech stack setup (PRD 01)

**3 files with largest changes:**
1. `package-lock.json`
2. `supabase/config.toml`
3. `tasks/prd-database-schema.md`

---

## 2. Migrate to Supabase publishable/secret key naming [High]

**Date & Time (IST):** 12 Feb 2026, 2:19 PM

**Deployment notes:**
- chore: migrate to Supabase publishable/secret key naming

**3 files with largest changes:**
1. `package-lock.json`
2. `.env.local.example`
3. `src/lib/supabase/client.ts`

---

## 3. Add /api/health route for Supabase + R2 connectivity check [Medium]

**Date & Time (IST):** 12 Feb 2026, 2:22 PM

**Deployment notes:**
- feat: add /api/health route for Supabase + R2 connectivity check

**3 files with largest changes:**
1. `src/app/api/health/route.ts`

---

## 4. Mark all project foundation tasks complete [Low]

**Date & Time (IST):** 12 Feb 2026, 2:30 PM

**Deployment notes:**
- docs: mark all project foundation tasks complete

**3 files with largest changes:**
1. `tasks/tasks-project-foundation.md`

---

## 5. Point R2_PUBLIC_URL to cdn.speecharena.org and add getPublicUrl helper [Low]

**Date & Time (IST):** 12 Feb 2026, 4:41 PM

**Deployment notes:**
- chore: point R2_PUBLIC_URL to cdn.speecharena.org and add getPublicUrl helper

**3 files with largest changes:**
1. `src/lib/r2/storage.ts`
2. `.env.local.example`

---

## 6. Design system with glass UI components, app shell, nav bar [High]

**Date & Time (IST):** 12 Feb 2026, 5:11 PM

**Deployment notes:**
- feat: add design system with glass UI components, app shell, nav bar

**3 files with largest changes:**
1. `src/components/ui/glass-button.tsx`
2. `src/components/ui/glass-table.tsx`
3. `docs/speecharena-domain-setup.md`

---

## 7. Update glass UI components for improved accessibility and responsiveness [Low]

**Date & Time (IST):** 12 Feb 2026, 5:16 PM

**Deployment notes:**
- fix: update glass UI components for improved accessibility and responsiveness

**3 files with largest changes:**
1. `eslint.config.mjs`

---

## 8. Database schema, Supabase migrations, ESLint FlatCompat fix [High]

**Date & Time (IST):** 12 Feb 2026, 6:12 PM

**Deployment notes:**
- feat: add database schema, Supabase migrations, and ESLint FlatCompat fix

**3 files with largest changes:**
1. `src/types/database.ts`
2. `supabase/migrations/20260212115120_initial_schema.sql`
3. `tasks/tasks-database-schema.md`

---

## 9. Auth RBAC — sign-in, sign-up, callback, forgot/reset password, admin user role [High]

**Date & Time (IST):** 12 Feb 2026, 9:17 PM

**Deployment notes:**
- feat: add auth RBAC - sign-in, sign-up, callback, forgot/reset password, admin user role

**3 files with largest changes:**
1. `src/app/auth/sign-up/page.tsx`
2. `src/app/auth/sign-in/page.tsx`
3. `src/middleware.ts`

---

## 10. Audio generation pipeline, admin providers/models/keys, languages, sentences, TTS registry, cron pre-generate [High]

**Date & Time (IST):** 13 Feb 2026, 1:52 PM

**Deployment notes:**
- feat: add audio generation pipeline, admin providers/models/keys, languages, sentences, TTS registry, cron pre-generate

**3 files with largest changes:**
1. `src/app/admin/sentences/actions.ts`
2. `src/app/admin/providers/[providerId]/models/actions.ts`
3. `src/app/admin/sentences/csv-upload-modal.tsx`

---

## 11. Blind test UI, matchmaking engine RPC functions, audio card component [High]

**Date & Time (IST):** 13 Feb 2026, 2:42 PM

**Deployment notes:**
- feat: add blind test UI, matchmaking engine RPC functions, audio card component

**3 files with largest changes:**
1. `src/app/blind-test/blind-test-client.tsx`
2. `src/lib/matchmaking/engine.ts`
3. `src/components/blind-test/audio-card.tsx`

---

## 12. ELO rating system, calculator with tests, process_vote RPC, elo-verify cron, icon [High]

**Date & Time (IST):** 13 Feb 2026, 3:26 PM

**Deployment notes:**
- feat: add ELO rating system, calculator with tests, process_vote RPC, elo-verify cron, icon

**3 files with largest changes:**
1. `package-lock.json`
2. `src/app/api/cron/elo-verify/route.ts`
3. `src/lib/elo/calculator.test.ts`

---

## 13. Add process_vote to database types [Low]

**Date & Time (IST):** 13 Feb 2026, 3:27 PM

**Deployment notes:**
- fix: add process_vote to database types

**3 files with largest changes:**
1. `src/types/database.ts`

---

## 14. My-results, leaderboard, admin analytics/audit-log/logs, abuse-check cron, logger [High]

**Date & Time (IST):** 13 Feb 2026, 4:01 PM

**Deployment notes:**
- feat: add my-results, leaderboard, admin analytics/audit-log/logs, abuse-check cron, logger

**3 files with largest changes:**
1. `src/app/my-results/actions.ts`
2. `src/app/my-results/my-results-client.tsx`
3. `src/app/admin/logs/page-client.tsx`

---

## 15. Auth page updates, layout, nav-bar, middleware, seed admin user migration [Medium]

**Date & Time (IST):** 13 Feb 2026, 4:38 PM

**Deployment notes:**
- chore: auth page updates, layout, nav-bar, middleware, seed admin user migration

**3 files with largest changes:**
1. `src/app/page.tsx`
2. `src/middleware.ts`
3. `supabase/migrations/20260213104903_seed_admin_user.sql`

---

## 16. New changes [Low]

**Date & Time (IST):** 13 Feb 2026, 5:39 PM

**Deployment notes:**
- new changes

**3 files with largest changes:**
1. `src/middleware.ts`
2. `src/components/layout/nav-bar-with-session.tsx`

---

## 17. Update UI components for better user experience and performance [Medium]

**Date & Time (IST):** 13 Feb 2026, 6:13 PM

**Deployment notes:**
- chore: update UI components for better user experience and performance

**3 files with largest changes:**
1. `src/middleware.ts`
2. `src/app/auth/callback/route.ts`
3. `src/components/layout/nav-bar-with-session.tsx`

---

## 18. Resolve auth session persistence and admin access issues [Medium]

**Date & Time (IST):** 14 Feb 2026, 7:12 PM

**Deployment notes:**
- fix: resolve auth session persistence and admin access issues

**3 files with largest changes:**
1. `src/app/auth/sign-out/route.ts`
2. `src/app/auth/sign-up/page.tsx`
3. `src/middleware.ts`

---

## 19. Add sign-out route, auth-source-contracts, middleware tests [High]

**Date & Time (IST):** 14 Feb 2026, 7:24 PM

**Deployment notes:**
- test: add sign-out route, auth-source-contracts, middleware tests

**3 files with largest changes:**
1. `src/middleware.test.ts`
2. `src/auth-source-contracts.test.ts`
3. `src/app/auth/sign-out/route.test.ts`

---

## 20. Replace require() with dynamic import in tests for ESLint [Low]

**Date & Time (IST):** 14 Feb 2026, 7:24 PM

**Deployment notes:**
- fix: replace require() with dynamic import in tests for ESLint

**3 files with largest changes:**
1. `src/middleware.test.ts`
2. `src/app/auth/sign-out/route.test.ts`

---

## 21. Add URL-visible diagnostics for admin redirect [Low]

**Date & Time (IST):** 14 Feb 2026, 7:58 PM

**Deployment notes:**
- debug: add URL-visible diagnostics for admin redirect

**3 files with largest changes:**
1. `src/app/admin/page.tsx`
2. `src/middleware.ts`

---

## 22. Use service-role client for all admin profiles queries [Medium]

**Date & Time (IST):** 14 Feb 2026, 8:12 PM

**Deployment notes:**
- fix: use service-role client for all admin profiles queries

**3 files with largest changes:**
1. `src/middleware.ts`
2. `src/app/admin/page.tsx`
3. `src/app/admin/logs/actions.ts`

---

## 23. Remove duplicate admin variable declaration in audit-log page [Low]

**Date & Time (IST):** 14 Feb 2026, 8:21 PM

**Deployment notes:**
- fix: remove duplicate admin variable declaration in audit-log page

**3 files with largest changes:**
1. `src/app/admin/audit-log/page.tsx`

---

## 24. Add try-catch and error boundary to admin page for error visibility [Medium]

**Date & Time (IST):** 14 Feb 2026, 8:35 PM

**Deployment notes:**
- debug: add try-catch and error boundary to admin page for error visibility

**3 files with largest changes:**
1. `src/app/admin/error.tsx`
2. `src/app/admin/page.tsx`

---

## 25. Remove fs import and add step tracker for admin page errors [Medium]

**Date & Time (IST):** 14 Feb 2026, 8:40 PM

**Deployment notes:**
- debug: remove fs import and add step tracker for admin page errors

**3 files with largest changes:**
1. `src/app/admin/page.tsx`

---

## 26. Move role column render to client component (RSC serialization) [Medium]

**Date & Time (IST):** 14 Feb 2026, 8:52 PM

**Deployment notes:**
- fix: move role column render to client component (RSC serialization)

**3 files with largest changes:**
1. `src/app/admin/page.tsx`
2. `src/app/admin/admin-user-table.tsx`
3. `src/app/admin/user-role-select.tsx`

---

## 27. Use admin client for all DB ops in languages and providers actions [Medium]

**Date & Time (IST):** 14 Feb 2026, 9:21 PM

**Deployment notes:**
- fix: use admin client for all DB ops in languages and providers actions

**3 files with largest changes:**
1. `src/app/admin/providers/actions.ts`
2. `src/app/admin/languages/actions.ts`

---

## 28. Use admin client for languages and providers page data fetch [Low]

**Date & Time (IST):** 14 Feb 2026, 9:27 PM

**Deployment notes:**
- fix: use admin client for languages and providers page data fetch

**3 files with largest changes:**
1. `src/app/admin/providers/page.tsx`
2. `src/app/admin/languages/page.tsx`

---

## 29. Use admin client for sentences page data fetch [Low]

**Date & Time (IST):** 14 Feb 2026, 9:32 PM

**Deployment notes:**
- fix: use admin client for sentences page data fetch

**3 files with largest changes:**
1. `src/app/admin/sentences/page.tsx`

---

## 30. Use admin client for all admin Add/Update operations [High]

**Date & Time (IST):** 14 Feb 2026, 9:38 PM

**Deployment notes:**
- fix: use admin client for all admin Add/Update operations

**3 files with largest changes:**
1. `src/app/admin/providers/[providerId]/models/actions.ts`
2. `src/app/admin/sentences/actions.ts`
3. `src/app/admin/providers/[providerId]/keys/actions.ts`

---

## 31. Admin provider voices, languages, test tabs, user-management, admin layout and sidebar [High]

**Date & Time (IST):** 16 Feb 2026, 11:50 AM

**Deployment notes:**
- feat: admin provider voices, languages, test tabs, user-management, admin layout and sidebar

**3 files with largest changes:**
1. `src/app/admin/providers/[providerId]/models/add-model-modal.tsx`
2. `src/app/admin/providers/[providerId]/voices/actions.ts`
3. `src/app/admin/providers/[providerId]/test/page-client.tsx`

---

## 32. Murf, Deepgram, Cartesia, Inworld, Minimax TTS providers; model-level ELO, leaderboard, matchmaking; api-playground [High]

**Date & Time (IST):** 17 Feb 2026, 10:56 PM

**Deployment notes:**
- feat: add Murf, Deepgram, Cartesia, Inworld, Minimax TTS providers; model-level ELO, leaderboard, matchmaking; api-playground

**3 files with largest changes:**
1. `src/lib/tts/providers/murf.ts`
2. `src/app/admin/api-playground/page-client.tsx`
3. `supabase/migrations/20260217000001_process_vote_model_level.sql`

---

## 33. Add support for custom tests in navigation and results handling [High]

**Date & Time (IST):** 18 Feb 2026, 4:00 PM

**Deployment notes:**
- feat: add support for custom tests in navigation and results handling

**3 files with largest changes:**
1. `src/app/custom-test/actions.ts`
2. `tasks/tasks-custom-tests.md`
3. `src/app/my-results/actions.ts`

---

## 34. Add language_id and test_type fields to Database type [High]

**Date & Time (IST):** 18 Feb 2026, 4:00 PM

**Deployment notes:**
- feat: add language_id and test_type fields to Database type

**3 files with largest changes:**
1. `src/app/custom-test/custom-test-client.tsx`
2. `tasks/prd-custom-tests.md`
3. `src/types/database.ts`

---

## 35. Enhance custom test management with new fields and navigation updates [High]

**Date & Time (IST):** 18 Feb 2026, 4:00 PM

**Deployment notes:**
- feat: enhance custom test management with new fields and navigation updates

**3 files with largest changes:**
1. `.cursor/debug.log`
2. `src/app/admin/languages/add-language-modal.tsx`
3. `src/app/page.tsx`

---

## 36. Merge pull request #1: feature/custom-tests [High]

**Date & Time (IST):** 18 Feb 2026, 4:02 PM

**Deployment notes:**
- Merge pull request #1 from ycxhub/feature/custom-tests

**3 files with largest changes:**
1. `src/app/custom-test/custom-test-client.tsx`
2. `tasks/prd-custom-tests.md`
3. `src/app/custom-test/actions.ts`

---

## 37. Provider model definitions, autogenerate, voices import, footer logo, assets [High]

**Date & Time (IST):** 19 Feb 2026, 6:53 PM

**Deployment notes:**
- Provider model definitions, autogenerate, voices import, footer logo, assets

**3 files with largest changes:**
1. `src/app/admin/providers/[providerId]/models/page-client.tsx`
2. `src/app/admin/providers/[providerId]/autogenerate/actions.ts`
3. `src/app/admin/providers/[providerId]/voices/import-csv-modal.tsx`

---

## 38. Merge feature/custom-tests: provider model definitions, autogenerate, voices import [High]

**Date & Time (IST):** 19 Feb 2026, 6:53 PM

**Deployment notes:**
- Merge feature/custom-tests: provider model definitions, autogenerate, voices import

**3 files with largest changes:**
1. `src/app/admin/providers/[providerId]/models/page-client.tsx`
2. `src/app/admin/providers/[providerId]/autogenerate/actions.ts`
3. `src/app/admin/providers/[providerId]/voices/import-csv-modal.tsx`

---

## 39. Voices actions and import-csv-modal updates, remove debug.log [Medium]

**Date & Time (IST):** 19 Feb 2026, 7:10 PM

**Deployment notes:**
- Voices actions and import-csv-modal updates, remove debug.log

**3 files with largest changes:**
1. `.cursor/debug.log`
2. `src/app/admin/providers/[providerId]/voices/actions.ts`
3. `src/app/admin/providers/[providerId]/voices/import-csv-modal.tsx`

---

## 40. Model+voice selection on Test API page; cascade deletes for model removal [Medium]

**Date & Time (IST):** 19 Feb 2026, 7:32 PM

**Deployment notes:**
- Feature enhancements: model+voice selection on Test API page; cascade deletes for model removal

**3 files with largest changes:**
1. `src/app/admin/providers/[providerId]/test/page-client.tsx`
2. `src/app/admin/providers/[providerId]/test/page.tsx`
3. `supabase/migrations/20260218140001_test_events_cascade_on_model_delete.sql`

---

## 41. Test API page filters voices by model language support [Medium]

**Date & Time (IST):** 19 Feb 2026, 7:46 PM

**Deployment notes:**
- Feature enhancement: Test API page filters voices by model language support

**3 files with largest changes:**
1. `src/app/admin/providers/[providerId]/test/page-client.tsx`
2. `src/app/admin/providers/[providerId]/test/page.tsx`

---

## 42. Bug fix: Cartesia TTS language code handling [Low]

**Date & Time (IST):** 19 Feb 2026, 8:08 PM

**Deployment notes:**
- Bug fix: Cartesia TTS language code handling

**3 files with largest changes:**
1. `src/lib/tts/providers/cartesia.ts`

---

## 43. ELO/matchmaking/leaderboard by definition_name; Admin UI refresh [High]

**Date & Time (IST):** 19 Feb 2026, 9:55 PM

**Deployment notes:**
- Feature enhancements: ELO/matchmaking/leaderboard by definition_name; Admin UI refresh

**3 files with largest changes:**
1. `tasks/prd-seo-content-cluster.md`
2. `supabase/migrations/20260219000001_process_vote_definition_name.sql`
3. `src/app/admin/providers/page-client.tsx`

---

## 44. Autogenerate per (model, voice, language); canonical model_id [Medium]

**Date & Time (IST):** 19 Feb 2026, 10:41 PM

**Deployment notes:**
- Feature enhancements: autogenerate per (model, voice, language); canonical model_id

**3 files with largest changes:**
1. `src/app/admin/providers/[providerId]/autogenerate/actions.ts`
2. `src/app/admin/providers/[providerId]/voices/actions.ts`
3. `src/app/admin/providers/[providerId]/autogenerate/page-client.tsx`

---

## 45. Hume AI and Sarvam TTS providers; en sentence mapping [High]

**Date & Time (IST):** 20 Feb 2026, 12:26 AM

**Deployment notes:**
- New features: Hume AI and Sarvam TTS providers; en sentence mapping

**3 files with largest changes:**
1. `src/lib/tts/providers/hume.ts`
2. `src/lib/tts/providers/sarvam.ts`
3. `src/app/my-results/actions.ts`

---

## 46. Admin analytics client, audit-log filters, leaderboard split, UX polish [High]

**Date & Time (IST):** 20 Feb 2026, 1:17 AM

**Deployment notes:**
- Feature enhancements: Admin analytics client, audit-log filters, leaderboard split, UX polish

**3 files with largest changes:**
1. `src/app/admin/analytics/page.tsx`
2. `src/app/admin/logs/page-client.tsx`
3. `src/app/my-results/my-results-client.tsx`

---

## 47. Bug fix: Merge duplicate ELO entries from case-sensitive definition_name [Medium]

**Date & Time (IST):** 20 Feb 2026, 1:45 AM

**Deployment notes:**
- Bug fix: Merge duplicate ELO entries from case-sensitive definition_name

**3 files with largest changes:**
1. `supabase/migrations/20260221000000_merge_duplicate_definition_names.sql`
2. `.cursor/commands/sqlcode.md`

---

## 48. My-results definition display name; Leaderboard rank simplification [Medium]

**Date & Time (IST):** 20 Feb 2026, 2:41 AM

**Deployment notes:**
- Feature enhancements: My-results use definition display name; Leaderboard rank simplification

**3 files with largest changes:**
1. `src/app/my-results/actions.ts`
2. `src/app/leaderboard/leaderboard-client.tsx`

---

## 49. Sentence labels, Leaderboard pairwise win rate matrix [High]

**Date & Time (IST):** 20 Feb 2026, 3:28 AM

**Deployment notes:**
- New features: Sentence labels, Leaderboard pairwise win rate matrix

**3 files with largest changes:**
1. `src/app/leaderboard/actions.ts`
2. `src/app/leaderboard/leaderboard-client.tsx`
3. `src/app/my-results/actions.ts`

---

## 50. Leaderboard pairwise matrix fallbacks and empty state [Low]

**Date & Time (IST):** 20 Feb 2026, 3:32 AM

**Deployment notes:**
- Feature enhancements: Leaderboard pairwise matrix fallbacks and empty state

**3 files with largest changes:**
1. `src/app/leaderboard/actions.ts`
2. `src/app/leaderboard/leaderboard-client.tsx`

---

## 51. Global footer, Admin user management improvements [Medium]

**Date & Time (IST):** 20 Feb 2026, 3:45 AM

**Deployment notes:**
- Feature enhancements: Global footer, Admin user management improvements

**3 files with largest changes:**
1. `src/app/admin/admin-user-table.tsx`
2. `src/components/layout/footer.tsx`
3. `src/app/admin/user-management/page.tsx`

---

## 52. Google Analytics, Methodology page; Home page refresh [High]

**Date & Time (IST):** 20 Feb 2026, 12:18 PM

**Deployment notes:**
- New features: Google Analytics, Methodology page; Home page refresh

**3 files with largest changes:**
1. `tasks/prd-google-analytics.md`
2. `src/app/methodology/page.tsx`
3. `src/app/page.tsx`

---

## 53. Bug fix: Update speech-arena-logo and favicon assets [Low]

**Date & Time (IST):** 20 Feb 2026, 1:04 PM

**Deployment notes:**
- Bug fix: Update speech-arena-logo and favicon assets

**3 files with largest changes:**
1. `public/speech-arena-logo.png`
2. `src/app/icon.png`

---

## 54. Listen & Log text annotation platform [High]

**Date & Time (IST):** 21 Feb 2026, 2:19 AM

**Deployment notes:**
- Listen & Log text annotation platform

**3 files with largest changes:**
1. `src/types/database.ts`
2. `tasks/lnl-architecture-and-user-journey.md`
3. `src/app/listen-and-log/tasks/[taskId]/actions.ts`

---

## 55. L&L invitation emails via Resend [High]

**Date & Time (IST):** 21 Feb 2026, 3:38 PM

**Deployment notes:**
- New features: L&L invitation emails via Resend

**3 files with largest changes:**
1. `src/app/listen-and-log/admin/users/actions.ts`
2. `package-lock.json`
3. `src/lib/lnl/send-invite-email.ts`

---

## 56. Create L&L tasks from blind tests; AI visitor proxy (Salespeak) [High]

**Date & Time (IST):** 21 Feb 2026, 5:46 PM

**Deployment notes:**
- New features: Create L&L tasks from blind tests; AI visitor proxy (Salespeak)
- Feature enhancements: New Task page with Create-from-blind-tests quick-start

**3 files with largest changes:**
1. `src/app/api/ai-proxy/route.ts`
2. `src/app/listen-and-log/admin/tasks/actions.ts`
3. `src/components/lnl/admin/create-from-blind-tests-form.tsx`

---

## 57. Add pull-from-main command and cursor settings [Medium]

**Date & Time (IST):** 21 Feb 2026, 5:51 PM

**Deployment notes:**
- Add pull-from-main command and cursor settings

**3 files with largest changes:**
1. `.cursor/commands/pull-from-main.md`
2. `.cursor/settings.json`

---

## 58. Fix: Support Murf AI provider for Create from Blind Tests [Low]

**Date & Time (IST):** 21 Feb 2026, 6:34 PM

**Deployment notes:**
- Fix: Support Murf AI provider (slug murf-ai) for Create from Blind Tests

**3 files with largest changes:**
1. `src/app/listen-and-log/admin/tasks/actions.ts`
2. `src/components/lnl/admin/create-from-blind-tests-form.tsx`

---

## 59. Fix: Match Murf AI provider by name for Create from Blind Tests [Low]

**Date & Time (IST):** 21 Feb 2026, 6:36 PM

**Deployment notes:**
- Fix: Match Murf AI provider by name (ilike %murf%) for Create from Blind Tests

**3 files with largest changes:**
1. `src/app/listen-and-log/admin/tasks/actions.ts`

---

## 60. Create from Blind Tests — custom labels & signed URLs fix [Medium]

**Date & Time (IST):** 22 Feb 2026, 2:21 PM

**Deployment notes:**
- Feature enhancements: Create from Blind Tests — custom labels and task options; task options docs
- Bug fix: Signed URLs for all non-http(s) audio keys (murf-ai, lnl, etc.)

**3 files with largest changes:**
1. `docs/task-options.md`
2. `src/components/lnl/admin/create-from-blind-tests-form.tsx`
3. `src/app/listen-and-log/admin/tasks/actions.ts`

---

## 61. Super admin role, duplicate task, R2 object check [High]

**Date & Time (IST):** 22 Feb 2026, 7:11 PM

**Deployment notes:**
- New features: Super admin role; duplicate task (super admin); R2 object check for Create from Blind Tests
- Feature enhancements: Task options tooltips; publish confirmation; View/Duplicate/Delete in tasks table; task detail shows boolean/scoring; export improvements
- Bug fix: Delete restricted to draft unless super admin; skip missing R2 audio when creating from blind tests

**3 files with largest changes:**
1. `src/components/lnl/admin/tasks-table.tsx`
2. `src/app/listen-and-log/admin/tasks/actions.ts`
3. `src/components/lnl/admin/task-options-form.tsx`

---

## 62. Inline editable task name & L&L admin enhancements [Medium]

**Date & Time (IST):** 22 Feb 2026, 7:39 PM

**Deployment notes:**
- New features: Inline editable task name (draft only)
- Feature enhancements: Lock dataset upload and user assignment when task is published; View links to admin task detail

**3 files with largest changes:**
1. `src/components/lnl/admin/task-name-editable.tsx`
2. `src/app/listen-and-log/admin/tasks/[taskId]/task-detail-client.tsx`
3. `src/components/lnl/admin/task-user-assignment.tsx`

---

## 63. Deploy command & deploy-to-main-notes doc [High]

**Date & Time (IST):** 22 Feb 2026, 7:58 PM

**Deployment notes:**
- Feature enhancements: Deploy command with post-deploy notes; deploy-to-main-notes doc

**3 files with largest changes:**
1. `docs/deploy-to-main-notes.md`
2. `.cursor/commands/deploy.md`

---

## 64. Deploy command — append at end; deploy-to-main-notes — order oldest to newest [High]

**Date & Time (IST):** 22 Feb 2026, 8:06 PM

**Deployment notes:**
- Feature enhancements: Deploy command — append deployment at end; deploy-to-main-notes — order oldest to newest

**3 files with largest changes:**
1. `docs/deploy-to-main-notes.md`
2. `.cursor/commands/deploy.md`

---

## 65. Annotation item loading skeleton; L&L UX improvements [Medium]

**Date & Time (IST):** 22 Feb 2026, 9:31 PM

**Deployment notes:**
- New features: Annotation item loading skeleton
- Feature enhancements: L&L sidebar icon (headphones+waveform); item nav prefetch; auto-save flushNow
- Bug fix: Flush auto-save before Mark Complete; parallel history+insert in saveAnnotation

**3 files with largest changes:**
1. `src/app/listen-and-log/tasks/[taskId]/actions.ts`
2. `src/app/listen-and-log/tasks/[taskId]/items/[itemIndex]/loading.tsx`
3. `src/components/lnl/layout/lnl-sidebar.tsx`

---

## 66. Draft task settings editor; L&L UI polish [High]

**Date & Time (IST):** 22 Feb 2026, 10:13 PM

**Deployment notes:**
- New features: Draft task settings editor (labels, boolean questions, scoring)
- Feature enhancements: L&L sidebar image icon; stacked header layout; compact Yes/No buttons

**3 files with largest changes:**
1. `src/app/listen-and-log/admin/tasks/[taskId]/draft-task-settings-editor.tsx`
2. `src/app/listen-and-log/admin/tasks/[taskId]/page.tsx`
3. `src/components/lnl/layout/lnl-header.tsx`

---

## 67. Revert L&L sidebar to inline SVG icon [Low]

**Date & Time (IST):** 22 Feb 2026, 10:19 PM

**Deployment notes:**
- Bug fix: Revert L&L sidebar to inline SVG icon (remove Image dependency)

**3 files with largest changes:**
1. `src/components/lnl/layout/lnl-sidebar.tsx`

---

## 68. Home & Methodology copy and CTAs; L&L sidebar icon [Low]

**Date & Time (IST):** 22 Feb 2026, 10:41 PM

**Deployment notes:**
- Feature enhancements: Home & Methodology copy and CTAs; L&L sidebar headphones icon

**3 files with largest changes:**
1. `src/app/page.tsx`
2. `src/app/methodology/page.tsx`
3. `src/components/lnl/layout/lnl-sidebar.tsx`

---

## 69. L&L on-the-fly TTS generation; create tasks from text; admin usage [High]

**Date & Time (IST):** 24 Feb 2026, 5:34 PM

**Deployment notes:**
- New features: L&L on-the-fly TTS generation; create tasks from text; admin usage page; @murf.ai redirect to L&L
- Feature enhancements: L&L sidebar; admin task list; TTS generation progress; transcript panel

**3 files with largest changes:**
1. `src/components/lnl/admin/create-on-the-fly-wizard.tsx`
2. `src/components/lnl/layout/lnl-sidebar.tsx`
3. `src/lib/lnl/tts-generate.ts`

---
