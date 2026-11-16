# History

25 commits over 534 days (first `7dc83b3` 2025-03-13, latest `081fd9b`
2026-08-30; `node scripts/fact-sheet.mjs` against this worktree). Built in
a weekend, left alone for over a year, then revisited in short CI-focused
bursts.

## A weekend build

`7dc83b3` (2025-03-13) is `create-next-app`'s own scaffold; the same
evening, `e5cef04` ("it works!") makes it fetch real data. Two days later,
2025-03-15 is the busiest day in the repo's history by a wide margin — 11
of its 25 commits — and is where the app keeps becoming the app:
`1038cb5` continues that work, a working filter bar follows (`05f04eb`),
GitHub Pages deployment is configured (`56b1706`), and a small flurry of
GitHub Actions version churn fixes deprecated upload-artifact actions,
including one revert the same day (`189c12e`, `0952bc7`, `ee2a76a`).
`c48bda1`, also that day, links each anime card's title to its AniList
page. Three days later, two README edits (`97f19b2`, `41b0509`, both
2025-03-18) are the last commits for well over a year.

## The long silence

`41b0509` to 2026-06-05 is a 445-day gap — the longest in the repo's
history (fact sheet, 2026-11-16) — before anyone touches the project
again. On that day, a commit standardizes Node to 22 across every
workflow; the very next day, `6124c1f` disables pnpm's
`minimumReleaseAge` gate, since
nothing about a personal project needs a package-age floor. Sixteen days
later, `700b324` (2026-06-22) reworks the default-season logic so it
switches to the next season partway through the current one instead of
the instant it starts.

## The pnpm migration, and completing it the same day

`16d50b7` (2026-07-14, PR #1) migrates the project from npm to pnpm — most
of its 10,367 changed lines are the lockfile swap. It missed one spot:
`deploy.yml` still ran `npm ci`, so the live deploy workflow was still
npm-based even though local development had already moved on. `0d9ed43`,
opened as PR #2 the same day, finishes the job. Three and a half weeks
later, a short cluster on 2026-08-08 moves pnpm setup off
`pnpm/action-setup` (whose self-installer shares one directory across
concurrent runners and can fail with an `ENOENT` race) onto Corepack
instead, reading the version straight from `package.json`'s own
`packageManager` field (`8e56b04`, `c8294ed`, `0bdcf1d`).

## The nineteen-minute experiment

The repo's last two commits, both in the small hours of 2026-08-30, flip
the same decision twice: `3e7cd5f` (01:25) switches the deploy workflow to
run on the account's self-hosted fleet; `081fd9b` (01:44), nineteen minutes
later, switches it back, because — as its message says plainly — this
repo has no runner to actually be self-hosted on. It is the project's most
recent commit.

## Trivia

See [trivia.md](trivia.md) — starting with the two commits above, and how
little time passed between them.
