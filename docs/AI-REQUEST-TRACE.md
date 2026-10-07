# AI Request Trace — Sprint 3, Week 1

Why the BA's Sprint 2 scenarios still produced answers that didn't match
expected behaviour, even though user input was reaching the AI. One request was
followed end to end, from what the carer types to what comes back on screen.

**Short answer: both.** The application was dropping context, and the adapter
changes what the carer sees. Separately, a local Ollama setting was making
replies slow enough to time out.

## The path

```
ChatPanel.tsx          what the carer types + the child's context
  └─ requestSupport()  Server Action — validates, POSTs to the adapter
       └─ POST /api/hermes          backend/src/routes/hermes.ts
            └─ askHermes()          backend/src/lib/hermesClient.ts
                 └─ Ollama / hermes3:3b   with HERMES_SYSTEM_PROMPT
```

The request was captured on the wire by a logging proxy between the app and the
adapter, so the format below is what the application actually sends — not what
the types say it should.

## Confirmed request format

```json
{
  "childName": "Ben",
  "age": 8,
  "category": "general-support",
  "currentSituation": "Ben isn't eating his dinner and I don't know why",
  "recentContext": "Sleep: 6.5 hours. Breakfast: Skipped. Mood: Stressed. School: 9:00-3:00. Appointment: 4:30.",
  "knownTriggers": ["Loud environments", "Unexpected changes to routine"],
  "previousStrategies": ["Noise-cancelling headphones", "Visual schedule on the fridge"],
  "sessionContext": []
}
```

| Field | Source | Notes |
|---|---|---|
| `childName`, `age` | `mockChild` | Hard-coded until profiles are stored |
| `category` | `CATEGORY` constant | Placeholder — waiting on the BA's taxonomy |
| `currentSituation` | What the carer typed | Also sent to the model as the user message |
| `recentContext` | `describeChildContext(snapshot)` | **Fixed this week** — see below. Omitted entirely if nothing is logged |
| `knownTriggers`, `previousStrategies` | `mockChild` | Reached the model correctly before and after |
| `sessionContext` | Last 4 turns | Excludes the current prompt; empty on the first message |

The adapter's Zod schema (`routes/hermes.ts`) and the app's
(`requestSupport.ts`) accept the same fields with the same constraints.

## What was wrong

### Fixed in the application

**1. The context the carer sees was never sent.** The info panel shows sleep,
breakfast, mood, school and appointment, but `ChatPanel` never set
`recentContext`, so the model received `RECENT CONTEXT: Not provided` on every
request. Run against the live model six times each:

| Payload | Replies that used the panel's context |
|---|---|
| Before (no `recentContext`) | 0 of 6 |
| After | 6 of 6 |

The panel and the request now both read from `childContextEntries()`
(`features/children/context.ts`), so they can't drift apart again. Unlogged
fields are left out rather than sent as "Not logged", because the prompt treats
supplied context as fact.

**2. Valid "I need more detail" replies were shown as a connection error.** When
context is thin, Hermes deliberately returns `suggestedActions: []` and asks a
follow-up question instead of guessing. The app required at least one action,
rejected those replies, and told the carer *"Couldn't reach the assistant. Check
that the local AI service is running."* Empty actions are now accepted (the
reply shows the context and the question), and a genuinely malformed reply gets
its own message rather than blaming the connection.

**3. Timeout raised from 30s to 60s.** Replies of 27-40s have been seen on
slower or mis-configured machines (see below and
`HERMES-PROTOTYPE-FINDINGS.md`), which the app was cutting off.

### Adapter side — for Dev 2

**4. `possibleContext` shows the raw request.** Since `79b9f57`,
`hermesClient.ts` replaces the model's `possibleContext` with
`buildContextSummary(request)` to stop the model distorting facts. The carer
now sees, at the top of every reply:

> Ben isn't eating his dinner and I don't know why Recent context: Sleep: 6.5
> hours. Breakfast: Skipped. … Their effectiveness is not assumed.

This happened on 4 of 4 scenarios run through the app. The intent is sound, but
the text is prompt material, not something to show a parent. Either keep the
model's explanation and validate it, or render a short human summary.

**5. Suggestions can still contradict the context.** With breakfast logged as
skipped, one reply suggested *"If Ben has eaten breakfast, try…"*. That's a
prompt or model issue rather than a mapping one — the context arrived intact.

**6. No context-window limit is set.** The adapter doesn't pass
`options.num_ctx`, so Ollama uses its own default. See the next section.

### Environment

**7. Ollama's context length was set to its maximum.** On the machine used for
this trace, the Ollama desktop app had `OLLAMA_CONTEXT_LENGTH=262144`. Our whole
prompt is about 1,200 tokens. With that setting, replies took 21-40s and Ollama
crashed partway through a run. With an 8K window, the same requests took 3-7s
with no failures.

If the BA's validation machine is slow, check this first: Ollama app →
Settings → Context length → 4K or 8K. Setting `num_ctx` in the adapter (issue 6)
would make it independent of each person's settings.

## Retest through the application

Four scenarios run through the real app in a browser, request captured on the
wire, after the fixes:

| Scenario | Time | `recentContext` sent | Reply shown | Raw request echoed |
|---|---|---|---|---|
| Not eating dinner | 4.0s | yes | yes | yes (issue 4) |
| Meltdown | 3.7s | yes | yes | yes |
| Upset after school | 3.7s | yes | yes | yes |
| School cancelled | 4.2s | yes | yes | yes |

**Not yet done:** running the BA's own Sprint 2 failed cases with Dev 2. They
weren't in the repo; the scenarios above are the team's standard set. Rerun
them on this branch once the BA shares the exact cases and expected behaviour.

## Still open

- Issues 4-6 above (adapter)
- `category` is still a placeholder
- The child profile and context are hard-coded (`features/children/mock.ts`)
- Chat history is not saved
