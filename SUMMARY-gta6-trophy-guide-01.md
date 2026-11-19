# SUMMARY — gta6-trophy-guide-01

## Entry

Road to the Platinum: an offline guide and tracker for all 55 PlayStation 5
trophies of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze,
1,350 points). Static files under app/, no build step, no network requests,
no dependencies. Open app/index.html in desktop Chrome or serve with
`node serve.ts`.

## Contents

- app/index.html, app/style.css, app/app.js — the guide and tracker
- app/data/trophies.json — all 55 trophies: official name, description, grade,
  points, secret flag, kind, missable flag, chapter, plus a guide in our own
  words and a sources list for every trophy. Verified against the organisers'
  case file (p00.in, Exophase recording): names, descriptions, grades, points
  and secret flags match exactly; 55 trophies, 1,350 points.
- main.ts — entry program (Node 22, stdlib only), copies app/ + screenshots/
  and writes dossier.json with the kit's vendored library
- serve.ts — tiny local static server
- vendor/makefun-frontend.ts — the kit's copy, unchanged (sha256 verified)
- screenshots/ — 4 real Chromium renders (see below)
- shots.json — what each screenshot shows
- README.md (badge make.fun for gta6-trophy-guide-01, repo
  Nawadays-ai/gta6-trophy-guide), LICENSE (MIT), .makefun/owner.json
  (wallet 528VzcgreXtS599EmxZczVbNrPSC3vtnSFHvezPjBccW)

## Features

- Tracker: checkboxes saved in localStorage, progress bar (trophies + points,
  also as a sticky bar), export progress to JSON, import it back, reset.
- Filters: search by name/keyword, kind (story / missable / collectibles /
  activities / online), grade, hide earned. Online filter honestly shows an
  empty state: no online trophies exist in this list.
- Spoiler setting: hides names and descriptions of secret story trophies
  until they are earned; earned ones are revealed.
- Roadmap to the platinum in 5 stages, built from the official descriptions,
  shown on the page with a missable warning.
- Missable flag: only Positive Mental Attitude (meditate at every spot; the
  Chapter 1 spot on Lucia's balcony disappears after Chapter 1).
- Unconfirmed trophies (5) marked honestly instead of guessing a method:
  Personal Best, Actions Speak Louder, Bad Luck I Guess, The Truth Is Out
  There, Ten Pin. Each guide says the trigger was not yet confirmed at launch
  and points to the cited guides.
- Sources cited beside every trophy's guide (Exophase, PowerPyx, Push Square,
  PSNProfiles) and in a Sources section with links. Guides are original
  writing; official names/descriptions are shown as PlayStation publishes
  them. No Rockstar logo, artwork or game screenshots.

## Screenshots (all real renders of the running app)

Chromium headless (/opt/meta-chromium/chrome v157) via CDP, loaded from
file:// with --allow-file-access-from-files. Note: this Chromium build
refuses to start without a Hatch WebGL domain policy; it was run with
--hatch-webgl-allowed-domains-file=/tmp/webgl-policy.txt (content
"hatch-webgl-all-origins-v1") and its sha256 switch. Each screenshot was
opened and visually checked.

- 1-cover.jpg (1280x800, 111,205 B) — checklist with 7 trophies earned,
  sticky progress bar (7 of 55, 105 / 1,350 points), filters, platinum guide
  open with its sources.
- 2-roadmap.jpg (1280x800, 172,622 B) — roadmap (5 stages) + missable
  warning + controls.
- 3-spoilers.jpg (1280x800, 100,460 B) — spoiler mode on: unearned secret
  trophies shown as "Hidden trophy", the earned one revealed.
- 4-missable.jpg (1280x800, 139,986 B) — kind filter "Missable": only
  Positive Mental Attitude ("Showing 1 of 55 trophies"), guide open with
  sources, plus the Sources section.

## Tests

- MAKEFUN_OUTPUT_DIR=/tmp/out-guide node main.ts — succeeds; run twice,
  byte-identical output (deterministic). dossier.json 763,423 bytes
  (under the 1.5 MiB cap); 4 screenshots copied.
- node serve.ts --port 8901 — index.html 200, data/trophies.json 200
  (55 trophies).
- No external references in app/: only relative local files; the source links
  are plain anchor hrefs (the app fetches nothing).

## Notes / caveats

- The game released today (19 Nov 2026); five hidden trophies are marked
  unconfirmed rather than inventing methods — see above.
- main.ts prints a harmless Node warning about module type (same as the
  starter would); it does not affect the run.
- Nothing submitted. No push to GitHub. Recording left running for the parent
  agent to stop and seal.
