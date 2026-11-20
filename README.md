# Road to the Platinum — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Nawadays-ai/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Nawadays-ai/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze — 1,350 points), built for the [gta6-trophy-guide-01](https://make.fun/c/gta6-trophy-guide-01) bounty on make.fun.

## What it is

A static web app under `app/` — no build step, no network requests on load, no dependencies. It works opened **directly from disk** (`app/index.html` via file:// in standard Chrome, no special flags) and served over HTTP (`node serve.ts`, then http://localhost:8080), with the network off.

- **Every trophy** with its official name, description and grade as PlayStation publishes them, plus a guide written in our own words and clickable sources behind each guide (Exophase, PowerPyx, Push Square, PSNProfiles).
- **Tracker**: tick trophies off; progress is saved in localStorage, with export to a file and a styled Import JSON button (with validation status messages) to bring it back. Reset uses an inline two-step confirmation. The hero dashboard counts trophies, points, each grade (Platinum/Gold/Silver/Bronze), the missable trophy, and Platinum progress; a sticky progress bar fades in only after the hero scrolls away.
- **Smart Platinum**: the Platinum card shows your **X / 54** progress and ticks itself automatically when the other 54 trophies are all earned — and unticks again if any of them is unchecked.
- **Filters & sorting**: search by name or keyword, filter by kind (story, missable, collectibles, activities, online) and by grade, hide earned trophies, sort by PlayStation Order / Grade / Unearned First, and expand or collapse all guides at once.
- **Total spoiler lock**: with “Hide story spoilers” on, a secret trophy is fully locked — name, description, guide, sources, meta line and badges all stay hidden, search cannot find it by its hidden text, and its checkbox is labelled generically. A per-card **Reveal this trophy** button peeks at one trophy without turning spoilers off for everyone.
- **Interactive roadmap**: the missable checkpoint comes **first** (the Chapter 1 meditation spot on Lucia's balcony must be done *before* completing Chapter 1), then story (20), collectibles (4) and activities (29) — 54 earnable trophies with live per-stage progress; clicking a stage filters the checklist (with a “Filtered by” banner; click the stage again or Clear to cancel) — and a final row for the Platinum, which unlocks automatically (54 + 1 = 55). The roadmap is honest about the two Golds: only the finale Gold is a story trophy; **A Long Road** is for 100% completion of the whole game and finishes during cleanup.
- **Honest about the unknown**: five hidden trophies whose exact trigger was not yet confirmed at launch (Personal Best, Actions Speak Louder, Bad Luck I Guess, The Truth Is Out There, Ten Pin) are badged **UNCONFIRMED AT LAUNCH** instead of guessing a method.

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself (a classic script, not an ES module: module scripts are blocked by CORS under file://)
- `app/data/trophies.json` — the 55 trophies (official data from the Exophase listing recorded by the organisers, checked against the kit's case file)
- `app/data/trophies.js` — the same data as a script (`window.TROPHIES_DATA`), so the guide also renders from file:// where `fetch()` of a local file is blocked; `main.ts` verifies at build time that it is identical to `trophies.json` and refuses to hand in if they drift
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the kit's vendored library
- `serve.ts` — tiny local static server for development
- `screenshots/` — real renders of the app in Chromium
- `package.json` — `{ "type": "module" }` so Node runs `main.ts` without a module-type warning (verified: the dossier it produces is byte-identical with and without it, and the file is never copied into `/output`)

## Run it

```sh
node serve.ts          # serves app/ on http://localhost:8080
```

…or just open `app/index.html` in Chrome straight from disk.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

Trophy names, descriptions and grades are as PlayStation publishes them (via Exophase). Guides are original writing for this entry. An unofficial fan guide, not affiliated with Rockstar Games or PlayStation; no Rockstar logo, artwork or game screenshots are used.

## License

MIT — see `LICENSE`.
