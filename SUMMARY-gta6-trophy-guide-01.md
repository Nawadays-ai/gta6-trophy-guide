# SUMMARY — gta6-trophy-guide-01

## Entry

Road to the Platinum: an offline guide and tracker for all 55 PlayStation 5
trophies of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze,
1,350 points). Static files under app/, no build step, no network requests
on load, no dependencies. Works opened natively from file:// in standard
Chrome (no special flags) and served with `node serve.ts`.

## Contents

- app/index.html, app/style.css, app/app.js — the guide and tracker (classic
  script, not an ES module: modules are CORS-blocked under file://)
- app/data/trophies.js — the same data as window.TROPHIES_DATA so the guide
  renders natively from file://; main.ts verifies it is identical to
  trophies.json at build time and refuses to hand in if they drift
- app/data/trophies.json — all 55 trophies: official name, description, grade,
  points, secret flag, kind, missable flag, chapter, plus a guide in our own
  words and a sources list for every trophy. Verified against the organisers'
  case file (p00.in, Exophase recording): names, descriptions, grades, points
  and secret flags match exactly; 55 trophies, 1,350 points. This file is
  byte-identical to the v1 entry (sha256 b607b521…ba10).
- main.ts — entry program (Node 22, stdlib only), copies app/ + screenshots/
  and writes dossier.json with the kit's vendored library
- serve.ts — tiny local static server
- vendor/makefun-frontend.ts — the kit's copy, unchanged (sha256 verified)
- package.json — { "type": "module" }; root-only, never copied to /output,
  and the dossier is byte-identical with and without it (verified)
- screenshots/ — 4 real Chromium renders (see below)
- shots.json — what each screenshot shows
- README.md (badge make.fun for gta6-trophy-guide-01, repo
  Nawadays-ai/gta6-trophy-guide), LICENSE (MIT), .makefun/owner.json
  (wallet 528VzcgreXtS599EmxZczVbNrPSC3vtnSFHvezPjBccW)

## Features

- Tracker: checkboxes saved in localStorage, hero progress bar (trophies +
  points) plus a hero grade dashboard (per-grade chips with SVG trophy
  icons, missable counter, Platinum X/54); a sticky bar that stays hidden
  while the hero is on screen and fades in after it scrolls away. Export
  progress to JSON, styled Import JSON with validation status messages,
  two-step inline reset confirmation (no window.confirm).
- Smart Platinum: shows X / 54 progress, auto-ticks when the other 54 are
  earned and unticks if any is unchecked (two-way sync, checkbox disabled).
- Filters: search by name/keyword, kind (All kinds / Story / Missable /
  Collectibles / Activities / Online), grade, hide earned; sort by
  PlayStation Order / Grade / Unearned First; expand/collapse all guides.
  Online filter honestly shows an empty state: no online trophies exist in
  this list.
- Spoiler setting (total lock): name, description, guide, sources, meta and
  badges of an unearned secret trophy all stay hidden, search cannot match
  its hidden text, and the checkbox label is generic ("Mark hidden trophy
  as earned"); a per-card "Reveal this trophy" button peeks at one card
  only, without touching the global toggle.
- Interactive roadmap: Stage 1 is the missable checkpoint (Chapter 1 balcony
  spot BEFORE completing Chapter 1), then Stage 2 story (20), Stage 3
  collectibles (4) and Stage 4 activities (29) = 54 earnable trophies with
  live per-stage progress and click-to-filter (a "Filtered by: …" banner
  appears; clicking the stage again or the banner's Clear cancels it), plus
  a final automatic-Platinum row (54 + 1 = 55) and the Missable Alert.
  Gold facts, checked against trophies.json: the two Golds are id 7
  "You Gotta Know When to Get Off" (story, Finale — complete the final
  mission) and id 14 "A Long Road" (kind story, but its description is
  "Attain 100% Completion" — the whole game, not the story alone). The
  roadmap therefore credits Stage 2 with the finale Gold only and places
  A Long Road's completion in Stage 4 cleanup.
- Missable flag: only Positive Mental Attitude (meditate at every spot; the
  Chapter 1 spot on Lucia's balcony disappears after Chapter 1).
- Unconfirmed trophies (5, ids 47–51) badged UNCONFIRMED AT LAUNCH instead
  of guessing a method: Personal Best, Actions Speak Louder, Bad Luck
  I Guess, The Truth Is Out There, Ten Pin.
- Sources cited beside every trophy's guide as clearly clickable, underlined
  links (Exophase, PowerPyx, Push Square, PSNProfiles) and in a Sources
  section with links. Guides are original writing; official
  names/descriptions are shown as PlayStation publishes them. No Rockstar
  logo, artwork or game screenshots.

## Screenshots (all real renders of the running app)

Chromium headless (/opt/meta-chromium/chrome) via CDP, loaded from file://
natively (no --allow-file-access-from-files). Each screenshot was opened
and visually checked. Cover and roadmap share one seeded progress state:
14 trophies earned (ids 2,3,4,5,6,7,8,9,10,15,16,17,18,28 — the missable,
the finale Gold, 2 Silver, 11 Bronze; Platinum progress 14/54).

- 1-cover.jpg (1280x800, 144,961 B) — scroll position 0, sticky bar hidden:
  sunset hero + all grade chips + slim control panel, Platinum card with
  X/54 progress line and guide open (clickable Sources links), top of the
  next card visible.
- 2-roadmap.jpg (1280x800, 158,905 B) — whole roadmap block in frame under
  the sticky bar: Stage 1 (1/1), Stage 2 (9/20, corrected Gold text),
  Stage 3 (0/4), Stage 4 (4/29), Final Platinum row (14/54), live progress
  bars, full Missable Alert.
- 3-spoilers.jpg (1280x800, 112,762 B) — "Hide story spoilers" checked with
  the control panel in frame: earned secret trophy revealed, the next
  secret trophy fully locked ("Hidden trophy", Guide — locked) with its
  Reveal button fully on screen.
- 4-missable.jpg (1280x800, 160,105 B) — kind filter "Missable": only
  Positive Mental Attitude ("Showing 1 of 55 trophies"), guide open with
  underlined clickable Sources links, plus the Sources section fully
  visible with all 4 bulleted source links.

## Tests

- Headless Chromium from file:// WITHOUT --allow-file-access-from-files:
  55 cards rendered, 0 console errors, 0 exceptions, only the 4 local app
  files requested (no external requests).
- CDP functional tests: stage click-to-filter with banner + toggle-off and
  banner Clear; spoiler lock (no name/description/guide/sources/meta/aria
  leaks, search cannot match hidden text, per-card reveal works, global
  toggle untouched); Platinum two-way sync (55/55 at full set, unticks when
  one is unchecked) — all pass with 0 console errors.
- node serve.ts (curl) — index.html 200, data/trophies.json 200 and
  byte-identical to disk (sha256 b607b521…ba10), data/trophies.js 200;
  vendor/makefun-frontend.ts sha256 unchanged.
- MAKEFUN_OUTPUT_DIR runs of node main.ts — twice, byte-identical output
  trees and dossier (sha256 951be112…), 0 bytes of stderr (no warnings).
  dossier.json 898,296 bytes (under the 1.5 MiB cap); dossier text portion
  121,780 bytes (under the 163,840 cap); all 4 screenshots ≤ 262,144 B.

## Notes / caveats

- The game released today (19 Nov 2026); five hidden trophies are marked
  unconfirmed rather than inventing methods — see above.
- Nothing submitted. No push to GitHub. Recording left running for the parent
  agent to stop and seal.
