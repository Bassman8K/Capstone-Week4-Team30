# AI Integration Notes (Sprint 2, Weeks 2-3)

Status of the application → AI connection, written after replacing the mocked
response with Dev 2's local Hermes adapter.

**Scope:** one reference flow — the carer describes a situation on `/ai-chat`
and gets a structured recommendation back. Broader error handling and
refinement continue in Week 3.

## Sprint 3, Week 1 — request trace

The request path was traced end to end against the BA's failing behaviour. The
app was not sending the info-panel context, and was showing valid "need more
detail" replies as a connection error; both are fixed. Adapter-side and
environment findings are listed for Dev 2. Full write-up and the confirmed
request format: [AI-REQUEST-TRACE.md](./AI-REQUEST-TRACE.md).

## Week 3 — stabilisation

Fixed against the "Stabilize the Application and Prepare the Demo Build" card:

- **Retry no longer duplicates the prompt.** It used to call the same `send()`
  path as a new message, which appended the carer's text a second time. Retry now
  re-asks without touching the transcript, and excludes the prompt from the
  session context it sends (it already travels in `currentSituation`).
- **The context panel overlays the chat on small screens.** It was dropping into
  the next grid row, which on a phone put it below the conversation. It now sits
  over the chat with a scrim below `lg`, and returns to a side column above it —
  matching Mei's "updated context sidebar" frame.
- **Loading is a typing indicator in the assistant's bubble**, per the "Loading
  state - Main Page" frame, instead of a line of grey text. The visible wait is
  a real 5-8 seconds, so the text stays available to screen readers.
- **The error control follows the "updated error state" frame** — red message
  under the prompt with a **Retry** pill.
- **Verified against Dev 2's session-context adapter** (`7c7c735`). The adapter
  accepts `sessionContext` and visibly uses it; replies reference earlier turns.

Regression cover: `ChatPanel.test.tsx` gained three tests. Two of them fail
against the old retry behaviour, so the bug can't come back silently. The
pre-existing retry test passed either way — it only asserted `currentSituation`,
which is how the duplication got through in the first place.

Demo steps: [DEMO-BUILD.md](./DEMO-BUILD.md).

## Running it

See [RUNNING-THE-AI-CHAT.md](./RUNNING-THE-AI-CHAT.md) — Option A for a
no-install look at the screen, Option B for real replies.

## How it connects

```
ChatPanel (client)
  └─ requestSupport()            Server Action, src/features/ai-chat/actions/
       └─ POST http://localhost:8787/api/hermes    Dev 2's Express adapter
            └─ Ollama → hermes3:3b
```

The call goes through a Server Action rather than straight from the browser, so
the adapter's address stays server-side and we don't depend on its CORS config.
Pointing at a deployed endpoint later is a change to `HERMES_ADAPTER_URL` only.

`USE_MOCK_ASSISTANT=true` falls back to the old mock for anyone working on the
frontend without Ollama installed.

## Verified end to end

Driven through a real browser against a live adapter and a live model:

| Check | Result |
| --- | --- |
| App reaches the adapter | Yes — structured reply returned |
| Reply renders in the interface | Yes — context, actions, follow-up question |
| Loading state | "Thinking… this can take a few seconds." |
| Round-trip time | **4.8s** in Week 3 (8.0s in Week 2; local 3B model) |
| Retry after failure | Reply arrives, prompt appears exactly once |
| Context panel at 390px | Overlays the chat (`position: absolute`), scrim present |
| Context panel at 1280px | Side column (`position: static`) |
| Adapter stopped → failure message | "Couldn't reach the assistant. Check that the local AI service is running." + working **Try again** |

Unit coverage: 8 tests in `frontend/tests/unit/features/ai-chat/ChatPanel.test.tsx`
stub the Server Action and cover loading, success, failure, retry and safety notice.

## Remaining integration issues

Items 2, 3 and 4 below are unchanged since Week 2 — all three sit in files owned
by Dev 2 or shared by the team, so they still need a decision rather than a
patch.

### 1. `safetyNotice` was undocumented

`backend/src/lib/ollama.ts` returns a fourth field the frontend contract didn't
have:

```ts
safetyNotice?: string | null
```

Added to `SupportResponse` and rendered above the advice with `role="alert"`,
so a flagged situation isn't one bullet competing with meal tips. Worth
confirming with Dev 2 and the BA when this field is populated, since nothing
currently specifies the trigger conditions.

### 2. Setup docs stop mid-sentence

`docs/HERMES-ADAPTER-INTEGRATION.md` is truncated — it ends inside the code
block after `ollama serve` and never covers starting the adapter itself. **Dev 2's
file; not edited.** Needs the remaining steps added.

### 3. No command to start the adapter

`backend/package.json` has no script for `src/scripts/hermesAdapterServer.ts`,
and there's no `tsx`/`ts-node` runner, so it has to be started manually:

```bash
pnpm --filter backend build
node backend/lib/scripts/hermesAdapterServer.js
```

A `"hermes": "..."` script in `backend/package.json` would save every developer
rediscovering this. **Dev 2's package; not changed.**

### 4. Ollama env vars never reach `backend/.env`

`OLLAMA_BASE_URL` and `OLLAMA_MODEL` exist in `.env.example` but are not in the
backend allowlist in `scripts/sync-env.js`, which writes a fixed set of keys.
They never land in `backend/.env`, so the adapter only works because the code
has matching defaults — changing the value in `.env` has no effect.

The same applies to `HERMES_ADAPTER_URL` on the frontend side: `sync-env.js`
only forwards `NEXT_PUBLIC_*` plus the service-account key to
`frontend/.env.local`, so a non-public key can't be configured there either.
`requestSupport.ts` defaults to `http://localhost:8787/api/hermes` for that
reason.

**Shared file — not modified.** Needs a call on whether the allowlist should
grow or whether these stay code defaults.

### 5. Long `suggestedActions` read awkwardly

**Still open at the end of Week 3.**

The design renders actions as inline links inside a sentence — "You can try
*turning it into a soup*". Hermes returns full imperative sentences instead, so
the live output reads:

> You can try **Try offering Ben the same meal he had for lunch to reduce
> sensory overload. If he ate lunch, it may be easier to serve the same meal.**
> or **Offer small portions…**.

Duplicated "try", and a doubled full stop. Either the prompt should ask for
short noun phrases, or the component should switch to a list for long actions.
Prompt-side is Dev 2's and the BA's call — raised, not changed.

### 6. Client auth tears down a cookie-only session

Not caused by this work, but it surfaced during testing: `AuthProvider`'s
`onAuthStateChanged` fires with `null` when the Firebase client SDK has no
restored user and calls `DELETE /api/auth/session`, removing a session cookie
that the server still considers valid. Only reachable in a fresh browser
profile, but it makes automated end-to-end testing awkward and could log out a
real user whose client SDK is slow to restore.

### 7. Dev 2's commit reformatted the frontend files

`7c7c735` reformatted `ChatPanel.tsx`, `requestSupport.ts` and the test file to a
narrower print width, dropped two explanatory comments, and left both source
files without a trailing newline. Nothing broke, but it means the repo has two
formatting styles in the same folder and `pnpm run format` produces churn.
Worth agreeing on one Prettier config rather than reformatting per-commit.

### 8. No Firestore persistence for the conversation

Refreshing the page clears the transcript. Out of scope for the raw MVP, but it
is the first thing a demo watcher asks about.

## Category placeholder

`ChatPanel` sends `category: 'general-support'`. The real taxonomy is waiting on
the BA's behaviour contract — their card confirms Food & Eating Support as the
Week 1 scenario.
