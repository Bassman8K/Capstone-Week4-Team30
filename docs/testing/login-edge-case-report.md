# Edge Case Test Report — Login & Create Account

**[Login Restyling Bootstrap] Task 7 — Test Edge Cases & Log Bugs**
Role: Dev 1 — Jonathan

Covers the two edge-case screens from the Task 2 (UX) mockup: the "Missing details"
and "Incorrect details" states on Log in, and "Missing details" on Create Account.

## Automated test script

`frontend/tests/unit/lib/validations/auth.test.ts` exercises `loginSchema` and
`signupSchema` (the Zod schemas `react-hook-form` runs on submit) against the
edge-case inputs the mockup calls out: empty fields, a malformed email, a weak
password, and mismatched password/confirm-password. Run with:

```bash
pnpm --filter frontend test -- --run
```

Result: 8/8 passing (part of a 25/25 pass across the full frontend suite).

## Edge cases exercised and outcome

| Edge case | Where | Expected (per mockup) | Result |
|---|---|---|---|
| Empty email + empty password | Log in | "Missing details: Please enter your email and/or password" banner | Pass — `loginSchema` rejects, `onInvalid` sets the banner |
| Malformed email | Log in | Same missing-details banner (form-level, no field breakdown in the design) | Pass |
| Wrong password for a real account | Log in | "Incorrect details: Email and/or password incorrect. Please try again" banner | Pass — `signInWithEmail` rejects, `onValid`'s catch sets the banner (verified by code inspection; requires a live Firebase project to trigger the real Firebase error, see limitation below) |
| Unverified email, correct password | Log in | Existing behaviour (unchanged, not part of the UX mockup) | Unchanged — still shows a toast, not the banner, so a legitimate "please verify" case isn't mistaken for "incorrect details" |
| All fields empty | Create Account | "Missing details: Please fill in all input fields" banner | Pass |
| Password/confirm mismatch | Create Account | Rejected, generic missing-details banner (design has no separate mismatch message) | Pass, see bug log below |

## Bugs found / logged

1. **Confirm-password mismatch shows the generic "Missing details" banner, not a
   specific message.** The mockup only defines one Create Account error state
   ("Please fill in all input fields"), so a mismatch is currently reported with the
   same generic banner rather than something like "Passwords do not match." Logged
   for the BA/UX to decide whether the design needs a second Create Account error
   state — no code change made, since adding one isn't specified in the current
   design.
2. **`aria-invalid` on the email/password inputs stays `true` until the next
   submit**, even after the user starts correcting the field, because it's now
   driven by the shared banner state rather than per-field Zod errors (previously
   each field cleared its own error as soon as it became valid). Minor a11y
   regression traded for matching the mockup's single banner instead of per-field
   messages — flagged here rather than silently left undiscovered.

## Known limitation

The "Incorrect details" banner's trigger (a real Firebase `signInWithEmail`
rejection) was verified by code inspection only, not by exercising it against a
live Firebase project — this environment has no `.env` configured (see
`docs/testing/login-redirect-team-flow-test-report.md`). Whoever has a configured
project should sign in with a wrong password once and confirm the banner text
matches exactly.
