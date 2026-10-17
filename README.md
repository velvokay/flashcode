# Flashcode

Spaced repetition for coding interview questions. Choose a plan, solve on LeetCode, and record how it went.

Included plans:

- NeetCode 150
- Blind 75
- Starter 10
- My questions

Progress is stored locally and carries over when a question appears in more than one plan.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verify

```bash
npm test
npm run build
```

## MVP behavior

- NeetCode 150, Blind 75, Starter 10, and personal question sets.
- Sessions capped at ten questions: due reviews first, then new questions from the next category in the path.
- A branching roadmap with real readiness data and focused category sessions.
- A review-history calendar with current and longest study streaks.
- A consistent plan-progress and activity sidebar across Today, Roadmap, and Library.
- Direct LeetCode links.
- Clear outcomes: `Couldn't solve`, `Needed help`, and `Solved independently`.
- Independent solves return after 4 days, then 10 days, then roughly 2.3 times the previous interval. Assisted solves return the next day without advancing that sequence.
- A searchable library and a form for adding personal questions.
- Browser-local persistence with an explicit reset action.
- Paused sessions reopen at the same question with the same queue for up to 24 hours.
- Completed sessions are recorded locally so Today can show a daily stopping point and offer optional additional study.
- Keyboard shortcuts `1`–`3` for recording an outcome.

## Architecture

- React and TypeScript on Vite.
- No backend or account requirement.
- Scheduling lives in `src/lib/scheduler.ts` and is independent of the UI.
- Category and session algorithms live in `src/lib/studyPath.ts`.
- Resumable session validation lives in `src/lib/session.ts`.
- Persistence lives in `src/lib/storage.ts` and can later be replaced by synced storage.
- The complete built-in question catalog lives in `src/data/catalogs/neetcode150.json`.
- Plan membership lives in `src/data/plans/studyPlans.json` and references stable question IDs.
- Category order, graph connections, and layout live in `src/data/roadmaps/neetcode150.json`.
- `src/data` contains datasets only. Loading, validation, selection, scheduling, persistence, and other application logic live in `src/lib`.

Ten questions currently include curated summaries and key steps. The rest use LeetCode as the problem surface and retain complete scheduling metadata in the catalog; no problem statements are scraped or mirrored.

The visual system is defined in `BRAND.md`, with universal interface requirements in `AGENTS.md` and `DESIGN.md`.
