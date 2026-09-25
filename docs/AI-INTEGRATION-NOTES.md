# AI Integration Notes (Sprint 2, Week 2)

Status of the application → AI connection, written after replacing the mocked
response with Dev 2's local Hermes adapter.

**Scope:** one reference flow — the carer describes a situation on `/ai-chat`
and gets a structured recommendation back. Broader error handling and
refinement continue in Week 3.

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
| Round-trip time | **8.0s** (local 3B model; ~5s via direct `curl`) |
| Adapter stopped → failure message | "Couldn't reach the assistant. Check that the local AI service is running." + working **Try again** |

Unit coverage: 8 tests in `frontend/tests/unit/features/ai-chat/ChatPanel.test.tsx`
stub the Server Action and cover loading, success, failure, retry and safety notice.

## Remaining integration issues

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

## Category placeholder

`ChatPanel` sends `category: 'general-support'`. The real taxonomy is waiting on
the BA's behaviour contract — their card confirms Food & Eating Support as the
Week 1 scenario.
