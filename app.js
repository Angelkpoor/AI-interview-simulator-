/* App core: state, shell, setup, history, settings and the ANN Lab. */
(function () {
  const NS = (globalThis.IAI = globalThis.IAI || {});
  const { ANN, LEVELS, ROLES, Eval, Speech } = NS;

  const P = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    videoOff: '<path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    network: '<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 6.8l3.2 4M7 17.2l3.2-4M14 12h3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    micOff: '<line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    vol: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    volOff: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
    max: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    chev: '<polyline points="6 9 12 15 18 9"/>',
    arrowUR: '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
    arrowR: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    skip: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>',
    replay: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    server: '<rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><line x1="6" y1="7" x2="6.01" y2="7"/><line x1="6" y1="17" x2="6.01" y2="17"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    plug: '<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0z"/><path d="M12 18v4"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
    kbd: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  };
  const ic = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  /* ---------- state + storage ---------- */
  const state = {
    view: 'setup', name: '', cfg: { role: 'fe', custom: '', level: 1, count: 5, cam: true },
    settings: { speak: true, autoListen: true, instant: true, lang: 'en-IN', rate: 1, voice: '' },
    model: null, modelBusy: true, session: null, history: [], lab: { busy: false }, test: null,
  };
  const KEY = 'iai.v1';
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (d.name) state.name = d.name;
      if (d.settings) Object.assign(state.settings, d.settings);
      if (d.cfg) Object.assign(state.cfg, d.cfg);
      if (Array.isArray(d.history)) state.history = d.history;
    } catch (e) { /* storage unavailable */ }
  }
  function save() {
    const put = (h) => localStorage.setItem(KEY, JSON.stringify({ name: state.name, settings: state.settings, cfg: state.cfg, history: h }));
    try { put(state.history); } catch (e) { try { put(state.history.slice(0, 3).map((x) => ({ ...x, snapshot: null }))); } catch (e2) { /* ignore */ } }
  }

  /* ---------- toast + modal ---------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3400);
  }
  function modal(html, actions) {
    const m = $('#modal');
    m.innerHTML = `<div class="modal-box">${html}<div class="row">${actions.map((a, i) => `<button class="btn sm ${a.cls || 'ghost'}" data-i="${i}">${a.label}</button>`).join('')}</div></div>`;
    m.hidden = false;
    m.onclick = (e) => {
      const b = e.target.closest('[data-i]');
      if (b) { m.hidden = true; const a = actions[+b.dataset.i]; a.fn && a.fn(); }
      else if (e.target === m) m.hidden = true;
    };
  }
  function helpModal() {
    modal(`<h3>How it works</h3><p>1. Pick a role and your level.<br>2. Allow the microphone (camera is optional).<br>3. Nova reads each question aloud. Answer out loud, then press <b>Submit answer</b>. Your words appear as text on the right.<br>4. A neural network scores content, structure, clarity and delivery, and you get a full report with a plan to improve.</p>
      <p style="margin-top:10px">No microphone? Type your answer in the box on the right instead.</p>`, [{ label: 'Got it', cls: 'primary' }]);
  }

  /* ---------- shell ---------- */
  const NAV = [['setup', 'home', 'Home'], ['interview', 'video', 'Interview'], ['history', 'folder', 'Reports'], ['ann', 'network', 'ANN Lab'], ['settings', 'gear', 'Settings']];
  function renderRail() {
    const live = !!(state.session && !state.session.ended);
    $('#rail').innerHTML = `<svg class="logo" viewBox="0 0 44 44"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b97ff"/><stop offset="1" stop-color="#1d4fd8"/></linearGradient></defs><rect width="44" height="44" rx="14" fill="url(#lg)"/><rect x="10" y="17" width="4.5" height="10" rx="2.2" fill="#fff"/><rect x="19.7" y="10" width="4.5" height="24" rx="2.2" fill="#fff"/><rect x="29.5" y="15" width="4.5" height="14" rx="2.2" fill="#fff"/></svg>` +
      NAV.map(([k, i, t]) => `<button class="rail-btn ${state.view === k ? 'active' : ''}" data-nav="${k}" title="${t}" aria-label="${t}" ${k === 'interview' && !live ? 'disabled' : ''}>${ic(i)}${k === 'interview' && live ? '<span class="dot"></span>' : ''}</button>`).join('') +
      `<div class="spacer"></div><div class="avatar" title="${esc(state.name || 'You')}">${esc((state.name || 'Y').trim().charAt(0).toUpperCase())}</div>`;
  }
  function stopTest() {
    const t = state.test; if (!t) return;
    cancelAnimationFrame(t.raf); t.media.stopAll($('#devVideo')); state.test = null;
  }
  function go(view) {
    if (state.view === 'interview' && view !== 'interview' && NS.Interview.suspend) NS.Interview.suspend();
    stopTest();
    state.view = view;
    document.body.classList.remove('report-mode'); $('#report').hidden = true;
    renderRail();
    const v = $('#views');
    if (view === 'setup') v.innerHTML = setupHTML();
    else if (view === 'history') v.innerHTML = historyHTML();
    else if (view === 'settings') v.innerHTML = settingsHTML();
    else if (view === 'ann') { v.innerHTML = labHTML(); labMount(); }
    else if (view === 'interview') { NS.Interview.render(v); }
    window.scrollTo({ top: 0 });
  }

  const modelPill = () => state.modelBusy ? `${ic('network')}<span>Training neural network...</span>` : `${ic('network')}<span><b>ANN ready</b> · ${state.model.net.paramCount()} weights</span>`;
  const sideTop = (btn) => `<div class="side-top"><div class="pill" id="sidePill">${modelPill()}</div>${btn || `<button class="circle" data-act="help" title="How it works" aria-label="Help">${ic('help')}</button>`}</div>`;

  /* ---------- setup ---------- */
  function setupHTML() {
    const c = state.cfg, role = ROLES[c.role];
    const rn = c.role === 'other' ? (c.custom || 'your role') : role.title;
    return `<section class="view"><div class="col-main">
      <div class="head"><h1>Hi, ${esc(state.name || 'there')}! 👋</h1><p>Mock Interview Simulator | Set up your session</p></div>
      <h3 class="sec">Choose your role</h3>
      <div class="role-grid">${Object.entries(ROLES).map(([k, r]) => `<button class="role-tile ${c.role === k ? 'active' : ''}" data-role="${k}"><span class="tick">${ic('check')}</span><div class="ri">${ic(r.icon)}</div><b>${r.title}</b><span>${r.blurb}</span></button>`).join('')}</div>
      ${c.role === 'other' ? `<div class="field"><label for="customRole">Which role are you preparing for?</label><input class="input" id="customRole" placeholder="e.g. Data Analyst, DevOps Engineer" value="${esc(c.custom)}"></div>` : ''}
      <h3 class="sec">Your experience level</h3>
      <div class="level-grid">${LEVELS.map((l) => `<button class="level-tile ${c.level === l.key ? 'active' : ''}" data-level="${l.key}"><div class="bars">${[0, 1, 2, 3].map((i) => `<i class="${i <= l.key ? 'on' : ''}"></i>`).join('')}</div><b>${l.name}</b><span>${l.sub}. ${l.blurb}</span></button>`).join('')}</div>
      <h3 class="sec">Interview settings</h3>
      <div class="set-row">
        <div class="field" style="margin:0"><label for="nameIn">Your name</label><input class="input" id="nameIn" placeholder="Alex" value="${esc(state.name)}" maxlength="24"></div>
        <div class="field" style="margin:0"><label>Number of questions</label><div class="seg">${[[5, 'Quick 5'], [7, 'Standard 7'], [10, 'Full 10']].map(([n, t]) => `<button class="${c.count === n ? 'on' : ''}" data-count="${n}">${t}</button>`).join('')}</div></div>
      </div>
      <div class="toggles">
        <div class="tog ${c.cam ? 'on' : ''}" data-tog="cam"><div>Start with my camera on<small>Optional. Video stays on your device and is never recorded or uploaded.</small></div><div class="sw"></div></div>
        <div class="tog ${state.settings.speak ? 'on' : ''}" data-tog="speak"><div>Nova reads each question aloud<small>Uses your browser's text to speech voice.</small></div><div class="sw"></div></div>
      </div>
      <div class="start-row"><button class="btn primary" data-act="start" ${state.modelBusy ? 'disabled' : ''}>${state.modelBusy ? 'Preparing the AI...' : 'Start interview'} ${ic('arrowR')}</button><small>${c.count} questions · ${rn} · ${LEVELS[c.level].name}</small></div>
    </div>
    <aside class="col-side">${sideTop()}
      <div class="card devcheck"><h3>Device check</h3><p class="sub" style="margin-bottom:12px">Test your camera and microphone before you begin.</p>
        <video id="devVideo" playsinline muted></video><div class="meter"><i id="devMeter"></i></div>
        <button class="btn ghost sm" data-act="test" style="width:100%;margin-top:10px" id="testBtn">${ic('video')} Test camera and mic</button></div>
      <div class="card"><h3 style="margin-bottom:12px">What happens next</h3><div class="steps">
        <div class="step"><i>1</i><span>Nova asks a question and reads it aloud.</span></div>
        <div class="step"><i>2</i><span>You answer out loud. Speech turns into text live.</span></div>
        <div class="step"><i>3</i><span>A neural network scores your answer and explains how to improve.</span></div></div></div>
      <div class="tip-card"><h3>Best in Chrome</h3><p>Speech recognition works in Chrome and Edge. In other browsers, type your answers instead.</p>${crown()}</div>
    </aside></section>`;
  }
  const crown = () => `<svg class="art" viewBox="0 0 100 80"><defs><linearGradient id="cr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7db0ff"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs><path d="M8 66l-2-44 22 20 22-32 22 32 22-20-2 44z" fill="url(#cr)"/><rect x="8" y="68" width="84" height="8" rx="3" fill="#1d4fd8"/><circle cx="6" cy="22" r="5" fill="#9cc2ff"/><circle cx="50" cy="8" r="5" fill="#9cc2ff"/><circle cx="94" cy="22" r="5" fill="#9cc2ff"/></svg>`;

  async function testDevices() {
    if (state.test) { stopTest(); $('#testBtn').innerHTML = `${ic('video')} Test camera and mic`; $('#devMeter').style.width = '0'; return; }
    const media = new Speech.Media();
    try { await media.startMic(); } catch (e) { toast('Microphone is blocked or unavailable. You can still type your answers.'); }
    try { await media.startCam($('#devVideo')); } catch (e) { toast('Camera is unavailable. That is fine, the interview works without it.'); }
    if (!media.stream && !media.vstream) return;
    const t = { media, raf: 0 }; state.test = t;
    const loop = () => { const m = $('#devMeter'); if (!m || state.test !== t) return; m.style.width = Math.round(media.level() * 100) + '%'; t.raf = requestAnimationFrame(loop); };
    loop(); $('#testBtn').innerHTML = `${ic('stop')} Stop test`;
  }

  /* ---------- history ---------- */
  function historyHTML() {
    const H = state.history;
    const best = H.length ? Math.max(...H.map((h) => h.summary.overall)) : 0;
    const avg = H.length ? Math.round(H.reduce((s, h) => s + h.summary.overall, 0) / H.length) : 0;
    return `<section class="view"><div class="col-main">
      <div class="head"><h1>Your reports</h1><p>Past interviews saved in this browser</p></div>
      <h3 class="sec">Sessions</h3>
      ${H.length ? `<div class="hist">${H.map((h, i) => `<button class="hist-item" data-open="${i}"><div class="score-ring" style="--p:${h.summary.overall}"><span>${h.summary.overall}</span></div><div><b>${esc(h.roleName)} · ${LEVELS[h.level].name}</b><small>${new Date(h.ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · ${h.answers.length} questions · ${h.summary.verdict}</small></div><div class="mini-dims">${ANN.OUTPUTS.map((n, k) => `<span>${n.slice(0, 4)} ${h.summary.dims[k]}</span>`).join('')}</div></button>`).join('')}</div>`
        : `<div class="empty">${ic('folder')}<p>No interviews yet. Finish one and the report is saved here.</p><button class="btn primary sm" data-nav="setup">Start an interview</button></div>`}
    </div><aside class="col-side">${sideTop()}
      <div class="kv"><div class="card"><div class="n">${H.length}</div><div class="l">Interviews</div></div><div class="card"><div class="n">${best || '-'}</div><div class="l">Best score</div></div><div class="card"><div class="n">${avg || '-'}</div><div class="l">Average</div></div><div class="card"><div class="n">${H.length > 1 ? (H[0].summary.overall - H[H.length - 1].summary.overall >= 0 ? '+' : '') + (H[0].summary.overall - H[H.length - 1].summary.overall) : '-'}</div><div class="l">Change since first</div></div></div>
      ${H.length ? `<button class="btn danger sm" data-act="clear">${ic('trash')} Clear history</button>` : ''}
      <p class="sub" style="font-size:12.5px;color:var(--muted);line-height:1.5">Reports are stored only in this browser on this device.</p>
    </aside></section>`;
  }

  /* ---------- settings ---------- */
  function settingsHTML() {
    const s = state.settings;
    const voices = Speech.Voice.voices().filter((v) => v.lang.startsWith('en'));
    return `<section class="view"><div class="col-main">
      <div class="head"><h1>Settings</h1><p>Voice, language and feedback preferences</p></div>
      <h3 class="sec">Interview</h3>
      <div class="toggles" style="margin-top:0">
        <div class="tog ${s.speak ? 'on' : ''}" data-tog="speak"><div>Read questions aloud<small>Nova speaks each question.</small></div><div class="sw"></div></div>
        <div class="tog ${s.autoListen ? 'on' : ''}" data-tog="autoListen"><div>Start listening automatically<small>The microphone opens as soon as Nova finishes the question.</small></div><div class="sw"></div></div>
        <div class="tog ${s.instant ? 'on' : ''}" data-tog="instant"><div>Instant feedback after every answer<small>Turn off for a realistic interview and read everything in the report.</small></div><div class="sw"></div></div>
      </div>
      <h3 class="sec">Speech</h3>
      <div class="set-row">
        <div class="field" style="margin:0"><label for="lang">Recognition language and accent</label><select class="sel" id="lang">${[['en-IN', 'English (India)'], ['en-US', 'English (US)'], ['en-GB', 'English (UK)'], ['en-AU', 'English (Australia)']].map(([v, t]) => `<option value="${v}" ${s.lang === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="field" style="margin:0"><label for="rate">Nova speaking speed: <span id="rateV">${s.rate.toFixed(1)}x</span></label><input type="range" id="rate" min="0.7" max="1.3" step="0.1" value="${s.rate}" style="accent-color:var(--blue);margin-top:14px"></div>
      </div>
      <div class="field"><label for="voice">Nova's voice</label><select class="sel" id="voice"><option value="">Automatic</option>${voices.map((v) => `<option value="${esc(v.voiceURI)}" ${s.voice === v.voiceURI ? 'selected' : ''}>${esc(v.name)} (${v.lang})</option>`).join('')}</select></div>
      <div class="start-row"><button class="btn ghost sm" data-act="testvoice">${ic('vol')} Preview voice</button></div>
    </div><aside class="col-side">${sideTop()}
      <div class="card"><h3>Privacy</h3><p class="sub" style="line-height:1.55;margin-top:6px">Your camera video is shown on screen only. It is never recorded or uploaded. Scoring runs entirely in your browser.<br><br>Speech to text is done by your browser. In Chrome and Edge the audio is sent to the browser vendor's speech service, so avoid saying anything private. Typed answers never leave your device.</p></div>
    </aside></section>`;
  }

  /* ---------- ANN Lab ---------- */
  const SHORT = ['length', 'keywords', 'similarity', 'variety', 'precision', 'fillers', 'structure', 'examples', 'hedging', 'pace', 'duration', 'density', 'level'];
  function netSvg(net) {
    const sizes = net.sizes, W = 760, H = 380, xs = sizes.map((_, i) => 110 + i * ((W - 220) / (sizes.length - 1)));
    const ys = sizes.map((n) => Array.from({ length: n }, (_, i) => 24 + (H - 48) * (n === 1 ? .5 : i / (n - 1))));
    let edges = '';
    for (let l = 0; l < net.W.length; l++) {
      let mx = 0; net.W[l].forEach((r) => r.forEach((w) => (mx = Math.max(mx, Math.abs(w)))));
      net.W[l].forEach((row, j) => row.forEach((w, i) => {
        const o = Math.min(0.55, (Math.abs(w) / mx) * 0.6); if (o < 0.07) return;
        edges += `<line x1="${xs[l]}" y1="${ys[l][i]}" x2="${xs[l + 1]}" y2="${ys[l + 1][j]}" stroke="${w > 0 ? '#2563eb' : '#e5484d'}" stroke-opacity="${o.toFixed(2)}" stroke-width="1"/>`;
      }));
    }
    const nodes = sizes.map((n, l) => ys[l].map((y) => `<circle cx="${xs[l]}" cy="${y}" r="${l === 0 || l === sizes.length - 1 ? 8 : 6.5}" fill="${l === 0 ? '#e4ecff' : l === sizes.length - 1 ? '#2563eb' : '#fff'}" stroke="#2563eb" stroke-width="1.6"/>`).join('')).join('');
    const il = ys[0].map((y, i) => `<text x="${xs[0] - 16}" y="${y + 4}" text-anchor="end" font-size="11.5" fill="#51608a">${SHORT[i]}</text>`).join('');
    const ol = ys[sizes.length - 1].map((y, i) => `<text x="${xs[sizes.length - 1] + 18}" y="${y + 4}" font-size="12.5" font-weight="600" fill="#0f1b3d">${ANN.OUTPUTS[i]}</text>`).join('');
    const cap = ['Input features', 'Hidden layer 1 (tanh)', 'Hidden layer 2 (tanh)', 'Output (sigmoid)'].map((t, l) => `<text x="${xs[l]}" y="${H + 14}" text-anchor="middle" font-size="11.5" fill="#6c7a99">${t}</text>`).join('');
    return `<svg class="lab-svg" viewBox="0 0 ${W} ${H + 24}">${edges}${nodes}${il}${ol}${cap}</svg>`;
  }
  function lossSvg(hist) {
    const W = 600, Hh = 190, pl = 44, pb = 26, lo = -4.2, hi = -1.6;
    const y = (v) => 10 + (Hh - pb - 10) * (1 - (Math.log10(Math.max(v, 1e-5)) - lo) / (hi - lo));
    const n = Math.max(hist.length, 2), x = (i) => pl + (W - pl - 10) * (i / (Math.max(hist.length, 45) - 1));
    const path = (k) => hist.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${Math.min(Hh - pb, Math.max(10, y(h[k]))).toFixed(1)}`).join(' ');
    const grid = [-4, -3, -2].map((e) => `<line x1="${pl}" x2="${W - 10}" y1="${y(Math.pow(10, e))}" y2="${y(Math.pow(10, e))}" stroke="#e3eaf7"/><text x="${pl - 8}" y="${y(Math.pow(10, e)) + 4}" text-anchor="end" font-size="10.5" fill="#8a97b5">1e${e}</text>`).join('');
    return `<svg class="lab-svg" viewBox="0 0 ${W} ${Hh}">${grid}<path d="${path('loss')}" fill="none" stroke="#2563eb" stroke-width="2.4" stroke-linecap="round"/><path d="${path('val')}" fill="none" stroke="#58d9f8" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="5 4"/><text x="${pl}" y="${Hh - 6}" font-size="11" fill="#6c7a99">epoch 1</text><text x="${W - 10}" y="${Hh - 6}" text-anchor="end" font-size="11" fill="#6c7a99">epoch ${hist.length || ''}</text></svg>`;
  }
  function labStats(m) {
    if (!m) return '';
    return `<div class="lab-stats"><div><b>${m.net.paramCount()}</b><span>weights and biases</span></div><div><b>${m.nTrain.toLocaleString()}</b><span>training samples</span></div><div><b>${m.test.mse.toExponential(1)}</b><span>test MSE (mean squared error)</span></div><div><b>${(m.test.mae * 100).toFixed(1)} pts</b><span>average error per score</span></div></div>`;
  }
  function labHTML() {
    const m = state.model;
    return `<section class="view"><div class="col-main">
      <div class="head"><h1>ANN Lab</h1><p>The artificial neural network that scores your answers</p></div>
      <h3 class="sec">Architecture</h3>
      <div class="card">${m ? netSvg(m.net) : '<p class="sub">Training...</p>'}<p class="sub" style="margin-top:8px">A multi layer perceptron: 13 features go in, 4 scores come out. Blue lines are positive weights, red lines are negative. Line strength shows how much a connection matters.</p></div>
      <h3 class="sec">Training <button class="btn ghost sm" data-act="retrain" id="retrainBtn">${ic('refresh')} Retrain from scratch</button></h3>
      <div class="card"><div id="lossBox">${lossSvg(m ? m.history : [])}</div><div id="labStats">${labStats(m)}</div>
        <p class="sub" style="margin-top:10px"><span style="color:#2563eb;font-weight:600">Solid</span> training loss, <span style="color:#1fb5d8;font-weight:600">dashed</span> validation loss (log scale). Backpropagation with the Adam optimiser.</p></div>
      <div class="note"><b>Honest note:</b> this demo network is trained on 3,200 synthetic answers whose labels come from a transparent scoring rubric, so it learns to apply that rubric smoothly (including how expectations rise with your level). To make it a true human-like examiner, replace the synthetic data with real answers rated by interviewers and retrain.</div>
    </div><aside class="col-side">${sideTop()}
      <div class="side-head"><h3>Playground</h3></div>
      <p class="sub" style="font-size:12.5px;color:var(--muted);margin-top:-12px">Move the features and watch the four scores respond.</p>
      <div id="outs"></div>
      <div id="sliders" style="display:flex;flex-direction:column;gap:10px"></div>
    </aside></section>`;
  }
  const PG = [0.7, 0.6, 0.55, 0.5, 0.5, 0.1, 0.6, 0.5, 0.1, 0.8, 0.8, 0.5, 0.33];
  function labMount() {
    const box = $('#sliders'); if (!box) return;
    const vals = PG.slice();
    box.innerHTML = ANN.FEATURES.map((f, i) => `<div class="slider-row" title="${esc(f.hint)}"><label for="pg${i}">${f.label}</label><output id="pgo${i}">${vals[i].toFixed(2)}</output><input type="range" id="pg${i}" min="0" max="1" step="0.01" value="${vals[i]}"></div>`).join('');
    const upd = () => {
      if (!state.model) return;
      const o = state.model.net.predict(vals);
      $('#outs').innerHTML = o.map((v, k) => `<div class="out-row"><b>${ANN.OUTPUTS[k]}</b><div class="bar"><i style="width:${Math.round(v * 100)}%"></i></div><span>${Math.round(v * 100)}</span></div>`).join('');
    };
    box.oninput = (e) => { const i = +e.target.id.slice(2); if (isNaN(i)) return; vals[i] = +e.target.value; $('#pgo' + i).textContent = vals[i].toFixed(2); upd(); };
    upd();
  }
  async function retrain() {
    if (state.lab.busy) return; state.lab.busy = true;
    const btn = $('#retrainBtn'); btn.disabled = true; btn.textContent = 'Training...';
    const m = await ANN.trainModel({ epochs: 45, seed: (Date.now() % 9000) + 1, onEpoch: (h, e, n) => { const b = $('#lossBox'); if (b && e % 2 === 0) b.innerHTML = lossSvg(window.__hist = (window.__hist || []).concat(h)); } });
    window.__hist = null; state.model = m; state.lab.busy = false;
    if (state.view === 'ann') { $('#views').innerHTML = labHTML(); labMount(); }
    toast('Retrained. Scores for your next interview use the new network.');
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const nav = t.closest('[data-nav]'); if (nav && !nav.disabled) return go(nav.dataset.nav);
    const role = t.closest('[data-role]'); if (role) { state.cfg.role = role.dataset.role; save(); return go('setup'); }
    const lvl = t.closest('[data-level]'); if (lvl) { state.cfg.level = +lvl.dataset.level; save(); return go('setup'); }
    const cnt = t.closest('[data-count]'); if (cnt) { state.cfg.count = +cnt.dataset.count; save(); return go('setup'); }
    const tog = t.closest('[data-tog]');
    if (tog) { const k = tog.dataset.tog; if (k === 'cam') state.cfg.cam = !state.cfg.cam; else state.settings[k] = !state.settings[k]; save(); return go(state.view); }
    const open = t.closest('[data-open]'); if (open) return NS.Report.show(state.history[+open.dataset.open]);
    const act = t.closest('[data-act]'); if (!act) return;
    const a = act.dataset.act;
    if (a === 'help') helpModal();
    else if (a === 'start') {
      const c = state.cfg;
      if (c.role === 'other' && !c.custom.trim()) { toast('Type the role you are preparing for.'); const i = $('#customRole'); i && i.focus(); return; }
      NS.Interview.start();
    }
    else if (a === 'test') testDevices();
    else if (a === 'clear') modal('<h3>Clear all reports?</h3><p>This removes every saved interview from this browser.</p>', [{ label: 'Cancel' }, { label: 'Clear', cls: 'danger', fn: () => { state.history = []; save(); go('history'); } }]);
    else if (a === 'retrain') retrain();
    else if (a === 'testvoice') Speech.Voice.speak('Hello, I am Nova. Let us begin your mock interview.', { rate: state.settings.rate, voiceURI: state.settings.voice, lang: state.settings.lang });
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'nameIn') { state.name = t.value.trim(); save(); const h = $('.head h1'); if (h) h.textContent = `Hi, ${state.name || 'there'}! 👋`; renderRail(); }
    else if (t.id === 'customRole') { state.cfg.custom = t.value; save(); }
    else if (t.id === 'rate') { state.settings.rate = +t.value; $('#rateV').textContent = (+t.value).toFixed(1) + 'x'; save(); }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'lang') { state.settings.lang = t.value; save(); }
    else if (t.id === 'voice') { state.settings.voice = t.value; save(); }
  });

  NS.UI = { state, $, $$, ic, esc, fmt, toast, modal, go, save, renderRail, sideTop, helpModal, load };
})();
