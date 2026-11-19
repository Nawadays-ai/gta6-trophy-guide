// Road to the Platinum — GTA VI trophy guide and tracker.
// Static, offline, no dependencies: loads only data/trophies.json from its own folder,
// saves checklist progress in localStorage, and can export/import that progress.
const STORAGE_KEY = 'gta6-trophy-tracker-v1';
const TOTAL_POINTS = 1350;

const ROADMAP = [
  {
    stage: 'Stage 1 — Play the story',
    text: 'Chapters 1–4, then the finale. The 21 story trophies pop in order as missions complete, including the chapter trophies and the gold for the final mission. Nothing here needs a special setup — just play.',
    count: '21 trophies',
  },
  {
    stage: 'Stage 2 — Do the missable trophy FIRST',
    text: 'Positive Mental Attitude (meditate at every spot) is the only missable trophy: the Chapter 1 meditation spot on Lucia’s balcony is gone after Chapter 1 ends. Clear it before the chapter closes.',
    count: '1 trophy — missable',
  },
  {
    stage: 'Stage 3 — Strangers and side strands',
    text: 'Finish the stranger mission strands (Andy, Kenton, Billy, Randy, Tyrone and more) until Strangers & Freaks pops at 8 completed strands, plus Bret’s hunt for Fair Game.',
    count: '7 trophies',
  },
  {
    stage: 'Stage 4 — Collectibles and exploration',
    text: 'Card sets, WAiNK spots, vehicles discovered and full map coverage. These are long counters, so start them during the story and finish them in free roam after the finale.',
    count: '5 trophies',
  },
  {
    stage: 'Stage 5 — Activities, challenges and money',
    text: 'Races, drone races, the shooting range, stunts, robberies, challenges and the money trophies (laundering, spending, garages). Do the 5 unconfirmed hidden trophies last, once the community verifies how they trigger.',
    count: '21 trophies',
  },
];

const MISSABLE_TEXT =
  'Positive Mental Attitude is missable: meditate at every spot across Leonida, and do the Chapter 1 spot (Lucia’s balcony) before Chapter 1 ends — it disappears after that chapter.';

const params = new URLSearchParams(location.search);
const listEl = document.getElementById('trophyList');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoiler');
const hideEarnedEl = document.getElementById('hideEarned');
const progressTextEl = document.getElementById('progressText');
const progressPointsEl = document.getElementById('progressPoints');
const progressFillEl = document.getElementById('progressFill');
const filterCountEl = document.getElementById('filterCount');
const emptyStateEl = document.getElementById('emptyState');

if (params.get('kind')) kindEl.value = params.get('kind');
if (params.get('grade')) gradeEl.value = params.get('grade');
if (params.get('spoiler') === '1') spoilerEl.checked = true;

let earned = new Set();
try {
  earned = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
} catch {
  earned = new Set();
}

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveAndRender() {
  saveProgress();
  render();
}

function trophyMatches(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
  const kind = kindEl.value;
  if (kind === 'missable' && !t.missable) return false;
  if (kind === 'online') return false;
  if (kind !== 'all' && kind !== 'missable' && kind !== 'online' && t.kind !== kind) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (hideEarnedEl.checked && earned.has(t.id)) return false;
  return true;
}

function spoilerHidden(t) {
  return spoilerEl.checked && t.secret && !earned.has(t.id);
}

function badge(text, cls) {
  const s = document.createElement('span');
  s.className = 'badge ' + cls;
  s.textContent = text;
  return s;
}

function renderRoadmap() {
  const ol = document.getElementById('roadmap');
  ol.replaceChildren();
  for (const step of ROADMAP) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = step.stage + ' ';
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = '(' + step.count + ')';
    li.append(strong, count, document.createTextNode(' — ' + step.text));
    ol.append(li);
  }
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
}

function renderList() {
  listEl.replaceChildren();
  const shown = trophies.filter(trophyMatches);
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
    const li = document.createElement('li');
    li.className = 'trophy' + (earned.has(t.id) ? ' earned' : '');
    li.dataset.trophyId = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
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
    if (spoilerHidden(t)) {
      name.textContent = 'Hidden trophy';
      name.classList.add('hidden-name');
    } else {
      name.textContent = t.name;
    }
    head.append(name);
    head.append(badge(t.grade, t.grade));
    head.append(badge(`${t.points} pts`, 'points'));
    if (t.missable) head.append(badge('Missable', 'missable'));
    if (!t.confirmed) head.append(badge('Unconfirmed', 'unconfirmed'));
    if (t.secret) head.append(badge('Secret', 'secret-tag'));

    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = spoilerHidden(t)
      ? 'Hidden on PlayStation until earned. Turn off “Hide story spoilers” to reveal it, or earn it in game.'
      : `“${t.description}”`;

    const meta = document.createElement('p');
    meta.className = 'trophy-meta';
    const kindLabel = t.kind === 'story' ? 'Story' : t.kind === 'collectible' ? 'Collectible' : 'Activity';
    meta.textContent = kindLabel + (t.chapter ? ' · ' + t.chapter : '') + (t.missable ? ' · Can be missed' : '');

    const details = document.createElement('details');
    if (params.get('open') === String(t.id)) details.open = true;
    const summary = document.createElement('summary');
    summary.textContent = 'Guide';
    const guide = document.createElement('p');
    guide.className = 'guide-text';
    guide.textContent = spoilerHidden(t)
      ? 'Guide hidden with the spoiler setting.'
      : t.guide;
    const sources = document.createElement('p');
    sources.className = 'guide-sources';
    sources.textContent = 'Sources: ' + t.sources.join(' · ');
    details.append(summary, guide, sources);

    main.append(head, desc, meta, details);
    li.append(box, main);
    listEl.append(li);
  }
}

function render() {
  renderProgress();
  renderList();
}

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    const valid = new Set(trophies.map((t) => t.id));
    earned = new Set(ids.filter((id) => valid.has(id)));
    saveAndRender();
  } catch {
    alert('That file could not be imported as trophy progress.');
  }
  event.target.value = '';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies in this tracker?')) {
    earned = new Set();
    saveAndRender();
  }
});

for (const el of [searchEl, kindEl, gradeEl, spoilerEl, hideEarnedEl]) {
  el.addEventListener('input', renderList);
  el.addEventListener('change', renderList);
}

renderRoadmap();
render();
