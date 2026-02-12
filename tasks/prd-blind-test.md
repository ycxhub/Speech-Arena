# PRD 09: Blind Test (Battle Royale) Experience

## Introduction / Overview

The Blind Test is TTS Arena's core feature — the reason users come to the site. Each round presents two anonymous audio clips (A and B) generated from the same sentence by two different TTS models. The user listens to both, then votes for the one they prefer. Votes feed into the ELO rating system to rank TTS models.

This PRD covers the complete user-facing Blind Test page: language selection, the audio player UI, listen-time enforcement, voting mechanics, data persistence, and the infinite-loop flow that immediately loads the next round after a vote.

## Goals

1. Deliver a polished, distraction-free A/B listening and voting experience.
2. Enforce a minimum 3-second listen time per clip before enabling the vote buttons.
3. Persist every round with full metadata (sentence, models, audio links, listen times, winner/loser).
4. Immediately load the next round after voting for a seamless infinite testing loop.
5. Keep the test blind — never reveal model or provider names during the test.

## User Stories

- **As a user**, I want to select a language before starting so I hear audio in a language I understand.
- **As a user**, I want to clearly see two audio players labeled "A" and "B" and play them in any order.
- **As a user**, I want to know how much more I need to listen before I can vote (visual progress).
- **As a user**, I want to tap "Vote A" or "Vote B" and immediately see the next pair without any loading screen.
- **As a user**, I want confidence that the test is truly blind — no hints about which model is playing.
- **As a user**, I want the experience to work smoothly even on a slow connection (graceful loading states).

## Functional Requirements

### Language Selection (Pre-Test)

1. **Language picker** at the top of the Blind Test page (`/blind-test`):
   - A GlassSelect dropdown listing all active languages (fetched from `languages` table).
   - Default: user's last-used language (stored in `localStorage`) or the first language in the list.
   - Changing the language immediately triggers a new round in that language.
   - The language picker remains visible during testing so the user can switch at any time.

### Audio Player UI

2. **Layout**: Two GlassCards side by side (on desktop) or stacked (on narrow screens), labeled "A" and "B" in large text.

3. **Each card contains**:
   - A large label: "A" or "B" (centered, bold, large text — e.g., `text-6xl font-bold text-white/20` as a watermark).
   - An audio player with:
     - Play/Pause button (large, centered, GlassButton style).
     - A progress bar showing playback position (slim horizontal bar).
     - Current time / total duration display (e.g., "0:03 / 0:07").
   - A listen-time progress indicator (see below).
   - NO metadata: no model name, no provider name, no tags, no waveform. Purely: label + audio controls.

4. **Audio element**: Use the native HTML `<audio>` element (hidden), controlled via React refs. The visible UI is custom-styled to match the glassmorphism design.

5. **Audio loading**: Show a subtle loading spinner or pulsing placeholder while the audio is loading (`canplay` event).

### Listen-Time Enforcement

6. **Minimum listen time**: 3 seconds per clip. The user must accumulate at least 3 seconds of play time on EACH clip before the vote buttons are enabled.

7. **Tracking mechanism**:
   - Use the `timeupdate` event on the `<audio>` element.
   - Maintain a `listenTimeA` and `listenTimeB` state variable (in milliseconds).
   - On each `timeupdate`, calculate the delta since the last update and add it to the accumulated time.
   - Handle edge cases: seeking backward should NOT reduce accumulated time (it's cumulative play time, not current position).
   - Pausing and resuming is fine — accumulated time persists.

8. **Visual progress indicator** per card:
   - A small circular or linear progress indicator showing how much of the 3-second minimum has been met.
   - Example: a ring that fills from 0% to 100% as listen time goes from 0 to 3 seconds.
   - Once the minimum is met, show a checkmark icon (accent green) replacing the progress indicator.
   - Text label below: "Listen for X more seconds" or "Ready to vote" with a checkmark.

9. **Vote button state**:
   - "Vote A" and "Vote B" buttons are positioned below the two audio cards (centered).
   - Initially disabled (grayed out, no pointer events) with tooltip: "Listen to both clips first".
   - Enabled (accent blue, interactive) only when BOTH `listenTimeA >= 3000ms` AND `listenTimeB >= 3000ms`.

### Voting

10. **Vote action**: Clicking "Vote A" or "Vote B":
    - Immediately disables both buttons (prevent double-vote).
    - Sends a Server Action / API call:
      ```
      POST /api/vote
      Body: {
        testEventId: string,
        winner: 'A' | 'B',
        listenTimeAMs: number,
        listenTimeBMs: number
      }
      ```
    - Server Action:
      1. Validates `testEventId` exists and `status = 'pending'`.
      2. Validates the `testEvent.user_id` matches the current user.
      3. Determines `winner_id` and `loser_id` from the `winner` field and the test event's `model_a_id` / `model_b_id`.
      4. Updates the `test_events` row: set `winner_id`, `loser_id`, `listen_time_a_ms`, `listen_time_b_ms`, `status = 'completed'`, `voted_at = now()`.
      5. Triggers the ELO rating update (PRD 10).
      6. Returns success.

11. **Post-vote feedback** (brief):
    - Show a subtle animation (e.g., a brief accent-colored flash on the winning card or a "Vote recorded" toast) for 500ms.
    - Then immediately load the next round (no full page reload — swap the audio and sentence in place).

### Infinite Loop

12. **Next round loading**: After the vote animation completes, call `prepareNextRound` (from PRD 08) to get the next sentence and audio pair. While loading:
    - Show a subtle loading state (pulsing audio cards, or a "Loading next round..." indicator).
    - Reset listen times to 0, disable vote buttons.
    - Once the new round data arrives, update the UI with the new sentence, new audio URLs, and reset all state.

13. **Sentence display**: The sentence text is shown above the two audio cards in a GlassCard:
    - Full sentence text, `text-lg`, centered.
    - This lets the user read along while listening, helping them judge pronunciation and naturalness.

14. **Round counter**: A small counter in the corner showing "Round X" (incrementing per session). Informational only.

### Data Persistence

15. Every round is persisted as a `test_events` row (created by the matchmaking engine, updated by the vote action). Fields stored:
    - `user_id`, `sentence_id`, `language_id`
    - `model_a_id`, `model_b_id`, `audio_a_id`, `audio_b_id`
    - `winner_id`, `loser_id`
    - `listen_time_a_ms`, `listen_time_b_ms`
    - `status` (pending → completed / invalid)
    - `created_at`, `voted_at`
    - `elo_before_winner`, `elo_before_loser`, `elo_after_winner`, `elo_after_loser` (set during ELO update)

16. **Audio links persistence**: The `audio_a_id` and `audio_b_id` reference the `audio_files` table, which stores the R2 key. Audio can be replayed from test history by generating a new signed URL from the stored key.

### Edge Cases

17. **Audio load failure**: If one audio clip fails to load (network error, R2 issue):
    - Show an error state on that card: "Audio failed to load".
    - Show a "Skip Round" button that marks the test event as `invalid` and loads the next round.
    - Log the error server-side.

18. **Network disconnection**: If the vote API call fails:
    - Show an error toast: "Failed to submit vote. Retrying..."
    - Retry the vote once. If it still fails, show: "Vote could not be submitted. Please check your connection."
    - Do NOT load the next round until the vote is confirmed.

19. **User navigates away mid-round**: The pending `test_events` row remains with `status = 'pending'`. It is cleaned up by a periodic job (or ignored in analytics). No user-facing impact.

20. **Concurrent tabs**: If the user opens two Blind Test tabs, each tab operates independently. Both will call `prepareNextRound` and create separate test events. This is acceptable.

## Non-Goals (Out of Scope)

- Revealing model/provider names after voting (this could be a future "reveal" feature but is not in MVP).
- Allowing users to skip a round without it counting (skips are marked as invalid, not ignored).
- Audio waveform visualization.
- Keyboard shortcuts for voting (can be added later).
- Mobile-optimized audio player (desktop is the priority; basic mobile support means it works but is not optimized).

## Design Considerations

- The Blind Test page should feel focused and immersive — minimal distractions, maximum attention on the audio.
- The two audio cards should be equal in size, symmetrically placed, with generous spacing.
- The sentence text should be prominent but not overwhelming — it supports the listening experience.
- Vote buttons should be large and satisfying to click (consider a subtle scale animation on hover).
- The listen-time progress indicator should be encouraging, not frustrating — show progress, not a countdown.
- Color coding: Card A could have a subtle blue accent, Card B a subtle purple accent (or similar distinct pastel colors), to help the user remember which is which.

## Technical Considerations

- The audio player is a client component (`"use client"`) since it manages playback state, event listeners, and user interactions.
- Audio sources are signed R2 URLs with limited expiry. If a user leaves the page and returns after the URL expires, the audio will not play. Since each round is short-lived, this is acceptable.
- The `timeupdate` event fires roughly every 250ms. This is sufficient for tracking listen time. Use `performance.now()` for precise delta calculation between events.
- The vote Server Action uses the Supabase service role client to update `test_events` (the user's RLS policy does not allow direct updates to test events — only the server can update after validation).
- Pre-fetching: After the user votes, immediately start `prepareNextRound` while showing the brief vote animation. This overlaps the loading time with the animation, making the transition feel instant.
- The round counter resets on page refresh (session-only state). This is fine — it's informational.

## Success Metrics

- 90% of started rounds result in a completed vote (low abandonment).
- Average time per round is 15-30 seconds (enough to listen thoughtfully but not so long that users get bored).
- Listen-time enforcement catches 100% of attempts to vote before listening (client-side enforcement).
- Server-side listen-time signals flag < 1% of votes as suspicious (most users listen honestly).
- The next round loads within 2 seconds of voting (perceived instant for cache hits).

## Open Questions

1. Should we show the sentence text BEFORE the user plays audio, or only after? Recommendation: show it immediately — it helps users judge pronunciation accuracy.
2. Should we allow users to replay audio after voting (before moving to the next round)? Recommendation: no — keep the flow fast. Users can review audio in their history (My Results).
3. Should the minimum listen time be configurable per language or globally? Recommendation: global 3 seconds for MVP.
4. Should we add a "Both are bad" or "Can't decide" option? Recommendation: no — forced binary choice simplifies the ELO algorithm and prevents indecisive voting from diluting data.
