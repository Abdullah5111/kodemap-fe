# Kodemap Frontend — Architecture

Frontend for Kodemap. The system-wide architecture and data model live in
`kodemap-be/ARCHITECTURE.md`; this file covers the FE only.

## Stack
- **Next.js (App Router) + React**
- **Tailwind CSS**
- **Monaco Editor** (code editor)
- **TanStack Query** for data fetching/caching + **Axios** client
- JWT stored client-side; access token on requests, refresh on 401.

## Pages (MVP)
```
/login
/register
/dashboard          # roadmap progress summary
/roadmap            # tracks → modules → lessons, with locked/complete/current state
/questions/[slug]   # solving page (see below)
/leaderboard
/profile

/admin
/admin/questions
/admin/questions/new
/admin/questions/[id]/edit
/admin/submissions
/admin/users
/admin/reports      # supervisor progress views
```

## Question Solving Page
Layout:
```
┌─────────────────────────────┬──────────────────────────────┐
│ Statement                   │  Language selector            │
│ Input / Output format       │  Monaco editor                │
│ Constraints                 │  [ Run ]  [ Submit ]          │
│ Sample test cases           │  Result panel                 │
└─────────────────────────────┴──────────────────────────────┘
```

## Judging UX — polling contract
The backend judges asynchronously (batch submit + polling). The FE must NOT expect an
inline result from Submit.

```
Run:
  POST /questions/:id/run  → results (sample tests). May return inline or a submission_id.

Submit:
  POST /questions/:id/submit  → { submission_id, status: "in_queue" }
  then poll GET /submissions/:id every ~1.5s until status is terminal
  (accepted / wrong_answer / time_limit_exceeded / compilation_error /
   runtime_error / internal_error).
  Show live "Judging… (passed X/N)" state from passed_count/total_count.
```

Use TanStack Query's `refetchInterval` on the submission query, stopping once status is terminal.

## Result Panel states
- `in_queue` / `processing` → spinner + "Judging…"
- `accepted` → success + score awarded (only first solve awards points)
- `wrong_answer` → show which test failed (index only for hidden tests; full diff for samples)
- `compilation_error` → show `compile_output`
- `runtime_error` → show `stderr` / message
- `time_limit_exceeded` → note the limit

## Roadmap rendering
- Fetch `GET /roadmap` (structure + lock/complete state) and `GET /roadmap/progress`.
- Completed steps: checked. Current step: highlighted/unlocked. Future steps: locked/disabled.
- A step is complete only when all required questions in it are accepted (server-computed).

## Notes
- Language selector shows only `is_active` languages returned by the question endpoint.
- Sample test cases are visible; hidden test cases are never sent to the FE.
- Keep the first version lean (product plan §23): correct flow over UI polish.
```
