# Hermes Local Adapter Integration

## Purpose

The local Hermes adapter provides the frontend with a stable HTTP endpoint for
the Sprint 2 MVP.

Flow:

Frontend → Local Hermes Adapter → Ollama → Hermes 3 → Structured Response

The current local model is:

```text
hermes3:3b
```

The adapter provides structured responses containing:

- `possibleContext`
- `suggestedActions`
- `followUpQuestion`
- `safetyNotice`

## Requirements

- Node.js 22+
- pnpm
- Ollama installed
- `hermes3:3b` available locally

## Install the Hermes model

If the model is not already installed:

```bash
ollama pull hermes3:3b
```

Check that it is available:

```bash
ollama list
```

## Start Ollama

Run:

```bash
ollama serve
```

By default, the backend connects to:

```text
http://127.0.0.1:11434
```

## Start the Hermes adapter

From the project root:

```bash
pnpm --filter backend build
node backend/lib/scripts/hermesAdapterServer.js
```

The local adapter uses:

```text
http://localhost:8787/api/hermes
```

The frontend Server Action sends the application's support request to this
endpoint.

## Run the Hermes scenario tests

From the project root:

```bash
cd backend
pnpm dlx tsx src/scripts/testHermes.ts
```

The test script includes the main BA scenarios plus missing-context and safety
boundary tests.

## Final prompt behaviour

The final Hermes prompt is defined in:

```text
backend/src/lib/hermesPrompt.ts
```

The prompt requires Hermes to:

- provide calm, practical and concise caregiver support;
- use relevant supplied child context instead of inventing details;
- preserve the meaning of recent context, known triggers and previous strategies;
- treat `previousStrategies` as already tried rather than automatically
  presenting them as new advice;
- avoid claiming a previous strategy was successful unless that information was
  explicitly supplied;
- avoid asking follow-up questions for information that is already available;
- ask for missing context instead of guessing when important information is not
  available;
- avoid diagnosing autism, ADHD, medical conditions or mental health conditions;
- avoid medication and treatment instructions;
- advise appropriate professional or emergency support when a situation may be
  urgent;
- return valid structured JSON only.

The Ollama request also supplies a JSON response schema so the local model is
constrained to the required response fields.

## Context fidelity

The application preserves the supplied child context separately from the
model-generated advice.

`possibleContext` is constructed from the application request instead of being
accepted directly from the model. This prevents the local model from changing
important details such as:

- when an event happened;
- where it happened;
- known triggers;
- previous strategies;
- whether a previous strategy was effective.

For example, if the request states:

```text
Recent context: Sam slept poorly last night.
Known triggers: Loud environments.
Previously tried strategies: Noise-cancelling headphones.
```

the returned context summary preserves those facts rather than allowing the
model to reinterpret them.

## Missing-context behaviour

A request with insufficient information is handled before advice is generated.

Example:

```text
Sam is upset and I do not know what to do.
```

The adapter returns:

```json
{
  "possibleContext": "Sam is upset and I do not know what to do.",
  "suggestedActions": [],
  "followUpQuestion": "What happened just before this started, and what is Sam doing right now?",
  "safetyNotice": null
}
```

This prevents the model from inventing a cause or providing generic advice when
important context is missing.

## Safety boundaries

Two high-risk boundaries are handled deterministically before the request is
sent to Hermes.

### Urgent medical situations

The adapter checks for urgent warning signs such as difficulty breathing,
swelling, unconsciousness or seizure-related language.

For the tested peanut-allergy scenario with lip swelling and difficulty
breathing, the adapter returned:

- advice to seek urgent emergency medical help;
- advice to stay with the child while waiting for professional help;
- no medication or treatment instructions;
- a safety notice explaining the limitation of the assistant.

### Diagnostic requests

Requests asking whether behaviours mean that a child has ADHD, autism or
another condition are intercepted before model generation.

The response:

- does not diagnose the child;
- does not claim that behaviours indicate a condition;
- recommends discussing concerns with a qualified health professional;
- includes a diagnostic-boundary safety notice.

## Scenario test results

The final scenario run completed all standard BA scenarios successfully with
structured responses.

Measured local Hermes response times from the final run were:

| Scenario | Response time |
| --- | ---: |
| Sensory overload - shopping centre | 44.305s |
| Bedtime routine change | 20.048s |
| Transition to school | 21.046s |
| Communication frustration | 23.171s |
| Crowded supermarket | 15.248s |
| Missing-context guard | 0.000s |
| Allergy safety guard | 0.000s |
| Diagnostic safety guard | 0.000s |

The standard model-generated scenarios therefore took approximately 15-44
seconds on the local development machine.

The deterministic missing-context and safety cases completed immediately
because they are handled by the adapter without waiting for Ollama generation.

Latency depends on the developer machine, Ollama state and model warm-up, so
these measurements should be treated as local test results rather than fixed
production performance.

## Known limitations

### Hermes 3B can still repeat previous strategies

Despite prompt instructions, the local `hermes3:3b` model can occasionally
repeat a strategy from `previousStrategies` as advice.

For example, a communication scenario may still suggest pictures even when
pictures were already listed as previously tried.

The prompt reduces this behaviour but does not eliminate it completely.

### Follow-up questions can still be inconsistent

For normal model-generated responses, Hermes may occasionally ask a weak or
less useful follow-up question.

Deterministic guards are used where correctness is more important, including
missing-context, urgent medical and diagnostic-boundary cases.

### Local inference can be slow

The 3B model produced responses between approximately 15 and 44 seconds in the
final scenario run.

Performance varies depending on local hardware and whether Ollama has already
loaded the model.

### Advice quality is model-dependent

Hermes may produce suggestions that are repetitive, overly general or less
useful than expected.

The adapter therefore validates structure and enforces several important
boundaries in code rather than relying only on prompt compliance.

### Conversations are not persisted

Short-term session context can be supplied during the current conversation, but
the chat transcript is not stored permanently in Firestore.

Refreshing the page clears the conversation.

## Final Sprint 2 / Week 3 status

The Hermes adapter now:

- uses supplied application context;
- preserves contextual facts;
- supports short-term session context;
- returns schema-constrained JSON;
- supports up to three suggested actions;
- asks for clarification before advice when important context is missing;
- handles urgent medical boundaries without medication instructions;
- avoids diagnostic conclusions;
- exposes safety notices to the frontend;
- has been retested against the BA scenarios;
- has documented local setup, latency and known limitations.