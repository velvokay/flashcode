# Flashcode

Flashcode is a local-first spaced-repetition app for coding questions. It keeps a small review queue, reveals concise solution cues, and schedules each question from the learner's own recall rating.

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

- Ten built-in interview-pattern questions with original summaries and canonical LeetCode links.
- A due queue ordered by scheduled review time.
- Anki-style `Again`, `Hard`, `Good`, and `Easy` ratings with visible next intervals.
- A private per-question scratchpad that clears when the question advances.
- A searchable library and a form for adding personal questions.
- Browser-local persistence with an explicit reset action.
- Keyboard review controls: `Space` reveals the approach; `1`–`4` rate recall.

## Architecture

- React and TypeScript on Vite.
- No backend or account requirement.
- Scheduling lives in `src/lib/scheduler.ts` and is independent of the UI.
- Persistence lives in `src/lib/storage.ts` and can later be replaced by synced storage.
- Seed content lives in `src/data/questions.ts`; no problem statements are scraped or mirrored.

The visual system is defined in `BRAND.md`, with universal interface requirements in `AGENTS.md` and `DESIGN.md`.
