# Running the AI Chat

The AI Chat screen talks to a **local** AI service running on your own machine.
It is not hosted anywhere, so the deployed site
(<https://frontend-bassman8ks-projects.vercel.app>) can't reach it — that page
shows *"Couldn't reach the assistant"* there.

If you haven't run the app at all before, start with
[RUNNING-THE-APP.md](./RUNNING-THE-APP.md) — you need that working first.

Pick whichever applies to you:

- **Just want to see the screen** (UX, PM, BA) → ask a developer to deploy with mock mode on; then it's a URL and nothing to install. Failing that, [Option A](#option-a--mock-replies-no-ollama) below.
- **Need real AI replies** (developers) → [Option B](#option-b--real-ai-replies). Needs Ollama.

---

## Option A — mock replies, no Ollama

Runs the app with canned responses. The screen, layout and all the states look
exactly the same; only the words come from a fixture instead of the model.

You still need the repo, Node 22+ and pnpm — this skips Ollama, not everything.

```bash
git pull
pnpm install
USE_MOCK_ASSISTANT=true pnpm run dev
```

Open <http://localhost:3000/ai-chat>, sign in, and type a situation. The reply
appears after a short delay.

> **The flag has to go on the command line.** Putting `USE_MOCK_ASSISTANT` in
> `.env` will not work — `scripts/sync-env.js` regenerates `frontend/.env.local`
> from a fixed list of keys on every run and this one isn't in it. See issue 4
> in [AI-INTEGRATION-NOTES.md](./AI-INTEGRATION-NOTES.md).

---

## Option B — real AI replies

### One-time setup

1. Install [Ollama](https://ollama.com/download).
2. Pull the model (about 2 GB):
   ```bash
   ollama pull hermes3:3b
   ```

### Every time — three terminals

**Terminal 1 — the model**
```bash
ollama serve
```

**Terminal 2 — the adapter** (DEV 2's service, port 8787)
```bash
pnpm --filter backend build
node backend/lib/scripts/hermesAdapterServer.js
```
You should see `Hermes local adapter running at http://localhost:8787`.

**Terminal 3 — the app**
```bash
pnpm run dev
```

Open <http://localhost:3000/ai-chat>, sign in, describe a situation.

**The first reply takes 5–8 seconds.** That's normal — it's a 3B model running
on your laptop, not a hosted API. The screen shows a loading state while it
thinks.

---

## Why the deployed site doesn't do this

The app calls the adapter at `http://localhost:8787/api/hermes`. On Vercel,
`localhost` is the server itself, where nothing is listening — so AI Chat shows
*"Couldn't reach the assistant. Check that the local AI service is running."*

Every other page on the deployed site works normally.

To make the deployed site show mock replies instead of that error, add
`USE_MOCK_ASSISTANT` = `true` in the Vercel project's environment variables and
redeploy. That's a shared deployment setting — agree it with the team first.

---

## If it doesn't work

| What you see | Likely cause |
|---|---|
| "Couldn't reach the assistant…" | Terminal 2 isn't running, or it crashed |
| "The assistant took too long to respond." | Model is still loading — wait and retry; first run after `ollama pull` is slowest |
| Adapter exits immediately | `ollama serve` isn't running in Terminal 1 |
| `Cannot find module …/hermesAdapterServer.js` | You skipped `pnpm --filter backend build` |
| Redirected to the login page | Sign in first; the AI Chat page requires an account |

Setup notes for the adapter itself are in
[HERMES-ADAPTER-INTEGRATION.md](./HERMES-ADAPTER-INTEGRATION.md) (incomplete —
see issue 2 in the integration notes).
