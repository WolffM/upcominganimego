---
title: Upcoming Anime Go
summary: >-
  A static site that browses upcoming anime by season, with trailers, and
  ranks them against one or more AniList accounts' own rating history
  instead of just AniList's global popularity.
features:
  - name: Browse by season
    summary: 'Upcoming anime for a season, with trailers, defaulting to whichever season is coming up next.'
    anchor: browse-by-season
  - name: Personalized ranking
    summary: 'Enter one or more AniList usernames and every anime is scored against their actual rating history — genres, studios, directors, tags — not just global popularity.'
    anchor: personalized-ranking
  - name: Sorting and filtering
    summary: 'Sort by personalized score, popularity or release date, and filter the list down.'
    anchor: sorting-and-filtering
  - name: Image fallback
    summary: 'When an anime has no cover art yet, looks for one from a related season or falls back to a season-appropriate placeholder.'
    anchor: image-fallback
trivia:
  - 'The repo tried moving its CI to the self-hosted fleet and reverted nineteen minutes later, having found this repo has no runner to be self-hosted on (`3e7cd5f`, `081fd9b`).'
  - 'A "Migrate from npm to pnpm" change (PR #1) still had `deploy.yml` running `npm ci`; the fix landed the same day, as PR #2 (`16d50b7`, `0d9ed43`).'
  - 'The repo went quiet for 445 days — from a README tweak the week it was built to the next time anyone touched it (`41b0509` to 2026-06-05, the longest gap in its history).'
  - 'The busiest day of the project is also its first weekend: eleven of the repo''s 25 commits land on 2025-03-15, two days after the initial `create-next-app` scaffold (fact sheet, 2026-11-16).'
---

# Upcoming Anime Go

A small [Next.js](https://nextjs.org/) site, statically exported to GitHub
Pages, that answers one question: out of everything coming next season, what
should *you* actually watch? It pulls the season's anime from the
[AniList](https://anilist.co/) GraphQL API and, if you give it an AniList
username, re-ranks the list against that account's own rating history
instead of leaving you with AniList's raw popularity order.

![The season browser: a filter bar for search, genre, format, year and
season, above a grid of anime cards with cover art, ratings and
genres](images/season-browser.webp)

- [Features](features.md): browsing, personalized ranking, and the
  fallback-image system.
- [Contributing](contributing.md): running it locally, the layout, how it
  deploys.
- [History](history.md): a weekend build, a 445-day silence, and a CI
  experiment that lasted nineteen minutes.
- [Trivia](trivia.md)

## Trivia

Ranking is never just "what's popular." A user's actual AniList rating
history is scored genre by genre, studio by studio and tag by tag against
every upcoming anime. Only then is it blended with a deliberately
dampened, logarithmic popularity boost, so one runaway hit can't swamp
everything else ([features](features.md#personalized-ranking)).
