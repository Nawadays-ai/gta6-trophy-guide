# Road to the Platinum — GTA VI Trophy Guide & Tracker

[![make.fun](https://img.shields.io/badge/make.fun-gta6--trophy--guide--01-ff2e88)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze — 1,350 points), built for the [gta6-trophy-guide-01](https://make.fun/c/gta6-trophy-guide-01) bounty on make.fun.

## What it is

A static web app under `app/` — no build step, no network requests, no dependencies. Open `app/index.html` in desktop Chrome (or serve it with `node serve.ts` and open http://localhost:8080) and it works with the network off.

- **Every trophy** with its official name, description and grade as PlayStation publishes them, plus a guide written in our own words and the sources behind each guide (Exophase, PowerPyx, Push Square, PSNProfiles).
- **Tracker**: tick trophies off; progress is saved in localStorage, with export to a file and import back. A progress bar counts trophies and points toward the platinum.
- **Filters**: search by name or keyword, filter by kind (story, missable, collectibles, activities, online) and by grade, hide earned trophies.
- **Spoiler setting**: hides the names and descriptions of secret story trophies until you earn them.
- **Roadmap to the platinum** in five stages, built from the official descriptions, with the one missable trophy flagged: **Positive Mental Attitude** — meditate at every spot, and do the Chapter 1 spot (Lucia's balcony) before Chapter 1 ends.
- **Honest about the unknown**: five hidden trophies whose exact trigger was not yet confirmed at launch (Personal Best, Actions Speak Louder, Bad Luck I Guess, The Truth Is Out There, Ten Pin) are marked **Unconfirmed** instead of guessing a method.

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself
- `app/data/trophies.json` — the 55 trophies (official data from the Exophase listing recorded by the organisers, checked against the kit's case file)
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the kit's vendored library
- `serve.ts` — tiny local static server for development
- `screenshots/` — real renders of the app in Chromium

## Run it

```sh
node serve.ts          # serves app/ on http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

Trophy names, descriptions and grades are as PlayStation publishes them (via Exophase). Guides are original writing for this entry. An unofficial fan guide, not affiliated with Rockstar Games or PlayStation; no Rockstar logo, artwork or game screenshots are used.

## License

MIT — see `LICENSE`.
