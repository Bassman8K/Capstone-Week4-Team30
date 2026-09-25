# Running the App (Team 30)

For team members joining **this** repo.

> Don't follow the Quick Start in `README.md` — that's the original boilerplate's,
> written for someone starting a brand-new project. It will have you clone the
> wrong repo and create your own Firebase project. Use this instead.

## The deployed site

<https://frontend-bassman8ks-projects.vercel.app>

Most of the app works there with nothing to install — just sign in. Two caveats:

- **You may hit a "Login – Vercel" page.** That's Vercel's own access wall, not
  our app. It needs Deployment Protection turned off in the Vercel project
  settings, or your account added to the Vercel team. Ask Jonathan.
- **AI Chat doesn't work on the deployed site.** It talks to an AI service that
  runs on your own machine, so it shows *"Couldn't reach the assistant"* there.
  Everything else is fine. See
  [RUNNING-THE-AI-CHAT.md](./RUNNING-THE-AI-CHAT.md).

Ignore any URL that looks like `frontend-a1b2c3d4-…vercel.app` — those are
per-deployment and change on every push. The link above is the stable one.

If you only need to look at the app, stop here. Read on if you need to run it
locally to develop.

## What you need

- **Node.js 22 or newer** — [nodejs.org](https://nodejs.org). Check with `node -v`.
- **pnpm 10 or newer** — `npm install -g pnpm`. Check with `pnpm -v`.
- **One secret value** — `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64`. Ask Jonathan.
  Everything else is already in the repo.

Never `npm install` or `yarn` in this repo — it's a pnpm workspace.

## Setup — once

```bash
git clone https://github.com/Bassman8K/Capstone-Week4-Team30.git
cd Capstone-Week4-Team30
pnpm install
cp .env.example .env
```

Open `.env` and paste the value Jonathan gives you into the one blank line:

```
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=
```

That's the only thing you need to fill in — the rest is already there. Leave
`STITCH_API_KEY` blank unless you use Stitch in Claude Code; the app doesn't
need it.

Keep `.env` in the project **root**, next to `package.json`, not inside
`frontend/`. It's gitignored, so you won't accidentally commit it.

You never edit `frontend/.env.local` or `backend/.env` — those are generated
from the root `.env` automatically every time you run the app.

## Run it

```bash
pnpm run dev
```

Open <http://localhost:3000>. Sign in with your account, or create one.

That's it for every page **except AI Chat**, which needs a local AI service
running as well — see [RUNNING-THE-AI-CHAT.md](./RUNNING-THE-AI-CHAT.md).

## Other commands

| Command | What it does |
|---|---|
| `pnpm run dev` | Start the app on localhost:3000 |
| `pnpm run test:all` | Run all tests (`test` alone is backend only) |
| `pnpm run lint` | Check code style |
| `pnpm run typecheck` | Check TypeScript |
| `pnpm run build` | Production build — run this before opening a PR |

## If it doesn't work

| What you see | Fix |
|---|---|
| `Warning: NEXT_PUBLIC_FIREBASE_* are empty` | You skipped `cp .env.example .env`, or `.env` is in the wrong folder |
| Login fails or spins forever | `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` is blank — that's the one value you need from Jonathan |
| `command not found: pnpm` | `npm install -g pnpm` |
| Errors about Node version | You're below Node 22 — upgrade |
| Port 3000 already in use | Something else is running; close it or restart |
| Weird build errors after pulling | `rm -rf frontend/.next` then try again |
| Login page loops or won't accept you | Your account may need email verification — check your inbox |

## About the service account key

`FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` has full admin access to our Firestore
database and bypasses every security rule. Treat it like a password:

- Get it from Jonathan directly, not from a group channel.
- Don't commit it, paste it into a chat, or put it in a doc.
- If it ever leaks, tell the team so the key can be rotated.

The other values in `.env.example` are safe to have in the repo — they're
already served inside the deployed app's JavaScript, and Firebase treats the
web config as public by design.

Deployment is handled through Vercel — you don't need to set that up to work
locally. See [DEPLOY-TO-VERCEL.md](./DEPLOY-TO-VERCEL.md).
