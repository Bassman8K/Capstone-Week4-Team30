# Hermes/Ollama Agent Prototype Findings

## Test Setup

The prototype was tested locally using Ollama with the `hermes3:3b` model.

The test flow was:

Application context + user message → Ollama → Hermes 3 → structured JSON response

A standalone TypeScript test script was used to send project-specific context and a parent message to Hermes.

## Prompt Tuning

The first test returned valid JSON but used unexpected field names:

- `solution`
- `solutionSteps`

The system prompt was then tuned once to explicitly require:

- `possibleContext`
- `suggestedActions`
- `followUpQuestion`
- `safetyNotice` (optional)

After tuning, the model consistently returned the required field names.

## BA Scenario Testing

| Scenario | Response Time | JSON Format | Issues |
| --- | ---: | --- | --- |
| Loud shopping centre | 34.764s | Correct | `safetyNotice` returned as null |
| Bedtime routine change | 35.240s | Correct | Returned 6 suggested actions instead of 3 |
| Transition from playing to school | 30.965s | Correct | Returned 7 suggested actions instead of 3 |
| Communication frustration | 30.420s | Correct | Returned 4 suggested actions instead of 3 |
| Crowded supermarket | 27.280s | Correct | Returned 8 suggested actions instead of 3 |

## Findings

The prototype successfully sent structured child context and a parent message to the local Hermes model and received structured JSON responses.

Prompt tuning fixed the initial response-field mismatch.

The main remaining issue is that Hermes does not consistently follow the requested limit of three suggested actions.

Response latency during the five scenario tests ranged from approximately 27 to 35 seconds.

The model also returned `safetyNotice` as `null` in the tested non-emergency scenarios.

These findings can be used to guide further prompt and response-validation improvements in later development.