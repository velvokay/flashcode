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
- A category path with real progress, due counts, and focused category sessions.
- Direct LeetCode links.
- Clear outcomes: `Couldn't solve`, `Needed help`, and `Solved independently`.
- A searchable library and a form for adding personal questions.
- Browser-local persistence with an explicit reset action.
- Keyboard shortcuts `1`–`3` for recording an outcome.

## Architecture

- React and TypeScript on Vite.
- No backend or account requirement.
- Scheduling lives in `src/lib/scheduler.ts` and is independent of the UI.
- Category ordering and session composition live in `src/lib/studyPath.ts`.
- Persistence lives in `src/lib/storage.ts` and can later be replaced by synced storage.
- Seed content lives in `src/data/questions.ts`; no problem statements are scraped or mirrored.

The visual system is defined in `BRAND.md`, with universal interface requirements in `AGENTS.md` and `DESIGN.md`.
