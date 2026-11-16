# Features

What the site does, for someone using it. No feature has a tier: this is a
standalone static site with no accounts or sign-in of its own — only an
AniList username you can optionally type in.

## Browse by season

**What it does.** Lists upcoming anime for a given season — title,
trailer, synopsis, release info — pulled live from AniList.

**How to use it.** The site opens on a default season. Rather than
flipping the moment a new season technically starts, the default stays on
the *current* season until roughly halfway through it, then switches to
the one coming up — so the list doesn't jump to showing Fall the instant
Summer begins (`getDefaultSeason`, `src/services/anilistHelpers.ts`).

**What it does not do.** There's no calendar picker beyond season and
year; you can't browse an arbitrary date range.

## Personalized ranking

**What it does.** Enter one or more AniList usernames. Every anime in the
list gets a score built from that account's (or those accounts') actual
rating history: how much they've liked that genre, that studio, that
director, and those tags in the past, averaged and combined. A dampened
popularity boost is added on top, so one runaway hit can't swamp a
personal preference. Give more than one username and the site also shows
a combined score averaged across all of them.

**How to use it.** Click "Load User Data" above the grid to open the
username form, enter an AniList username, and submit "Load User Ratings";
the site fetches that account's rating history from AniList and
recalculates every score. Preferences are cached per
username so a repeat visit doesn't re-fetch and re-crunch the same rating
history (`src/services/cacheService.ts`).

**What it does not do.** The popularity component is deliberately
*logarithmic*, not linear — capped and curved so it grows quickly for a
niche show and then flattens, specifically so a mega-hit can't dominate a
personal score just by being popular
(`calculatePopularityScore`, `src/utils/preferenceScoring.ts`).

## Sorting and filtering

**What it does.** Sort the season's anime by personalized score,
popularity, or release date; filter the list down by criteria in the
filter bar.

**How to use it.** The "Sort by" dropdown (Popularity, Release Date, or a
loaded user's preference) sits above the grid, next to a filter bar with
a text search and dropdowns for genre, format, year and season.

## Image fallback

**What it does.** When AniList has no cover image yet for an anime (common
for something unannounced far enough ahead), the site tries to find one
rather than showing a broken image.

**How to use it.** Automatic. It first searches the Jikan (MyAnimeList)
API for the exact title. If the title looks like a sequel ("Season 2",
"Part 3", a trailing numeral or ordinal), it searches Jikan again for the
base title with the sequel marker stripped, on the theory that a sequel
often reuses its predecessor's key art. If neither search turns up
anything, it falls back to a season-appropriate generic placeholder
(`getFallbackImageUrl`, `src/utils/imageFallbacks.ts`).

**What it does not do.** The sequel detection is pattern-based (looking for
things like "2nd", "Part 3", a trailing roman numeral) and will miss a
sequel whose title doesn't follow one of those patterns.

## Trivia

The sequel-title pattern match is also used in reverse: `getBaseTitle`
strips exactly the same markers it detects, so the fallback search for "X
Season 2" is a search for plain "X"
(`src/utils/imageFallbacks.ts`).
