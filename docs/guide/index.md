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
