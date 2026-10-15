# Demo Build — Sprint 2

A repeatable sequence for demonstrating the working input → AI → response flow.
Rehearse it once before the demo; it takes about five minutes cold.

## Before the demo

```bash
git checkout main && git pull
pnpm install
pnpm --filter backend build
ollama pull hermes3:3b
```

`ollama pull` downloads about 2 GB and is only needed once.

**Set Ollama's context length to 4K or 8K** (Ollama app → Settings → Context
length). At the maximum, replies take 20-40 seconds and Ollama can crash
mid-demo; at 8K they take 3-8 seconds. Our whole prompt is about 2,000 tokens.

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

1. **The main flow.** Type *"Ben isn't eating his dinner and I don't know why"*
   and send. The typing indicator appears, and a real reply lands in about
   4 seconds — things to try as tappable links, and a follow-up question.
2. **Session context.** Ask a follow-up like *"What should I try next?"*. The last
   four turns travel with the request, so the answer refers back to the first one.
3. **The context panel.** Tap the hamburger. It shows Ben's info for today,
   grouped under Sleep, Food, Observations and Events. On a narrow window it
   slides over the conversation; past 1024px it's a side column the same height
   as the chat. Long conversations scroll inside the chat box rather than
   stretching the page.
4. **Safeguards.** Each of these is answered by a rule before the model runs:
   - *"Ben's lips are swelling after he ate peanuts"* — emergency notice and
     "seek urgent help"
   - *"Does Ben have ADHD?"* — a notice that it can't diagnose
   - *"Can you create a meal plan for Ben?"* — asks about allergies and
     dietary restrictions instead of writing a diet
   - *"Ben ate pasta today"* — asks what you'd like help with, rather than
     inventing a problem
5. **Error and retry.** Stop terminal 2 (`Ctrl-C`), send a message — you get
   *"Couldn't reach the assistant…"* and a **Retry** button. Restart terminal 2,
   wait for the startup line, then press Retry. The answer arrives and the prompt
   is **not** repeated in the conversation.
6. **Feedback.** Rate a reply; the widget acknowledges it.

## If something goes wrong

| What you see | Fix |
|---|---|
| *"Couldn't reach the assistant"* on every message | Terminal 2 isn't running, or crashed |
| Replies take 20+ seconds, or Ollama quits | Ollama's context length is too high — set it to 4K or 8K |
| *"The assistant took too long to respond"* | Same as above; the app gives up after 90 seconds |
| *"The assistant's reply couldn't be read"* | The model returned malformed output — press Retry |

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

Current as of Sprint 3 Week 2. See
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
- **Replies have no explanation line.** The design opens each reply with a short
  "why", but the adapter replaces the model's explanation with a profile summary,
  which the app then hides. Fix is on the adapter side
  (`possibleContext` in `hermesClient.ts`).
- **The model sometimes ignores context it was given.** For example, it may ask
  what Ben had for breakfast after being told he skipped it.
- **Safeguards are keyword rules.** They catch the common phrasings tested
  above but can miss unusual wording.
- **Context is filtered by keyword.** Only the panel fields related to the
  message are sent — eating questions include breakfast, "tired" includes sleep,
  and so on.

## Not done yet

There's no `pnpm run demo` shortcut — that would need a script entry in the root
`package.json`, which is shared. Worth agreeing with the team if we keep demoing
this way.
