// Road to the Platinum — GTA VI trophy guide and tracker.
// Static, offline, no dependencies. Trophy data comes from data/trophies.js
// (window.TROPHIES_DATA, kept identical to data/trophies.json — see main.ts),
// which works both over HTTP and when index.html is opened directly via
// file://, where fetch() of a local file is blocked. Over HTTP the JSON file
// is preferred and the JS copy is the fallback. Checklist progress is saved in
// localStorage and can be exported/imported as JSON.
const STORAGE_KEY = 'gta6-trophy-tracker-v1';
const TOTAL_POINTS = 1350;
const PLATINUM_ID = 1;

const MISSABLE_TEXT =
  'Positive Mental Attitude is the only missable trophy: meditate at every spot across Leonida, and do the Chapter 1 spot (Lucia’s balcony) BEFORE you complete Chapter 1 — it disappears once that chapter ends.';

// Clickable source links for the guide cards. The app itself loads nothing
// from the network: these anchors only open if a reader clicks them.
const SOURCE_URLS = {
  'Exophase — GTA VI trophy list': 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  'PowerPyx — GTA 6 Trophy Guide': 'https://www.powerpyx.com/grand-theft-auto-vi-gta-6-trophy-guide-roadmap/',
  'Push Square — GTA 6 Trophy Guide': 'https://www.pushsquare.com/guides/gta-6-trophy-guide-all-trophies-and-how-to-get-the-platinum',
  'PSNProfiles — GTA VI trophy list': 'https://psnprofiles.com/trophies/grand-theft-auto-vi',
};

// Roadmap stages partition the 54 earnable trophies (everything except the
// Platinum). The Platinum is not a stage you play: it unlocks automatically
// when the other 54 are earned, and is shown as the final roadmap row.
const STAGES = [
  {
    title: 'Stage 1 — FIRST, before finishing Chapter 1: the missable checkpoint',
    text: 'Before you complete Chapter 1, meditate at the Chapter 1 spot on Lucia’s balcony. That spot is gone once Chapter 1 ends, and Positive Mental Attitude needs every meditation spot — this warning comes first so the trophy cannot be lost.',
    match: (t) => t.missable,
    filter: { kind: 'missable' },
  },
  {
    title: 'Stage 2 — Play the story',
    text: 'Chapters 1–4, then the finale. The 20 story trophies unlock as their missions and chapters complete, including the Gold for the final mission (You Gotta Know When to Get Off). The other Gold, A Long Road, is for 100% completion of the whole game, so it only finishes later, during Stage 4 cleanup — it is not a story-only trophy. Nothing here needs a special setup — just play, and keep the Stage 1 checkpoint in mind at the start.',
    match: (t) => t.kind === 'story' && t.id !== PLATINUM_ID,
    filter: { kind: 'story' },
  },
  {
    title: 'Stage 3 — Collectibles and exploration',
    text: 'Card sets, WAiNK spots, vehicles discovered and full map coverage (the missable meditation trophy is counted in Stage 1). These are long counters, so start them during the story and finish them in free roam after the finale.',
    match: (t) => t.kind === 'collectible' && !t.missable,
    filter: { kind: 'collectible' },
  },
  {
    title: 'Stage 4 — Activities, challenges and money',
    text: 'Stranger strands, races, drone races, the shooting range, stunts, robberies, challenges and the money trophies (laundering, spending, garages). Do the 5 trophies badged UNCONFIRMED AT LAUNCH last, once the community verifies how they trigger.',
    match: (t) => t.kind === 'activity',
    filter: { kind: 'activity' },
  },
];

const params = new URLSearchParams(location.search);
const listEl = document.getElementById('trophyList');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const sortEl = document.getElementById('sort');
const spoilerEl = document.getElementById('spoiler');
const hideEarnedEl = document.getElementById('hideEarned');
const progressTextEl = document.getElementById('progressText');
const progressPointsEl = document.getElementById('progressPoints');
const progressFillEl = document.getElementById('progressFill');
const filterCountEl = document.getElementById('filterCount');
const emptyStateEl = document.getElementById('emptyState');
const importStatusEl = document.getElementById('importStatus');
const filterBannerEl = document.getElementById('filterBanner');
const filterBannerTextEl = document.getElementById('filterBannerText');

if (params.get('kind')) kindEl.value = params.get('kind');
if (params.get('grade')) gradeEl.value = params.get('grade');
if (params.get('sort')) sortEl.value = params.get('sort');
if (params.get('spoiler') === '1') spoilerEl.checked = true;

// Which roadmap stage filter is active (stage index, 'platinum', or null).
// Clicking the active stage again cancels it; the banner's Clear button too.
let activeStage = null;
let applyingStageFilter = false;

function setStageBanner() {
  if (activeStage === null) {
    filterBannerEl.hidden = true;
    return;
  }
  const label = activeStage === 'platinum' ? 'Final — The Platinum (automatic)' : STAGES[activeStage].title;
  filterBannerTextEl.textContent = label;
  filterBannerEl.hidden = false;
}

function clearStageFilter() {
  activeStage = null;
  applyingStageFilter = true;
  kindEl.value = 'all';
  gradeEl.value = 'all';
  applyingStageFilter = false;
  setStageBanner();
  renderRoadmapActive();
  // The change listeners registered in main() re-render the list and roadmap.
  kindEl.dispatchEvent(new Event('change'));
}

function applyStageFilter(key, filter) {
  if (activeStage === key) {
    clearStageFilter();
    return;
  }
  activeStage = key;
  applyingStageFilter = true;
  kindEl.value = filter.kind ?? 'all';
  gradeEl.value = filter.grade ?? 'all';
  applyingStageFilter = false;
  setStageBanner();
  kindEl.dispatchEvent(new Event('change'));
  document.getElementById('listTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Re-render only the roadmap highlight without a full render cycle.
function renderRoadmapActive() {
  document.querySelectorAll('.stage-btn').forEach((b, i) => {
    const key = i < STAGES.length ? i : 'platinum';
    b.classList.toggle('stage-active', activeStage === key);
  });
}

document.getElementById('filterBannerClear').addEventListener('click', () => clearStageFilter());

// Sticky progress bar: hidden while the hero (with its own progress bar) is
// on screen, fading/sliding in once the hero has scrolled away.
const stickyBarEl = document.querySelector('.sticky-progress');
const mastheadEl = document.querySelector('.masthead');
function syncStickyBar() {
  const heroGone = window.scrollY > mastheadEl.offsetTop + mastheadEl.offsetHeight - 90;
  stickyBarEl.classList.toggle('visible', heroGone);
}
window.addEventListener('scroll', syncStickyBar, { passive: true });

// This is a classic script (not an ES module) on purpose: module scripts are
// blocked by CORS under file:// in Chrome, classic scripts are not.
async function main() {
// --- Load trophy data: JSON over HTTP first, embedded JS copy as fallback ---
let doc = null;
if (location.protocol === 'http:' || location.protocol === 'https:') {
  try {
    const res = await fetch('data/trophies.json');
    if (res.ok) doc = await res.json();
  } catch {
    doc = null;
  }
}
if (!doc && window.TROPHIES_DATA) doc = window.TROPHIES_DATA;
if (!doc) {
  emptyStateEl.hidden = false;
  emptyStateEl.textContent = 'Trophy data could not be loaded. Serve this folder with node serve.ts or reopen index.html from the app folder.';
  throw new Error('trophy data unavailable');
}
const trophies = doc.trophies;
const earnable = trophies.filter((t) => t.id !== PLATINUM_ID);

let earned = new Set();
try {
  earned = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
} catch {
  earned = new Set();
}
// Per-card spoiler reveals (this session only): peeking at one trophy without
// turning spoilers off for the whole list.
const revealed = new Set();

function syncPlatinum() {
  // Two-way sync: the Platinum is earned exactly when all other 54 are.
  if (earnable.every((t) => earned.has(t.id))) earned.add(PLATINUM_ID);
  else earned.delete(PLATINUM_ID);
}
syncPlatinum();

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveAndRender() {
  syncPlatinum();
  saveProgress();
  render();
}

function spoilerHidden(t) {
  return spoilerEl.checked && t.secret && !earned.has(t.id) && !revealed.has(t.id);
}

function trophyMatches(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    // A locked spoiler trophy must not be findable by its hidden content.
    if (spoilerHidden(t)) return false;
    if (!(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
  }
  const kind = kindEl.value;
  if (kind === 'missable' && !t.missable) return false;
  if (kind === 'online') return false;
  if (kind !== 'all' && kind !== 'missable' && kind !== 'online' && t.kind !== kind) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (hideEarnedEl.checked && earned.has(t.id)) return false;
  return true;
}

const GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
function sortedShown(list) {
  const arr = [...list];
  if (sortEl.value === 'grade') arr.sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.id - b.id);
  else if (sortEl.value === 'unearned') arr.sort((a, b) => Number(earned.has(a.id)) - Number(earned.has(b.id)) || a.id - b.id);
  else arr.sort((a, b) => a.id - b.id);
  return arr;
}

function badge(text, cls) {
  const s = document.createElement('span');
  s.className = 'badge ' + cls;
  s.textContent = text;
  return s;
}

function stageProgress(stage) {
  const ids = trophies.filter(stage.match);
  return { done: ids.filter((t) => earned.has(t.id)).length, total: ids.length };
}

function renderRoadmap() {
  const ol = document.getElementById('roadmap');
  ol.replaceChildren();
  STAGES.forEach((stage, i) => {
    const { done, total } = stageProgress(stage);
    const li = document.createElement('li');
    li.className = 'roadmap-stage';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stage-btn' + (i === 0 ? ' stage-first' : '') + (activeStage === i ? ' stage-active' : '');
    btn.setAttribute('aria-label', `Filter checklist to ${stage.title}: ${done} of ${total} earned`);
    const head = document.createElement('span');
    head.className = 'stage-head';
    const strong = document.createElement('strong');
    strong.textContent = stage.title;
    const prog = document.createElement('span');
    prog.className = 'stage-progress';
    prog.textContent = `${done} / ${total} earned`;
    head.append(strong, prog);
    const bar = document.createElement('span');
    bar.className = 'stage-bar';
    const fill = document.createElement('span');
    fill.className = 'stage-fill';
    fill.style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
    bar.append(fill);
    const text = document.createElement('span');
    text.className = 'stage-text';
    text.textContent = stage.text;
    btn.append(head, bar, text);
    btn.addEventListener('click', () => applyStageFilter(i, stage.filter));
    li.append(btn);
    ol.append(li);
  });
  // Final row: the Platinum itself — automatic, not played as a stage.
  const li = document.createElement('li');
  li.className = 'roadmap-stage';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'stage-btn stage-platinum' + (activeStage === 'platinum' ? ' stage-active' : '');
  const others = earnable.filter((t) => earned.has(t.id)).length;
  btn.setAttribute('aria-label', `Platinum: ${others} of 54 other trophies earned`);
  const head = document.createElement('span');
  head.className = 'stage-head';
  const strong = document.createElement('strong');
  strong.textContent = 'Final — The Platinum (automatic)';
  const prog = document.createElement('span');
  prog.className = 'stage-progress';
  prog.textContent = `${others} / 54 toward Platinum`;
  head.append(strong, prog);
  const bar = document.createElement('span');
  bar.className = 'stage-bar';
  const fill = document.createElement('span');
  fill.className = 'stage-fill';
  fill.style.width = `${Math.round((others / 54) * 100)}%`;
  bar.append(fill);
  const text = document.createElement('span');
  text.className = 'stage-text';
  text.textContent = 'Vice Got a Price! is not earned by a task of its own: it unlocks automatically the moment the other 54 trophies are all earned (54 + 1 Platinum = 55), and this tracker ticks it for you.';
  btn.append(head, bar, text);
  btn.addEventListener('click', () => applyStageFilter('platinum', { grade: 'platinum' }));
  li.append(btn);
  ol.append(li);
  document.getElementById('missableAlertText').textContent = MISSABLE_TEXT;
}

function renderProgress() {
  const done = trophies.filter((t) => earned.has(t.id));
  const points = done.reduce((sum, t) => sum + t.points, 0);
  progressTextEl.textContent = `${earned.size} of ${trophies.length} earned`;
  progressPointsEl.textContent = `${points.toLocaleString('en-US')} / ${TOTAL_POINTS.toLocaleString('en-US')} points`;
  progressFillEl.style.width = `${Math.round((earned.size / trophies.length) * 100)}%`;
  document.getElementById('stickyProgressText').textContent = progressTextEl.textContent;
  document.getElementById('stickyPointsText').textContent = progressPointsEl.textContent;
  document.getElementById('stickyProgressFill').style.width = progressFillEl.style.width;
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => earned.has(t.id)).length;
    document.getElementById('dash' + g[0].toUpperCase() + g.slice(1)).textContent = `${got} / ${all.length}`;
  }
  const miss = trophies.filter((t) => t.missable);
  const missGot = miss.filter((t) => earned.has(t.id)).length;
  document.getElementById('dashMissable').textContent = `${missGot} / ${miss.length} earned`;
  const others = earnable.filter((t) => earned.has(t.id)).length;
  document.getElementById('dashPlatProgress').textContent = `${others} / 54`;
}

function sourceLinks(sources) {
  const p = document.createElement('p');
  p.className = 'guide-sources';
  p.append('Sources: ');
  sources.forEach((name, i) => {
    if (i > 0) p.append(' · ');
    const url = SOURCE_URLS[name];
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = name;
      p.append(a);
    } else {
      p.append(name);
    }
  });
  return p;
}

function renderList() {
  listEl.replaceChildren();
  const shown = sortedShown(trophies.filter(trophyMatches));
  if (kindEl.value === 'online') {
    emptyStateEl.hidden = false;
    emptyStateEl.textContent =
      'No online trophies in this list — all 55 GTA VI trophies are earned in single-player, so the Online filter is empty by design.';
  } else if (shown.length === 0) {
    emptyStateEl.hidden = false;
    emptyStateEl.textContent = 'No trophies match these filters. Clear the search or choose another kind or grade.';
  } else {
    emptyStateEl.hidden = true;
  }
  filterCountEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
  for (const t of shown) {
    const hidden = spoilerHidden(t);
    const li = document.createElement('li');
    li.className = 'trophy' + (earned.has(t.id) ? ' earned' : '') + (hidden ? ' locked' : '');
    li.dataset.trophyId = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    if (t.id === PLATINUM_ID) {
      box.disabled = true;
      box.title = 'Automatic: ticks itself when the other 54 trophies are earned';
      box.setAttribute('aria-label', 'Platinum — automatic, earned when the other 54 trophies are complete');
    } else if (hidden) {
      box.setAttribute('aria-label', 'Mark hidden trophy as earned');
    } else {
      box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    }
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      saveAndRender();
    });

    const main = document.createElement('div');
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const name = document.createElement('h3');
    name.className = 'trophy-name' + (earned.has(t.id) ? ' earned-name' : '');
    if (hidden) {
      name.textContent = 'Hidden trophy';
      name.classList.add('hidden-name');
      head.append(name);
      head.append(badge('Hidden', 'secret-tag'));
    } else {
      name.textContent = t.name;
      head.append(name);
      head.append(badge(t.grade, t.grade));
      head.append(badge(`${t.points} pts`, 'points'));
      if (t.missable) head.append(badge('Missable', 'missable'));
      if (!t.confirmed) head.append(badge('UNCONFIRMED AT LAUNCH', 'unconfirmed'));
      if (t.secret) head.append(badge('Secret', 'secret-tag'));
    }

    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = hidden
      ? 'Hidden on PlayStation until earned. Its name, description, guide and sources stay locked while spoilers are hidden.'
      : `“${t.description}”`;
    main.append(head, desc);

    if (!hidden) {
      const meta = document.createElement('p');
      meta.className = 'trophy-meta';
      const kindLabel = t.id === PLATINUM_ID ? 'Platinum' : t.kind === 'story' ? 'Story' : t.kind === 'collectible' ? 'Collectible' : 'Activity';
      meta.textContent = kindLabel + (t.chapter ? ' · ' + t.chapter : '') + (t.missable ? ' · Can be missed' : '');
      main.append(meta);
    }

    if (t.id === PLATINUM_ID) {
      const prog = document.createElement('p');
      prog.className = 'plat-progress-line';
      const others = earnable.filter((x) => earned.has(x.id)).length;
      prog.textContent = earned.has(PLATINUM_ID)
        ? 'Platinum earned — all 54 other trophies complete. Congratulations, Leonida Legend!'
        : `Platinum progress: ${others} / 54 other trophies earned. This trophy ticks itself automatically when all 54 are complete.`;
      main.append(prog);
    }

    const details = document.createElement('details');
    if (params.get('open') === String(t.id) && !hidden) details.open = true;
    const summary = document.createElement('summary');
    summary.textContent = hidden ? 'Guide — locked' : 'Guide';
    details.append(summary);
    if (hidden) {
      const locked = document.createElement('p');
      locked.className = 'guide-text';
      locked.textContent = 'Guide locked while “Hide story spoilers” is on. Reveal this one trophy below, earn it in game, or turn spoilers off to read it.';
      details.append(locked);
    } else {
      const guide = document.createElement('p');
      guide.className = 'guide-text';
      guide.textContent = t.guide;
      details.append(guide, sourceLinks(t.sources));
    }
    main.append(details);

    if (spoilerEl.checked && t.secret && !earned.has(t.id)) {
      const revealBtn = document.createElement('button');
      revealBtn.type = 'button';
      revealBtn.className = 'reveal-btn';
      if (revealed.has(t.id)) {
        revealBtn.textContent = 'Hide this trophy again';
        revealBtn.addEventListener('click', () => { revealed.delete(t.id); render(); });
      } else {
        revealBtn.textContent = 'Reveal this trophy';
        revealBtn.addEventListener('click', () => { revealed.add(t.id); render(); });
      }
      main.append(revealBtn);
    }

    li.append(box, main);
    listEl.append(li);
  }
}

function render() {
  renderProgress();
  renderRoadmap();
  renderList();
}

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
  importStatusEl.textContent = `Exported ${earned.size} earned trophies to gta6-trophy-progress.json.`;
  importStatusEl.className = 'import-status ok';
});

document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    const valid = new Set(trophies.map((t) => t.id));
    const clean = ids.filter((id) => valid.has(id));
    earned = new Set(clean);
    saveAndRender();
    importStatusEl.textContent = `Import OK: ${clean.length} earned trophies loaded from ${file.name}.`;
    importStatusEl.className = 'import-status ok';
  } catch {
    importStatusEl.textContent = 'Import failed: that file is not valid trophy progress JSON. Your current progress was not changed.';
    importStatusEl.className = 'import-status error';
  }
  event.target.value = '';
});

const resetBtn = document.getElementById('resetBtn');
let resetArmed = false;
let resetTimer = null;
resetBtn.addEventListener('click', () => {
  if (!resetArmed) {
    resetArmed = true;
    resetBtn.textContent = 'Click again to confirm reset';
    resetBtn.classList.add('armed');
    importStatusEl.textContent = 'Reset armed: click “Click again to confirm reset” to clear all earned trophies, or wait to cancel.';
    importStatusEl.className = 'import-status error';
    resetTimer = setTimeout(() => {
      resetArmed = false;
      resetBtn.textContent = 'Reset progress';
      resetBtn.classList.remove('armed');
    }, 5000);
    return;
  }
  clearTimeout(resetTimer);
  resetArmed = false;
  resetBtn.textContent = 'Reset progress';
  resetBtn.classList.remove('armed');
  earned = new Set();
  revealed.clear();
  saveAndRender();
  importStatusEl.textContent = 'Progress reset: all earned trophies cleared.';
  importStatusEl.className = 'import-status ok';
});

document.getElementById('expandBtn').addEventListener('click', () => {
  listEl.querySelectorAll('details').forEach((d) => { d.open = true; });
});
document.getElementById('collapseBtn').addEventListener('click', () => {
  listEl.querySelectorAll('details').forEach((d) => { d.open = false; });
});

for (const el of [searchEl, kindEl, gradeEl, sortEl, spoilerEl, hideEarnedEl]) {
  el.addEventListener('input', () => {
    if ((el === kindEl || el === gradeEl) && !applyingStageFilter && activeStage !== null) {
      activeStage = null;
      setStageBanner();
      renderRoadmap();
    }
    renderList();
  });
  el.addEventListener('change', render);
}

render();
syncStickyBar();
}
main();
