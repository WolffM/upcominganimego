# Trivia

- The repo's last two commits reverse each other eighteen minutes and
  fifty-eight seconds apart: one switches CI to the self-hosted fleet, the
  next switches it straight back, having found this repo has no runner to
  be self-hosted on (`3e7cd5f` 01:25:50, `081fd9b` 01:44:48, both
  2026-08-30).
- The project's busiest day is also nearly its first: 11 of its 25
  commits land on 2025-03-15, two days after the initial
  `create-next-app` scaffold (fact sheet, 2026-11-16).
- A "Migrate from npm to pnpm" change (PR #1) missed `deploy.yml`, which
  kept running `npm ci` after local development had already moved to
  pnpm; the fix landed as PR #2, the same day (`16d50b7`, `0d9ed43`).
- `package.json` still advertises two scripts — `test:api` and
  `generate-preferences` — that point at `src/scripts/`, a directory
  removed on 2025-03-15 (`1038cb5`) and never recreated; running either
  one today fails with a module-not-found error.
