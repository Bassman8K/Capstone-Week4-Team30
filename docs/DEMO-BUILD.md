# Demo Build — Sprint 2

A repeatable sequence for demonstrating the working input → AI → response flow.
Rehearse it once before the demo; it takes about five minutes cold.

## Before the demo

```bash
git checkout main && git pull
pnpm install
pnpm --filter backend build
ollama pull hermes3:3b          # ~2 GB, only needed once
```

Verify the whole chain answers before you rely on it:

```bash
ollama serve &
node backend/lib/scripts/hermesAdapterServer.js &

curl -s -X POST http://localhost:8787/api/hermes \
  -H 'Content-Type: application/json' \
  -d '{"childName":"Ben","age":8,"category":"general-support",
       "currentSituation":"Ben is refusing dinner"}' | head -c 200
```

You should get JSON back with `possibleContext` within about 5 seconds. If the
first call is slow, that's the model loading into memory — run it twice so the
demo itself is warm.

## Running the demo — three terminals

| Terminal | Command | Expect |
|---|---|---|
| 1 | `ollama serve` | stays running, no output |
| 2 | `node backend/lib/scripts/hermesAdapterServer.js` | `Hermes local adapter running at http://localhost:8787` |
| 3 | `pnpm run dev` | `Ready in …` on http://localhost:3000 |

Then open <http://localhost:3000/ai-chat> and sign in.

> Run `pnpm --filter backend build` again if you've pulled backend changes since
> last time — terminal 2 runs compiled output from `backend/lib/`, not the
> TypeScript source.

## Suggested demo script

1. **The main flow.** Type *"Ben isn't eating his dinner"* and send. The typing
   indicator appears, and a real reply lands in about 5 seconds — context, things
   to try as tappable links, and a follow-up question.
2. **Session context.** Ask a follow-up like *"What should I try next?"*. The last
   four turns travel with the request, so the answer refers back to the first one.
3. **The context panel.** Tap the hamburger. On a narrow window it slides over the
   conversation; widen the window past 1024px and it becomes a side column.
4. **Error and retry.** Stop terminal 2 (`Ctrl-C`), send a message — you get
   *"Couldn't reach the assistant…"* and a **Retry** button. Restart terminal 2,
   wait for the startup line, then press Retry. The answer arrives and the prompt
   is **not** repeated in the conversation.
5. **Feedback.** Rate a reply; the widget acknowledges it.

## Fallback if the model won't cooperate

Mock mode runs the same screens with canned replies and no Ollama:

```bash
# macOS / Linux
USE_MOCK_ASSISTANT=true pnpm run dev
# Windows PowerShell
$env:USE_MOCK_ASSISTANT="true"; pnpm run dev
```

Everything except the wording of the answers behaves identically, so the demo
still shows loading, retry, feedback and the context panel.

## Known limitations to mention

These are deliberate for Sprint 2 rather than defects — see
[AI-INTEGRATION-NOTES.md](./AI-INTEGRATION-NOTES.md) for the full list.

- **The AI only runs locally.** The deployed site shows *"Couldn't reach the
  assistant"* on this page; every other page works there.
- **Conversation is not saved.** Refreshing clears it — there's no Firestore
  persistence yet.
- **The child is hard-coded.** "Ben" and his context come from a fixture, not a
  real profile.
- **One category.** Every request is sent as `general-support`; the real taxonomy
  is waiting on the BA's behaviour contract.
- **Answers vary between runs.** It's a 3B model with no fixed seed, so the same
  prompt gives different wording each time.
- **Long suggestions read awkwardly.** Hermes returns full sentences where the
  design expects short phrases.
- **The page is not themed to the designs yet.** Still the dusty-rose desktop
  shell rather than the navy mobile layout.

## Not done yet

There's no `pnpm run demo` shortcut — that would need a script entry in the root
`package.json`, which is shared. Worth agreeing with the team if we keep demoing
this way.
