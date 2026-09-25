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
- The team's **`.env` file** — ask Jonathan. It is not in the repo (it's
  gitignored) and the app will not start without it.

Never `npm install` or `yarn` in this repo — it's a pnpm workspace.

## Setup — once

```bash
git clone https://github.com/Bassman8K/Capstone-Week4-Team30.git
cd Capstone-Week4-Team30
pnpm install
```

Then put the `.env` file you were given in the **root** of the project — next to
`package.json`, not inside `frontend/`.

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
| `Warning: NEXT_PUBLIC_FIREBASE_* are empty` | The root `.env` is missing or in the wrong folder |
| `command not found: pnpm` | `npm install -g pnpm` |
| Errors about Node version | You're below Node 22 — upgrade |
| Port 3000 already in use | Something else is running; close it or restart |
| Weird build errors after pulling | `rm -rf frontend/.next` then try again |
| Login page loops or won't accept you | Your account may need email verification — check your inbox |

## About the `.env`

It contains the team's Firebase keys, including a service account key that has
full admin access to our database. Treat it like a password:

- Get it from Jonathan directly, not from a group channel.
- Don't commit it, paste it into a chat, or put it in a doc.
- If it ever leaks, tell the team so the key can be rotated.

Deployment is handled through Vercel — you don't need to set that up to work
locally. See [DEPLOY-TO-VERCEL.md](./DEPLOY-TO-VERCEL.md).
