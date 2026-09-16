# Application Structure — AI Assistant for Autism

The development foundation for the client project. Everything here is
**scaffolding**: routes resolve, navigation works, and the folder structure is
in place, but no screen implements its real feature yet.

Grep for `ScaffoldNotice` to find every place still outstanding.

---

## Running it

Same as the rest of the repo — see [GUIDE.md](GUIDE.md) for first-time setup
(Firebase project, `.env`). Once bootstrapped:

```bash
pnpm install
pnpm run dev          # http://localhost:3000
```

Verify before opening a PR:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test:all
```

All app routes sit under the `(dashboard)` route group, so they're behind
`getServerSession()` in `app/(dashboard)/layout.tsx` — signed-out users are
redirected to `/auth/signin` automatically. New screens added to that group
inherit the guard; you don't need to add auth checks per page.

---

## Screens

Derived from the **Refined Concepts** Figma. Three primary areas, matching the
mobile bottom-tab bar in the designs:

| Area | Route | Status |
|------|-------|--------|
| Log | `/log` | Lists the six log types |
| ↳ each log | `/log/{mood,food,sleep,stress,schedule,observation}` | Stub — no entry form |
| AI Chat | `/ai-chat` | Working end-to-end against mocked data |
| Dashboard | `/dashboard` | Card layout, all placeholders |
| ↳ Observations | `/dashboard/observations` | Stub — no timeline |
| Settings | `/settings` | From the boilerplate |

`/teams` and `/profile` also remain from earlier sprints.

---

## Navigation

Two components, kept in sync deliberately:

- **`components/layout/BottomNav.tsx`** — the three-tab bar from the designs.
  Mobile only (`lg:hidden`).
- **`components/layout/Sidebar.tsx`** — desktop equivalent. Carries the same
  three areas plus Teams / Profile / Settings.

Adding a primary area means updating **both**.

---

## Feature folders

One folder per domain, following the convention in `frontend/CLAUDE.md`:

```
features/
├── ai-chat/      ChatPanel (the screen), AssistantReply, ContextDrawer,
│                 FeedbackWidget, MessageBubble + the request/response
│                 contract and the mock assistant
├── logging/      LogTypeCard + the six log types (data.ts) + entry types
├── dashboard/    DashboardCard — the shared card shape the dashboard is built from
└── children/     ChildProfile and the context snapshot the assistant reads
```

Add a log type by appending to `features/logging/data.ts` — its card renders
automatically. Remember to add the matching route under `app/(dashboard)/log/`.

---

## Contract with the backend

`features/ai-chat/types.ts` mirrors `backend/src/lib/ollama.ts`:

```
SupportRequest   → childName, age, category, currentSituation,
                   recentContext?, knownTriggers?, previousStrategies?
SupportResponse  → possibleContext, suggestedActions, followUpQuestion
```

These are duplicated rather than shared, so **changing one means changing the
other**. Worth promoting to a shared workspace package once something else
needs them.

### Connecting the real assistant

`/ai-chat` currently calls `requestSupport()` from `features/ai-chat/mock.ts`,
which returns canned responses after a short delay. It already takes a real
`SupportRequest` and returns a real `SupportResponse`, so connecting DEV 2's
Hermes/Ollama agent means replacing that function's body with a fetch to the
backend — no component changes.

Mock copy is deliberately support-only and non-diagnostic. The BA's AI
behaviour contract will define the real guardrails and the category taxonomy
(`CATEGORY` in `ChatPanel.tsx` is a placeholder until then).

---

## Known gaps

- **Styling doesn't match the designs yet.** The app still wears the dusty-rose
  theme from the Week 4 sprint; the Refined Concepts designs are a blue/navy
  mobile theme. Re-theming touches `globals.css` and the existing `/teams`
  page, so it was left out of the scaffold deliberately — worth its own task.
- **The Weekly At A Glance chart is an empty slot.** Choosing a charting
  approach is its own decision, not scaffolding.
- No data layer yet — no Firestore collections, security rules, or Server
  Actions for logs. That's Sprint 2, and should go through
  `/firebase-collection` so types, rules, and schema docs stay in step.
