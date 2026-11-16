# Contributing

A standalone Next.js app with no backend of its own: everything it shows
comes live from AniList's GraphQL API, and it ships as a static export.

## Running it locally

```sh
pnpm install
pnpm dev     # next dev --turbopack, http://localhost:3000
pnpm lint    # next lint --fix
pnpm build   # next build --no-lint — static export for GitHub Pages
```

No API key or `.env` is needed: AniList's GraphQL endpoint is public for
the queries this app makes.

## Architecture map

```
src/app/page.tsx                 the one page: fetches the season, wires up sort/filter/ranking
src/components/
  AnimeCard.tsx, AnimeGrid.tsx    the list and its cards
  FilterBar.tsx, SortSelector.tsx  filtering and sort-order controls
  UserDetails.tsx, UserRatingsInput.tsx   AniList username entry and per-user rating summaries
  Modal.tsx, Pagination.tsx, LoadingSpinner.tsx, ErrorBoundary.tsx, ErrorDisplay.tsx, NoDataView.tsx
src/hooks/useAnime/               the data hook, split into fetching, filtering, pagination and state helpers
src/hooks/usePreferenceScoring.ts  wires a user's ratings into a per-anime score
src/services/
  anilistService.ts, anilistAnimeService.ts, anilistUserService.ts  AniList GraphQL queries
  anilistConstants.ts, anilistHelpers.ts   query strings, and the season-selection logic
  cacheService.ts                  caches a username's computed preferences
src/utils/
  preferenceScoring.ts             the genre/studio/director/tag/popularity scoring math
  imageFallbacks.ts                the Jikan-backed fallback-image chain
  userRatingsUtils.ts, animeHelpers.ts, dateFormatter.ts, uiConstants/uiHelpers/uiStyles.ts
```

`package.json` still names two scripts, `test:api` and
`generate-preferences`, pointing at `src/scripts/testAnilistApi.ts` and
`src/scripts/generatePreferences.ts`. That directory was removed on
2025-03-15 (`1038cb5`) and never recreated, so both scripts currently fail
with a module-not-found error rather than doing anything.

## Tests and gates

No test suite. `next lint --fix` is the only local check; CI runs the
build itself (below) as its gate — a build that fails is the signal, there
is no separate `check` job.

## How it deploys

`.github/workflows/deploy.yml` builds the static export and publishes it
to GitHub Pages on every push to `main`, or by hand via
`workflow_dispatch`. It deliberately runs on a GitHub-hosted runner, not
the account's self-hosted fleet: a comment in the workflow explains why —
this repo isn't registered in the account's fleet-coverage config and has
no runner that could ever pick the job up, so the self-hosted label would
just queue forever (see [history](history.md#the-nineteen-minute-experiment)
for the time this was tried anyway). pnpm itself comes from Corepack, read
from `package.json`'s own `packageManager` field rather than a pinned
action input, so there is exactly one place the version can drift from.

## Trivia

Node's version only became consistent across every workflow in this repo
449 days after its initial scaffold — before that, nothing had ever
needed it to be (2026-06-05; see [history](history.md#the-long-silence)).
