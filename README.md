# Kodemap — Frontend

Frontend for **Kodemap**, a structured problem-solving learning platform.
Built with **Next.js (App Router) + TypeScript + Tailwind CSS v4**. See
[ARCHITECTURE.md](ARCHITECTURE.md) for the FE design and the polling/judging contract.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — "Ember" theme (dark-first, light supported)
- TanStack Query + Axios (API client with JWT refresh)
- react-hook-form + zod (forms & validation)

## Getting Started

```bash
# 1. Install deps
npm install

# 2. Point at the backend API (defaults work with the Django dev server)
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# 3. Run (kodemap-be should be running too)
npm run dev                    # http://localhost:3000
```

## Design system — "Ember"

Dark-first, warm palette: reddish-orange **ember** accent on a warm charcoal ground,
with **ash-tan** as the quiet secondary. Tokens live in
[`src/app/globals.css`](src/app/globals.css) as CSS variables mapped to Tailwind
utilities (`bg-surface`, `text-ink-dim`, `text-ember`, `border-line`, …). Both light
and dark are tuned; the toggle stores the choice and applies it before paint.

An interactive reference of the full system and all screens (learner app + admin
console) lives at [`docs/design-reference.html`](docs/design-reference.html) — open it
in a browser.

## Structure

```
src/
├── app/
│   ├── layout.tsx            # root: fonts, theme script, Providers
│   ├── page.tsx              # role-based redirect (→ /login | /roadmap | /admin)
│   ├── (auth)/               # shared: /login, /register, /verify, /forgot
│   ├── (learner)/            # learner shell + /dashboard /roadmap /leaderboard /profile
│   └── admin/                # admin console shell + /admin/* pages
├── components/
│   ├── providers.tsx         # React Query + Auth context
│   ├── auth-provider.tsx     # current user, refresh, logout
│   ├── require-auth.tsx      # role guard for layouts
│   ├── shells/               # learner & admin app shells + nav
│   └── ui/                   # Button, Field, Logo, Avatar, ThemeToggle, icons
└── lib/
    ├── api.ts                # axios instance + single-flight token refresh
    ├── auth-api.ts           # register / login / verify / reset / me
    ├── tokens.ts             # access/refresh storage
    ├── types.ts              # User, Role, homePathForRole()
    └── config.ts             # API URL, storage keys
```

## Auth & routing

One shared **/login**. After sign-in the API's `role` decides the destination —
learners land on `/roadmap` (learner shell), admins/supervisors on `/admin` (a
separate console shell). `RequireAuth` gates each layout by role; wrong-role users are
redirected to their own home. The Axios client attaches the JWT and transparently
refreshes it on a 401.

## Status

🚧 **Foundation live**: Ember theme, both app shells, role-based routing, and a
working **login** wired to the backend (verified end-to-end). Next: register + OTP
verify screens, then the roadmap, solve page (Monaco), leaderboard, and the admin
console pages — see [ARCHITECTURE.md](ARCHITECTURE.md).
