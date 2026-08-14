# Test Report — Login → Redirect → Team Page Flow

**[Login Restyling Bootstrap] Task 6 — Test Login → Redirect → Team Page Flow**
Role: Dev 1 — Jonathan

## Scope

Verify that: (1) an authenticated user landing on `/auth/signin` is redirected to
`/teams` (per the assignment sheet: "a styled login page leading into a team page"),
(2) an unauthenticated user requesting a protected route (e.g. `/teams`)
is redirected to `/auth/signin`, and (3) the team page renders the team name and one
card per member once reached.

## Automated test script

- `frontend/tests/unit/actions/auth.actions.test.ts` — exercises `getServerSession()`
  and `requireAuth()` (the route guard `(dashboard)/layout.tsx` calls before rendering
  `/dashboard`, `/teams`, `/profile`, `/settings`): no cookie → `null` / redirect to
  `/auth/signin`; invalid cookie → `null` / redirect; valid cookie → session returned,
  no redirect.
- `frontend/tests/unit/features/team/team.test.tsx` — exercises the team roster data
  and `TeamMemberCard` rendering (name, role, blurb, photo vs. placeholder avatar).

Run with:

```bash
pnpm --filter frontend test -- --run
```

## Results (this session)

```
✓ tests/unit/actions/auth.actions.test.ts (5 tests)
✓ tests/unit/lib/utils.test.ts (6 tests)
✓ tests/unit/features/team/team.test.tsx (6 tests)

Test Files  3 passed (3)
     Tests  17 passed (17)
```

`pnpm --filter frontend typecheck` and `pnpm --filter frontend lint` also pass with no
errors.

## Manual walkthrough (steps to run against a real Firebase project)

1. `pnpm run bootstrap` (or fill in `.env` by hand) to connect a Spark-plan Firebase
   project with Auth enabled.
2. `pnpm run dev`, open `/auth/signin`.
3. Sign in with a verified test account → expect an immediate redirect to `/teams`,
   rendering the team name and one card per member (PM, BA, UX, Dev), each with a
   name, role badge, and blurb.
4. Sign out, then navigate directly to `/teams` → expect a redirect to `/auth/signin`
   (enforced by `requireAuth()` in `(dashboard)/layout.tsx`).

## Known limitation

This environment has no Firebase project configured (`.env` is unfilled — no
`NEXT_PUBLIC_FIREBASE_*` values, no service account key), so the live browser
walkthrough above was **not executed end-to-end in this session**. The redirect logic
and team page rendering it depends on are covered by the automated tests above instead.
Whoever picks up a configured `.env` should run the manual steps once and update this
report with the outcome.
