// Road to the Platinum — GTA VI trophy guide and tracker (Dark Leonida Ledger).
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

// The four sources every step citation points at. The app itself loads
// nothing from the network: these anchors only open if a reader clicks them.
const SOURCE_URLS = {
  Exophase: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  PowerPyx: 'https://www.powerpyx.com/grand-theft-auto-vi-gta-6-trophy-guide-roadmap/',
  'Push Square': 'https://www.pushsquare.com/guides/gta-6-trophy-guide-all-trophies-and-how-to-get-the-platinum',
  PSNProfiles: 'https://psnprofiles.com/trophies/grand-theft-auto-vi',
};
const SOURCE_BLURB = {
  Exophase: 'the official trophy list as PlayStation publishes it — names, descriptions, grades and counts',
  PowerPyx: 'trophy guide and roadmap — methods, order and cleanup strategy',
  'Push Square': 'trophy guide — methods and explanations in plain language',
  PSNProfiles: 'trophy list cross-check — grades, rarity and ordering',
};
const SOURCE_ORDER = ['Exophase', 'PowerPyx', 'Push Square', 'PSNProfiles'];

const CUP = 'M5 3h14v2h3v3a5 5 0 0 1-5 5h-.42A6 6 0 0 1 13 15.92V18h3v3H8v-3h3v-2.08A6 6 0 0 1 7.42 13H7a5 5 0 0 1-5-5V5h3V3zm-1 4v1a3 3 0 0 0 3 3V7H4zm16 0h-3v4a3 3 0 0 0 3-3V7z';
const LOCK = 'M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z';
const GRADE_DOT = { platinum: '#7DE9FF', gold: '#FFC44D', silver: '#D7DEE8', bronze: '#E09A6C' };
const GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const STAGE_ORDER = { 1: 0, 2: 1, 3: 2, 4: 3, platinum: 4 };
const STAGE_NAMES = {
  1: 'Stage 1 · Missable Checkpoint',
  2: 'Stage 2 · Story',
  3: 'Stage 3 · Collectibles',
  4: 'Stage 4 · Activities',
  platinum: 'Final · Auto-Platinum',
};
const KIND_LABEL = { story: 'Story', collectible: 'Collectible', activity: 'Activity' };

const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const listEl = $('trophyList'), searchEl = $('search'), gradeEl = $('grade'), sortEl = $('sort');
const spoilerEl = $('spoiler'), hideEarnedEl = $('hideEarned'), inspectorEl = $('inspector');
const emptyStateEl = $('emptyState'), filterCountEl = $('filterCount'), ledgerEl = $('ledgerCard');
const platPinEl = $('platPin'), importStatusEl = $('importStatus');

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function cupIcon(grade, big) {
  return `<svg class="trophy-icon" viewBox="0 0 24 24" aria-hidden="true" ${big ? 'width="34" height="34"' : ''}><path class="gi-${grade}" d="${CUP}"/></svg>`;
}
function badge(text, cls) { return `<span class="badge ${cls}">${esc(text)}</span>`; }
function citeChips(cites) { return cites.map((c) => `<span class="cite">[${esc(c)}]</span>`).join(''); }

// This is a classic script (not an ES module) on purpose: module scripts are
// blocked by CORS under file:// in Chrome, classic scripts are not.
async function main() {
  let doc = null;
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    try {
      const res = await fetch('data/trophies.json');
      if (res.ok) doc = await res.json();
    } catch { doc = null; }
  }
  if (!doc && window.TROPHIES_DATA) doc = window.TROPHIES_DATA;
  if (!doc) {
    emptyStateEl.hidden = false;
    emptyStateEl.textContent = 'Trophy data could not be loaded. Serve this folder with node serve.ts or reopen index.html from the app folder.';
    throw new Error('trophy data unavailable');
  }
  const trophies = doc.trophies;
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const earnable = trophies.filter((t) => t.id !== PLATINUM_ID);
  const unconfirmed = trophies.filter((t) => !t.confirmed);
  const totalSteps = trophies.reduce((n, t) => n + (t.steps ? t.steps.length : 0), 0);
  const totalCites = trophies.reduce((n, t) => n + (t.steps ? t.steps.reduce((m, s) => m + s.cites.length, 0) : 0), 0);
  $('citedSteps').textContent = `${totalSteps} Cited Steps · ${totalCites} Citations`;
  document.title = 'Road to the Platinum — GTA VI Trophy Ledger';

  let earned = new Set();
  try { earned = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')); } catch { earned = new Set(); }
  const revealed = new Set();
  let selectedId = null;
  let activeStage = null; // 1..4, 'platinum', or null
  let kind = 'all';
  let view = 'tracker';

  function syncPlatinum() {
    if (earnable.every((t) => earned.has(t.id))) earned.add(PLATINUM_ID);
    else earned.delete(PLATINUM_ID);
  }
  syncPlatinum();
  function saveProgress() { localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b))); }
  function saveAndRender() { syncPlatinum(); saveProgress(); render(); }

  function spoilerHidden(t) { return spoilerEl.checked && t.secret && !earned.has(t.id) && !revealed.has(t.id); }
  function displayName(t) { return spoilerHidden(t) ? 'Hidden trophy' : t.name; }
  function inStage(t, key) { return key === 'platinum' ? t.id === PLATINUM_ID : t.stage === key; }
  function stageProgress(key) {
    const ids = trophies.filter((t) => inStage(t, key));
    return { done: ids.filter((t) => earned.has(t.id)).length, total: ids.length };
  }

  function trophyMatches(t) {
    const q = searchEl.value.trim().toLowerCase();
    if (q) {
      if (spoilerHidden(t)) return false;
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + (t.steps ? t.steps.map((s) => s.text).join(' ') : '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (activeStage !== null) {
      if (!inStage(t, activeStage)) return false;
    } else if (kind === 'missable') {
      if (!t.missable) return false;
    } else if (kind === 'online') {
      return false;
    } else if (kind === 'story') {
      if (!(t.kind === 'story' && t.id !== PLATINUM_ID)) return false;
    } else if (kind !== 'all') {
      if (t.kind !== kind) return false;
    }
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (hideEarnedEl.checked && earned.has(t.id)) return false;
    return true;
  }

  function sortedShown(list) {
    const arr = [...list];
    const v = sortEl.value;
    if (v === 'order') arr.sort((a, b) => a.id - b.id);
    else if (v === 'grade') arr.sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.id - b.id);
    else if (v === 'unearned') arr.sort((a, b) => Number(earned.has(a.id)) - Number(earned.has(b.id)) || a.id - b.id);
    else arr.sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || a.id - b.id);
    return arr;
  }

  /* ---------------- header / progress ---------------- */
  function renderProgress() {
    const done = trophies.filter((t) => earned.has(t.id));
    const points = done.reduce((s, t) => s + t.points, 0);
    $('progressText').textContent = `${earned.size} / ${trophies.length}`;
    $('progressPoints').textContent = `${points.toLocaleString('en-US')} / ${TOTAL_POINTS.toLocaleString('en-US')} pts`;
    $('progressFill').style.width = `${Math.round((earned.size / trophies.length) * 100)}%`;
    for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
      const all = trophies.filter((t) => t.grade === g);
      $('kpi' + g[0].toUpperCase() + g.slice(1)).textContent = `${all.filter((t) => earned.has(t.id)).length}/${all.length}`;
    }
    const miss = trophies.filter((t) => t.missable);
    $('kpiMissable').textContent = `${miss.filter((t) => earned.has(t.id)).length}/${miss.length}`;
  }

  /* ---------------- tracker list ---------------- */
  function platPinVisible() {
    return kind === 'all' && activeStage === null && gradeEl.value === 'all' && !hideEarnedEl.checked
      && !spoilerEl.checked && !searchEl.value.trim();
  }
  function renderPlatPin() {
    const t = byId.get(PLATINUM_ID);
    const others = earnable.filter((x) => earned.has(x.id)).length;
    platPinEl.hidden = !platPinVisible();
    if (platPinEl.hidden) return;
    platPinEl.className = 'plat-pin' + (selectedId === PLATINUM_ID ? ' selected' : '');
    platPinEl.innerHTML = `${cupIcon('platinum')}
      <div><div class="pp-name">${esc(t.name)} — the Platinum</div>
      <div class="pp-sub">Unlocks automatically when the other 54 trophies are earned · 300 pts</div></div>
      <div class="pp-bar"><div class="pp-fill" style="width:${Math.round((others / 54) * 100)}%"></div></div>
      <span class="pp-count">${others} / 54</span>`;
  }

  function rowHtml(t) {
    const isEarned = earned.has(t.id);
    if (spoilerHidden(t)) {
      return `<li class="trophy locked${selectedId === t.id ? ' selected' : ''}" data-id="${t.id}">
        <input type="checkbox" data-earn="${t.id}" ${isEarned ? 'checked' : ''} aria-label="Mark hidden trophy as earned">
        <div class="t-main">
          <div class="trophy-head"><svg class="trophy-icon" viewBox="0 0 24 24" aria-hidden="true"><path class="gi-silver" d="${LOCK}"/></svg>
          <h3 class="trophy-name hidden-name">Hidden trophy</h3>${badge('Hidden', 'b-hidden')}</div>
          <p class="trophy-desc">Hidden on PlayStation until earned. Its name, description, guide and sources stay locked while spoilers are hidden — search cannot find it either.</p>
          <button type="button" class="reveal-btn" data-reveal="${t.id}">Reveal this trophy</button>
        </div></li>`;
    }
    const kindLabel = t.id === PLATINUM_ID ? 'Platinum' : KIND_LABEL[t.kind];
    const badges = badge(t.grade, 'b-' + t.grade) + badge(`${t.points} pts`, 'b-points')
      + (t.missable ? badge('Missable', 'b-missable') : '')
      + (t.secret ? badge('Secret', 'b-secret') : '')
      + (!t.confirmed ? badge('Unconfirmed at launch', 'b-unconfirmed') : '');
    return `<li class="trophy${isEarned ? ' earned' : ''}${selectedId === t.id ? ' selected' : ''}" data-id="${t.id}">
      <input type="checkbox" data-earn="${t.id}" ${isEarned ? 'checked' : ''} ${t.id === PLATINUM_ID ? 'disabled title="Automatic: ticks itself when the other 54 trophies are earned"' : ''} aria-label="Mark ${esc(t.name)} as earned">
      <div class="t-main">
        <div class="trophy-head">${cupIcon(t.grade)}<h3 class="trophy-name${isEarned ? ' earned-name' : ''}">${esc(t.name)}</h3>${badges}</div>
        <p class="trophy-desc">“${esc(t.description)}”</p>
        <p class="trophy-meta"><span>${kindLabel}${t.chapter ? ' · ' + esc(t.chapter) : ''}</span><span>${STAGE_NAMES[t.stage]}</span>${t.missable ? '<span>Can be missed</span>' : ''}</p>
      </div></li>`;
  }

  function ledgerHtml() {
    const srcItems = SOURCE_ORDER.map((n) => `<li><a href="${SOURCE_URLS[n]}" target="_blank" rel="noopener noreferrer">${n}</a> — ${esc(SOURCE_BLURB[n])}</li>`).join('');
    const unc = spoilerEl.checked
      ? '<p>5 trophies in this list are badged UNCONFIRMED AT LAUNCH; their names stay locked while spoilers are hidden.</p>'
      : `<ul>${unconfirmed.map((t) => `<li>${esc(t.name)}</li>`).join('')}</ul>`;
    return `<h3>Sources, Citation Ledger &amp; Launch Notes</h3>
      <p>Every guide in this ledger is written in our own words and cites its sources step by step: <strong>${totalSteps} steps</strong>, <strong>${totalCites} cited statements</strong> across the 4 linked sources.</p>
      <h4>The 4 linked sources</h4><ul>${srcItems}</ul>
      <h4>Unconfirmed at launch — 5 trophies</h4>${unc}
      <p><strong>Online: 0 trophies.</strong> All 55 GTA VI trophies are earned in single-player, so the Online filter is empty by design.</p>
      <p><strong>100% offline.</strong> This guide loads only its own files and makes no network request; the links above open only if you click them. No Rockstar Games logo, artwork or game screenshots are used anywhere in it.</p>`;
  }

  function renderList() {
    renderPlatPin();
    const shown = sortedShown(trophies.filter(trophyMatches));
    if (selectedId === null || !shown.some((t) => t.id === selectedId)) {
      selectedId = shown.length ? shown[0].id : null;
    }
    if (kind === 'online' && activeStage === null) {
      emptyStateEl.hidden = false;
      emptyStateEl.textContent = 'No online trophies in this list — all 55 GTA VI trophies are earned in single-player, so the Online filter is empty by design.';
    } else if (!shown.length) {
      emptyStateEl.hidden = false;
      emptyStateEl.textContent = 'No trophies match these filters. Clear the search or choose another kind or grade.';
    } else {
      emptyStateEl.hidden = true;
    }
    filterCountEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
    listEl.innerHTML = shown.map(rowHtml).join('');
    const shortList = shown.length > 0 && shown.length <= 3 && (kind !== 'all' || activeStage !== null || searchEl.value.trim());
    ledgerEl.hidden = !shortList;
    if (shortList) ledgerEl.innerHTML = ledgerHtml();
    renderInspector();
  }

  /* ---------------- inspector ---------------- */
  function renderInspector() {
    const t = selectedId !== null ? byId.get(selectedId) : null;
    if (!t) {
      inspectorEl.innerHTML = '<p class="insp-empty">No trophy selected. Loosen the filters to see the checklist again.</p>';
      return;
    }
    if (spoilerHidden(t)) {
      inspectorEl.innerHTML = `<div class="shield">
        <svg class="lock-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${LOCK}"/></svg>
        <h3>Spoiler Shield — Hidden Trophy</h3>
        <p>This trophy is secret on PlayStation and “Hide Story Spoilers” is on, so its name, description, steps, sources and metadata are completely locked — they are not in this panel, not in the checklist, and Search returns 0 results for it.</p>
        <p>This list also holds 5 trophies badged UNCONFIRMED AT LAUNCH; locked ones stay locked the same way until they are earned or revealed.</p>
        <button type="button" class="btn-big" data-act="reveal">Reveal this trophy</button>
      </div>`;
      return;
    }
    const isEarned = earned.has(t.id);
    const tags = badge(t.grade, 'b-' + t.grade) + badge(`${t.points} pts`, 'b-points')
      + badge(STAGE_NAMES[t.stage], 'b-points')
      + (t.missable ? badge('Missable', 'b-missable') : '')
      + (t.secret ? badge('Secret', 'b-secret') : '')
      + (!t.confirmed ? badge('Unconfirmed at launch', 'b-unconfirmed') : '');
    const banners = (t.missable ? '<div class="banner banner-missable">⚠ MISSABLE — CHAPTER 1 LOCKOUT: Lucia’s balcony meditation spot disappears when Chapter 1 ends — do it first.</div>' : '')
      + (!t.confirmed ? '<div class="banner banner-unconfirmed">UNCONFIRMED AT LAUNCH — NO INVENTED STEPS: the trigger was not verified on launch day (19 Nov 2026), so the steps below state what is known and where to check.</div>' : '');
    const steps = (t.steps || []).map((s) => `<li>${esc(s.text)}${citeChips(s.cites)}</li>`).join('');
    const citedNames = [...new Set((t.steps || []).flatMap((s) => s.cites))];
    const cited = citedNames.map((n) => `<a href="${SOURCE_URLS[n]}" target="_blank" rel="noopener noreferrer">${esc(n)}</a>`).join(' · ');
    const stepCount = (t.steps || []).length;
    const citeCount = (t.steps || []).reduce((n, s) => n + s.cites.length, 0);
    const facts = `<h3 class="insp-h">Unlock Facts</h3>
      <div class="facts">
        <div class="fact"><span class="fact-k">Missable</span><span class="fact-v">${t.missable ? 'Yes — Ch. 1 lockout' : 'No'}</span></div>
        <div class="fact"><span class="fact-k">Stage</span><span class="fact-v">${t.stage === 'platinum' ? 'Final' : `Stage ${t.stage}`}</span></div>
        <div class="fact"><span class="fact-k">Playthroughs</span><span class="fact-v">1 run</span></div>
        <div class="fact"><span class="fact-k">Cited Guides</span><span class="fact-v">${stepCount} steps · ${citeCount} citations</span></div>
      </div>`;
    const actions = t.id === PLATINUM_ID
      ? `<p class="guide-text">Platinum progress: ${earnable.filter((x) => earned.has(x.id)).length} / 54 other trophies earned. This checkbox ticks itself automatically — in both directions — the moment all 54 are complete.</p>`
      : `<div class="insp-actions"><button type="button" class="btn-big" data-act="toggle">${isEarned ? '✓ Earned — tap to undo' : 'Mark as earned'}</button>`
        + (spoilerEl.checked && t.secret && revealed.has(t.id) ? '<button type="button" class="btn-ghost" data-act="hide">Hide this trophy again</button>' : '')
        + '</div>';
    inspectorEl.innerHTML = `
      <div class="insp-head">${cupIcon(t.grade, true)}
        <div><h2 class="insp-name">${esc(t.name)}</h2><div class="insp-tags">${tags}</div></div>
      </div>
      <blockquote class="insp-desc">“${esc(t.description)}” — official PlayStation description</blockquote>
      ${banners}${actions}
      <h3 class="insp-h">The guide, in our own words</h3>
      <p class="guide-text">${esc(t.guide)}</p>
      <p class="guide-sources">Guide sources: ${citeChips(citedNames)}</p>
      <h3 class="insp-h">Steps, with a source on every step</h3>
      <ol class="steps">${steps}</ol>
      <div class="cited-sources"><strong>Cited Sources:</strong> ${cited}</div>
      ${facts}`;
  }

  inspectorEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-act]');
    if (!btn || selectedId === null) return;
    const t = byId.get(selectedId);
    if (btn.dataset.act === 'reveal') { revealed.add(t.id); render(); }
    if (btn.dataset.act === 'hide') { revealed.delete(t.id); render(); }
    if (btn.dataset.act === 'toggle') {
      if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
      saveAndRender();
    }
  });

  /* ---------------- roadmap ---------------- */
  function chipT(t, suffix) {
    const hidden = spoilerHidden(t);
    return `<span class="chip-t"><i style="color:${GRADE_DOT[t.grade]}">●</i>${esc(displayName(t))}${suffix && !hidden ? ' — ' + esc(suffix) : ''}</span>`;
  }
  function missionOf(t) { return t.description.replace(/^Complete /, '').replace(/\.$/, ''); }

  function renderRoadmap() {
    $('rmStrip').innerHTML =
      '<span class="rm-chip">54 Earnable + 1 Auto-Platinum</span>'
      + '<span class="rm-chip hot">1 Missable</span>'
      + '<span class="rm-chip">1 Playthrough</span>'
      + '<span class="rm-chip">0 Online</span>'
      + '<span class="rm-chip amber">5 Unconfirmed</span>';
    const T = (id) => byId.get(id);
    const spoilerOn = spoilerEl.checked;
    const chapters = spoilerOn
      ? 'Chapter 1 — the opening missions and the chapter completion · Chapter 2 — the chapter completion · Chapter 3 — the chapter completion · Chapter 4 — the chapter completion · Finale — the final mission (Gold)'
      : `Chapter 1 — ${esc(missionOf(T(2)))} (${esc(displayName(T(2)))}) &amp; ${esc(displayName(T(3)))} · Chapter 2 — ${esc(displayName(T(4)))} · Chapter 3 — ${esc(displayName(T(5)))} · Chapter 4 — ${esc(displayName(T(6)))} · Finale — ${esc(displayName(T(7)))} (Gold)`;
    const missions = [8, 9, 10, 11, 12, 13].map((id) => chipT(T(id), missionOf(T(id)))).join('');
    const strands = [22, 23, 24, 26, 27].map((id) => chipT(T(id))).join('') + chipT(T(25), '8 strands in total');
    const collect = [[30, 'complete 3 card sets'], [31, 'WAiNK at 100 locations'], [35, 'discover 100 vehicles'], [42, 'explore all of Leonida']]
      .map(([id, s]) => chipT(T(id), s)).join('');
    const groups = [
      ['Stunts & challenges', [[15, '250 stunts'], [32, '50 challenges'], [17, 'gold in all 42 Shooting Range challenges'], [36, '5 enemies in one Combat Focus'], [16, 'try every activity type once']]],
      ['Races', [[19, 'win 20 different races'], [18, 'a drone-race win at every location']]],
      ['Robberies & heists', [[40, 'rob 5 bank vaults and escape'], [41, 'rob an armored truck'], [39, 'jewelry store, undetected'], [34, '3 shops back-to-back with your partner'], [43, 'one illegal operation per gang']]],
      ['Partners, strangers & free roam', [[33, 'lose a 4-star wanted level with your partner'], [29, 'hunt a unique animal for Bret'], [20, 'beat Cal at fishing'], [21, 'complete an arcade game'], [37, 'unscheduled departure at VCIA'], [38, 'the Rhino tank'], [44, 'a cocktail with a view on Ocean Beach'], [45, 'smash out of a showroom'], [46, 'a full game at the Kolt & Associates bowling alley']]],
      ['Money', [[52, 'launder $250,000 of Marked Bills'], [53, 'spend $100,000 across all shops'], [54, 'purchase all garage properties'], [55, 'register 10 vehicles on the Scooter Bros app']]],
    ];
    const s4groups = groups.map(([label, items]) =>
      `<p><span class="grp">${label}:</span> ${items.map(([id, s]) => chipT(T(id), s)).join('')}</p>`).join('');
    const uncNames = unconfirmed.map((t) => esc(displayName(t))).join(' · ');
    const stageCard = (key, cls, title, body) => {
      const p = key === 'platinum'
        ? { done: earnable.filter((t) => earned.has(t.id)).length, total: 54 }
        : stageProgress(key);
      return `<div class="rm-stage ${cls}">
        <div class="rm-head"><strong>${title}</strong><span class="rm-prog">${p.done} / ${p.total} earned</span><button type="button" class="rm-btn" data-stage="${key}">Show these in the Tracker <svg class="rm-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h12.2l-4.6-4.6L13 5l7 7-7 7-1.4-1.4 4.6-4.6H4z"/></svg></button></div>
        <div class="rm-bar"><div class="rm-fill" style="width:${p.total ? Math.round((p.done / p.total) * 100) : 0}%"></div></div>
        <div class="rm-body">${body}</div>
      </div>`;
    };
    $('roadmapStages').innerHTML =
      stageCard(1, 's1', 'Stage 1 — Missable Checkpoint FIRST (Before Chapter 1 Ends)',
        `<p>One trophy can be lost for good, so it comes before everything else: ${chipT(T(28), 'meditate at every spot — the Chapter 1 spot is on Lucia’s balcony')} ${citeChips(['Exophase', 'PowerPyx'])} Meditate at Lucia’s balcony spot <strong>before</strong> you complete Chapter 1. The spot disappears when the chapter ends; every other meditation spot across Leonida can be done as you reach it.</p>`)
      + stageCard(2, 's2', 'Stage 2 — Play the Story (20 Trophies)',
        `<p><span class="grp">Chapters, from the official descriptions</span> ${citeChips(['Exophase'])}: ${chapters}</p>
         <p><span class="grp">Named story missions:</span> ${missions} <span class="grp">Stranger finales:</span> ${strands}</p>
         <p>Two Golds: <strong>${spoilerOn ? 'the finale Gold' : 'You Gotta Know When to Get Off'}</strong> (the final mission) finishes here in Stage 2; <strong>A Long Road</strong> (100% Completion) is listed here but only completes later, in Stage 4 cleanup.</p>`)
      + stageCard(3, 's3', 'Stage 3 — Collectibles & Exploration (4 Trophies)',
        `<p>${collect} ${citeChips(['Exophase'])}</p>
         <p>Every collectible and its count above is exactly as the official descriptions state them. These are long counters — start them during the story and finish in free roam. (The fifth collectible-kind trophy, the missable meditation trophy, is counted in Stage 1.)</p>`)
      + stageCard(4, 's4', 'Stage 4 — Activities, Strangers, Challenges & Money (29 Trophies)',
        `<div class="rm-cols">${s4groups}</div>
         <div class="rm-unconf"><strong>UNCONFIRMED AT LAUNCH — 5 trophies:</strong> ${uncNames}. Their triggers were not verified on launch day (19 Nov 2026); do them last, once the cited guides confirm how they work. (One of the five is a story trophy, counted in Stage 2’s partition.)</div>`)
      + stageCard('platinum', 'final', 'Final — Auto-Platinum: Vice Got a Price!',
        `<p>${chipT(T(1), 'the Platinum')} There is no task for this one: it unlocks automatically the moment the other 54 trophies are all earned — 54 earnable + 1 Platinum = 55 — and this tracker ticks it for you, in both directions.</p>`);
    $('missableAlertText').textContent = MISSABLE_TEXT;
  }

  /* ---------------- sources view ---------------- */
  function renderSources() {
    const perSource = {};
    for (const n of SOURCE_ORDER) perSource[n] = 0;
    for (const t of trophies) for (const s of t.steps || []) for (const c of s.cites) perSource[c]++;
    const stats = `<span class="rm-chip">55 Trophies</span><span class="rm-chip">55/55 Guides</span>`
      + `<span class="rm-chip">${totalSteps} Steps</span><span class="rm-chip">${totalCites} Cited Statements</span>`
      + SOURCE_ORDER.map((n) => `<span class="rm-chip">${n}: ${perSource[n]} cites</span>`).join('');
    const srcList = SOURCE_ORDER.map((n) => `<li><a href="${SOURCE_URLS[n]}" target="_blank" rel="noopener noreferrer">${n}</a> — ${esc(SOURCE_BLURB[n])}</li>`).join('');
    const unc = spoilerEl.checked
      ? '<p>5 trophies are badged UNCONFIRMED AT LAUNCH. Their names stay locked in this list while “Hide Story Spoilers” is on; turn spoilers off to see them here.</p>'
      : `<ul>${unconfirmed.map((t) => `<li><strong>${esc(t.name)}</strong> — “${esc(t.description)}”</li>`).join('')}</ul>`;
    $('sourcesBody').innerHTML = `
      <div class="src-card"><h2>Sources &amp; how this guide was written</h2>
        <p>Trophy names, descriptions and grades are as PlayStation publishes them, from the official list recorded by Exophase. Every guide and every step in this ledger is written in our own words for this entry — a source is cited, never copied. Each of the 55 trophies carries a numbered step list, and every step names the source its facts are tracked against.</p>
        <div class="src-stats">${stats}</div>
        <h3>The 4 linked sources</h3><ul>${srcList}</ul>
      </div>
      <div class="src-card"><h2>Launch Notes</h2>
        <h3>Unconfirmed at launch — 5 trophies</h3>${unc}
        <p>For these five, the official descriptions do not pin down a verified trigger, so this guide says so plainly instead of inventing steps: their step lists state the launch-day status (19 Nov 2026), explain the official context, and point to the tracker guides above for a confirmed method.</p>
        <h3>Online: 0 trophies</h3>
        <p>There are no online trophies in this list — all 55 are earned in single-player, so the Online kind filter in the Tracker is empty by design.</p>
        <h3>Offline &amp; originality guarantee</h3>
        <p>This guide works 100% offline: it loads only its own local files and makes no network request when it runs — the source links open only if you click them. It uses no Rockstar Games logo, no official artwork or box art, and no screenshots of the game; every icon is an original vector drawn for this ledger.</p>
      </div>`;
  }

  /* ---------------- stage filter & views ---------------- */
  function setStageBanner() {
    const banner = $('filterBanner');
    if (activeStage === null) { banner.hidden = true; return; }
    $('filterBannerText').textContent = activeStage === 'platinum' ? 'Final — Auto-Platinum (Vice Got a Price!)' : STAGE_NAMES[activeStage];
    banner.hidden = false;
  }
  function applyStageFilter(key) {
    if (activeStage === key) { clearStageFilter(); return; }
    activeStage = key;
    kind = 'all';
    setStageBanner();
    render();
  }
  function clearStageFilter() { activeStage = null; setStageBanner(); render(); }
  $('filterBannerClear').addEventListener('click', clearStageFilter);
  $('roadmapStages').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-stage]');
    if (!btn) return;
    const key = btn.dataset.stage === 'platinum' ? 'platinum' : Number(btn.dataset.stage);
    applyStageFilter(key);
    setView('tracker');
  });

  function setView(v) {
    view = v;
    for (const b of document.querySelectorAll('.view-btn')) b.classList.toggle('active', b.dataset.view === v);
    $('viewTracker').hidden = v !== 'tracker';
    $('viewRoadmap').hidden = v !== 'roadmap';
    $('viewSources').hidden = v !== 'sources';
  }
  for (const b of document.querySelectorAll('.view-btn')) b.addEventListener('click', () => setView(b.dataset.view));

  /* ---------------- list events (delegation) ---------------- */
  listEl.addEventListener('click', (ev) => {
    const revealBtn = ev.target.closest('[data-reveal]');
    if (revealBtn) { revealed.add(Number(revealBtn.dataset.reveal)); render(); return; }
    const li = ev.target.closest('[data-id]');
    if (li && !ev.target.closest('input')) { selectedId = Number(li.dataset.id); renderList(); }
  });
  listEl.addEventListener('change', (ev) => {
    const box = ev.target.closest('[data-earn]');
    if (!box) return;
    const id = Number(box.dataset.earn);
    if (box.checked) earned.add(id); else earned.delete(id);
    saveAndRender();
  });
  platPinEl.addEventListener('click', () => { selectedId = PLATINUM_ID; renderList(); });

  /* ---------------- controls ---------------- */
  $('kindPills').addEventListener('click', (ev) => {
    const pill = ev.target.closest('[data-kind]');
    if (!pill) return;
    kind = pill.dataset.kind;
    if (activeStage !== null) { activeStage = null; setStageBanner(); }
    render();
  });
  function syncPills() {
    for (const p of document.querySelectorAll('#kindPills .pill')) p.classList.toggle('active', p.dataset.kind === kind);
  }
  searchEl.addEventListener('input', renderList);
  gradeEl.addEventListener('change', renderList);
  sortEl.addEventListener('change', renderList);
  hideEarnedEl.addEventListener('change', renderList);
  spoilerEl.addEventListener('change', render);

  /* ---------------- export / import / reset ---------------- */
  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
    importStatusEl.textContent = `Exported ${earned.size} earned trophies to gta6-trophy-progress.json.`;
    importStatusEl.className = 'import-status ok';
  });
  $('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      const valid = new Set(trophies.map((t) => t.id));
      earned = new Set(ids.filter((id) => valid.has(id)));
      saveAndRender();
      importStatusEl.textContent = `Import OK: ${earned.size} earned trophies loaded from ${file.name}.`;
      importStatusEl.className = 'import-status ok';
    } catch {
      importStatusEl.textContent = 'Import failed: that file is not valid trophy progress JSON. Your current progress was not changed.';
      importStatusEl.className = 'import-status error';
    }
    event.target.value = '';
  });
  const resetBtn = $('resetBtn');
  let resetArmed = false, resetTimer = null;
  resetBtn.addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      resetBtn.textContent = 'Confirm reset?';
      resetBtn.classList.add('armed');
      importStatusEl.textContent = 'Reset armed: click “Confirm reset?” to clear all earned trophies, or wait to cancel.';
      importStatusEl.className = 'import-status error';
      resetTimer = setTimeout(() => {
        resetArmed = false;
        resetBtn.textContent = 'Reset';
        resetBtn.classList.remove('armed');
      }, 5000);
      return;
    }
    clearTimeout(resetTimer);
    resetArmed = false;
    resetBtn.textContent = 'Reset';
    resetBtn.classList.remove('armed');
    earned = new Set();
    revealed.clear();
    saveAndRender();
    importStatusEl.textContent = 'Progress reset: all earned trophies cleared.';
    importStatusEl.className = 'import-status ok';
  });

  /* ---------------- URL params & first render ---------------- */
  if (params.get('kind') && ['all', 'story', 'missable', 'collectible', 'activity', 'online'].includes(params.get('kind'))) kind = params.get('kind');
  if (params.get('grade')) gradeEl.value = params.get('grade');
  if (params.get('sort')) sortEl.value = params.get('sort');
  if (params.get('spoiler') === '1') spoilerEl.checked = true;
  if (params.get('hideEarned') === '1') hideEarnedEl.checked = true;
  if (params.get('reveal')) for (const id of params.get('reveal').split(',')) revealed.add(Number(id));
  if (params.get('stage')) {
    const s = params.get('stage');
    activeStage = s === 'platinum' ? 'platinum' : Number(s);
    kind = 'all';
    setStageBanner();
  }
  const selParam = params.get('select') ?? params.get('open');
  if (selParam && byId.has(Number(selParam))) selectedId = Number(selParam);

  function render() {
    syncPills();
    renderProgress();
    renderList();
    renderRoadmap();
    renderSources();
  }
  render();
  if (['roadmap', 'sources', 'tracker'].includes(params.get('view'))) setView(params.get('view'));
}
main();
