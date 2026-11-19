/* Live interview: question flow, camera, speech to text, spoken questions, transcript. */
(function () {
  const NS = (globalThis.IAI = globalThis.IAI || {});
  const U = NS.UI, { state, $, ic, esc, fmt, toast } = U;
  const { Listener, Voice, Media } = NS.Speech;
  const { Eval, buildInterview } = NS;

  let S = null, media = null, listener = null, timer = 0, raf = 0;
  const now = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const Q = () => S.questions[S.idx];
  const TYPE = { intro: 'Introduction', tech: 'Technical', behav: 'Behavioural' };

  function start() {
    const c = state.cfg;
    const { roleName, questions } = buildInterview(c.role, c.level, c.count, c.custom, Date.now());
    S = { name: state.name || 'there', roleKey: c.role, roleName, level: c.level, questions, idx: 0, answers: [], phase: 'idle', startedAt: Date.now(), ended: false, muted: false, token: 0, snapshot: null, msgs: [], ttsOn: state.settings.speak, typed: '', booted: false, hint: false, sttStarted: false };
    state.session = S;
    U.go('interview');
  }

  /* ---------- render ---------- */
  function render(v) {
    const lvl = NS.LEVELS[S.level].name;
    v.innerHTML = `<section class="view"><div class="col-main">
      <div class="head"><h1>Hi, ${esc(S.name)}! 👋</h1><p>${esc(S.roleName)} · ${lvl} | Live now</p></div>
      <div class="stage" id="stage">
        <div class="qcard"><div class="q-meta"><span class="tag" id="qNum"></span><span class="tag alt" id="qType"></span><span class="speaking" id="speaking"><span class="eq"><i></i><i></i><i></i><i></i></span>Nova is speaking</span></div><h2 class="q-text" id="qText"></h2></div>
        <div class="video" id="video"><video id="cam" playsinline muted></video>
          <div class="cam-off"><div class="big">${esc(S.name.charAt(0).toUpperCase())}</div><span>Camera is off. Your answers are still evaluated.</span></div>
          <span class="live"><i></i> Live</span><button class="fs" data-iv="fs" aria-label="Full screen">${ic('max')}</button>
          <div class="chip-status" id="status"><i></i><span id="statusT">Getting ready</span></div>
          <div class="vol"><div class="vol-track"><div class="vol-fill" id="vol"></div></div><button class="vol-btn" data-iv="tts" id="ttsBtn" aria-label="Toggle spoken questions"></button></div>
          <div class="controls"><button class="cbtn" data-iv="mic" id="micBtn" aria-label="Mute microphone"></button><button class="cbtn" data-iv="cam" id="camBtn" aria-label="Toggle camera"></button><button class="cbtn" data-iv="replay" aria-label="Repeat question">${ic('replay')}</button><button class="cbtn end" data-iv="end" aria-label="End interview">${ic('phone')}</button></div>
        </div>
      </div>
      <div class="actions" id="actions"></div>
      <div class="tiles" id="tiles"></div>
      <h3 class="sec">Live Insights <a data-iv="hint">Show hint</a></h3>
      <div class="ins" id="ins"></div>
    </div>
    <aside class="col-side">
      <div class="side-top"><div class="pill" id="sidePill"></div><button class="circle" data-iv="hint" title="Hint" aria-label="Hint">${ic('bulb')}</button></div>
      <div class="side-head"><h3>Transcript</h3><span class="link" style="text-decoration:none;color:var(--muted)" id="qCount"></span></div>
      <div class="chat" id="chat"></div>
      <form class="composer" id="composer" autocomplete="off"><input id="typeIn" placeholder="Or type your answer..." aria-label="Type your answer"><button type="submit" aria-label="Send">${ic('send')}</button></form>
      <div class="tip-card"><h3 id="tipT">Coach tip</h3><p id="tipP"></p><svg class="art" viewBox="0 0 100 80"><defs><linearGradient id="cr2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7db0ff"/><stop offset="1" stop-color="#2563eb"/></linearGradient></defs><path d="M8 66l-2-44 22 20 22-32 22 32 22-20-2 44z" fill="url(#cr2)"/><rect x="8" y="68" width="84" height="8" rx="3" fill="#1d4fd8"/><circle cx="6" cy="22" r="5" fill="#9cc2ff"/><circle cx="50" cy="8" r="5" fill="#9cc2ff"/><circle cx="94" cy="22" r="5" fill="#9cc2ff"/></svg></div>
    </aside></section>`;
    $('#composer').onsubmit = onType;
    refreshAll(); renderChat(); attachVideo();
    clearInterval(timer); timer = setInterval(tick, 300);
    cancelAnimationFrame(raf); meterLoop();
    if (!S.booted) boot();
    else if (S.suspended) { S.suspended = false; if (S.phase === 'asking' || S.phase === 'ready') askQuestion(true); else if (S.phase === 'listening' && S.sttStarted && !S.muted) listener.resume(); }
  }

  function suspend() {
    if (!S || S.ended) return;
    S.suspended = true; S.token++; Voice.stop(); listener && listener.pause();
    clearInterval(timer); cancelAnimationFrame(raf);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  async function boot() {
    S.booted = true;
    media = new Media();
    listener = new Listener(state.settings.lang, onLive, onSttError);
    let micOk = true;
    try { await media.startMic(); } catch (e) { micOk = false; }
    S.micOk = micOk;
    if (state.cfg.cam) { try { await media.startCam($('#cam')); } catch (e) { toast('Camera unavailable. Continuing without video.'); } }
    attachVideo(); refreshAll();
    if (!Listener.supported) toast('Speech recognition is not supported in this browser. Use Chrome or Edge, or type your answers.');
    else if (!micOk) toast('Microphone is blocked. Allow it in the address bar, or type your answers.');
    askQuestion();
  }

  function attachVideo() {
    const vid = $('#cam'), box = $('#video'); if (!vid || !box) return;
    if (media && media.vstream) { vid.srcObject = media.vstream; vid.play().catch(() => {}); box.classList.add('cam-on'); } else box.classList.remove('cam-on');
  }

  /* ---------- flow ---------- */
  async function askQuestion(silent) {
    const my = ++S.token, q = Q();
    S.phase = 'asking'; S.typed = ''; S.hint = false; S.sttStarted = false;
    if (!silent) addMsg({ kind: 'ai', text: q.q, label: `Question ${S.idx + 1}` });
    refreshAll();
    if (S.ttsOn && Voice.supported) {
      setSpeaking(true);
      await Voice.speak(q.q, { rate: state.settings.rate, voiceURI: state.settings.voice, lang: state.settings.lang });
      setSpeaking(false);
    }
    if (my !== S.token || S.ended || S.phase !== 'asking') return;
    if (state.settings.autoListen) enterListening(true); else { S.phase = 'ready'; refreshAll(); }
  }
  function enterListening(stt) {
    S.phase = 'listening'; S.listenStart = Date.now(); S.typed = ''; S.sttStarted = false;
    listener.reset(); listener.lang = state.settings.lang;
    if (stt && Listener.supported && !S.muted) { S.sttStarted = listener.start(); }
    refreshAll(); liveBubble('');
  }
  function onLive(finalText, interim) {
    if (!S || S.phase !== 'listening') return;
    liveBubble((finalText + ' ' + interim).trim());
  }
  function onSttError(err) {
    if (err === 'denied') toast('Microphone permission denied. Allow it or type your answer.');
    else if (err === 'network') toast('Speech service unreachable. Check your internet or type your answer.');
    else if (err === 'audio-capture') toast('No microphone found. Type your answer instead.');
  }

  async function submit(opts) {
    if (!S || S.phase !== 'listening') return;
    opts = opts || {};
    const endAt = Date.now(), q = Q(); S.phase = 'scoring'; refreshAll();
    let spoken = '';
    if (listener) spoken = opts.skip ? '' : await listener.finish();
    if (opts.skip && listener) listener.pause();
    const full = (spoken + ' ' + S.typed).trim();
    const fw = listener && listener.firstWordAt;
    const timing = { typed: !spoken && !!S.typed, speakSec: fw ? (endAt - fw) / 1000 : 0, thinkSec: fw ? (fw - S.listenStart) / 1000 : null };
    const an = Eval.analyze(full, q, timing, S.level);
    const sc = Eval.score(state.model.net, an.features, an.wc);
    const fb = Eval.feedback(an, sc, q);
    if (media && media.vstream) S.snapshot = media.snapshot($('#cam')) || S.snapshot;
    S.answers.push({ q: { q: q.q, topic: q.topic, type: q.type, model: q.model, modelLabel: q.modelLabel, kw: q.kw, hint: q.hint }, text: full, an, score: sc, fb, skipped: !!opts.skip, t0: (S.listenStart - S.startedAt) / 1000, dur: (endAt - S.listenStart) / 1000 });
    removeLive();
    addMsg({ kind: 'me', text: opts.skip ? 'Skipped this question.' : full || '(No speech was captured)' });
    if (state.settings.instant && !sc.skipped) addMsg({ kind: 'fb', sc, tip: fb.fix[0] || fb.good[0] || '' });
    else if (sc.skipped) addMsg({ kind: 'fb', sc, tip: fb.fix[0] });
    S.phase = 'review'; refreshAll();
  }
  function next() {
    if (S.phase !== 'review') return;
    if (S.idx + 1 >= S.questions.length) return finish();
    S.idx++; askQuestion();
  }
  function skip() {
    if (!['asking', 'ready', 'listening'].includes(S.phase)) return;
    S.token++; Voice.stop(); setSpeaking(false);
    if (S.phase !== 'listening') enterListening(false);
    submit({ skip: true });
  }
  function finish() {
    S.ended = true; S.endedAt = Date.now(); S.token++; Voice.stop(); listener && listener.pause();
    clearInterval(timer); cancelAnimationFrame(raf);
    if (media && media.vstream) S.snapshot = media.snapshot($('#cam')) || S.snapshot;
    media && media.stopAll($('#cam'));
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    state.session = null; U.renderRail();
    if (!S.answers.length) { toast('Interview ended before any answer was recorded.'); return U.go('setup'); }
    const summary = Eval.summarize(S);
    const rec = { id: S.startedAt, ts: S.endedAt, name: S.name, roleName: S.roleName, roleKey: S.roleKey, level: S.level, summary, answers: S.answers, snapshot: S.snapshot, startedAt: S.startedAt, endedAt: S.endedAt };
    state.history.unshift(rec); state.history = state.history.slice(0, 12); U.save();
    NS.Report.show(rec);
  }

  /* ---------- controls ---------- */
  function onType(e) {
    e.preventDefault();
    const inp = $('#typeIn'), v = inp.value.trim(); if (!v) return;
    if (S.phase === 'asking' || S.phase === 'ready') { S.token++; Voice.stop(); setSpeaking(false); enterListening(false); }
    if (S.phase !== 'listening') return toast('Wait for the next question.');
    S.typed += (S.typed ? ' ' : '') + v; inp.value = '';
    submit();
  }
  async function replay() {
    if (S.phase === 'asking' || S.phase === 'ready') { Voice.stop(); return askQuestion(true); }
    if (S.phase !== 'listening') return;
    const was = S.sttStarted && !S.muted; listener.pause(); setSpeaking(true);
    await Voice.speak(Q().q, { rate: state.settings.rate, voiceURI: state.settings.voice, lang: state.settings.lang });
    setSpeaking(false); if (S.phase === 'listening' && was) listener.resume();
  }
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-iv]'); if (!b || !S || state.view !== 'interview') return;
    const a = b.dataset.iv;
    if (a === 'mic') {
      S.muted = !S.muted;
      if (S.phase === 'listening') { if (S.muted) listener.pause(); else { S.sttStarted = true; listener.resume(); } }
      refreshControls();
    } else if (a === 'cam') {
      if (media.vstream) media.stopCam($('#cam')); else { try { await media.startCam($('#cam')); } catch (err) { toast('Camera is blocked or unavailable.'); } }
      attachVideo(); refreshControls();
    } else if (a === 'tts') { S.ttsOn = !S.ttsOn; if (!S.ttsOn) Voice.stop(); refreshControls(); }
    else if (a === 'replay') replay();
    else if (a === 'fs') { const st = $('#stage'); try { document.fullscreenElement ? await document.exitFullscreen() : await st.requestFullscreen(); } catch (err) { toast('Full screen is not available here.'); } }
    else if (a === 'hint') { S.hint = !S.hint; refreshTip(); }
    else if (a === 'submit') submit();
    else if (a === 'redo') { listener.reset(); S.typed = ''; if (S.sttStarted && !S.muted) { listener.pause(); listener.resume(); } removeLive(); liveBubble(''); S.listenStart = Date.now(); toast('Answer cleared. Start again.'); }
    else if (a === 'start') enterListening(true);
    else if (a === 'next') next();
    else if (a === 'skip') skip();
    else if (a === 'skipvoice') { S.token++; Voice.stop(); setSpeaking(false); if (state.settings.autoListen) enterListening(true); else { S.phase = 'ready'; refreshAll(); } }
    else if (a === 'end') U.modal('<h3>End the interview?</h3><p>Answers you have already given will be scored and shown in your report.</p>', [{ label: 'Keep going' }, { label: 'End and see report', cls: 'primary', fn: finish }]);
  });

  /* ---------- refreshers ---------- */
  function refreshAll() { if (!$('#qText')) return; refreshQuestion(); refreshControls(); refreshTiles(); refreshTip(); refreshActions(); tick(); }
  function refreshQuestion() {
    const q = Q(); $('#qNum').textContent = `Question ${S.idx + 1} of ${S.questions.length}`;
    $('#qType').textContent = TYPE[q.type] || 'Technical'; $('#qText').textContent = q.q; $('#qCount').textContent = `${S.answers.length}/${S.questions.length} answered`;
  }
  function refreshControls() {
    const hasCam = !!(media && media.vstream);
    $('#micBtn').innerHTML = ic(S.muted ? 'micOff' : 'mic'); $('#micBtn').classList.toggle('off', S.muted);
    $('#camBtn').innerHTML = ic(hasCam ? 'video' : 'videoOff'); $('#camBtn').classList.toggle('off', !hasCam);
    $('#ttsBtn').innerHTML = ic(S.ttsOn ? 'vol' : 'volOff'); $('#ttsBtn').classList.toggle('off', !S.ttsOn);
  }
  function refreshActions() {
    const a = $('#actions'), p = S.phase, last = S.idx + 1 >= S.questions.length;
    const btn = (iv, cls, icon, t) => `<button class="btn ${cls} sm" data-iv="${iv}">${icon ? ic(icon) : ''}${t}</button>`;
    if (p === 'asking') a.innerHTML = `<span class="grow">Nova is asking the question...</span>${btn('skipvoice', 'ghost', 'skip', 'Skip voice')}`;
    else if (p === 'ready') a.innerHTML = `<span class="grow">Ready when you are.</span>${btn('skip', 'ghost', '', 'Skip question')}${btn('start', 'primary', 'mic', 'Start answering')}`;
    else if (p === 'listening') a.innerHTML = `<span class="grow">${Listener.supported ? 'Speak naturally, then press Submit when you are done.' : 'Type your answer on the right, then press Enter.'}</span>${btn('redo', 'ghost', 'replay', 'Re-record')}${btn('skip', 'ghost', '', 'Skip')}${btn('submit', 'primary', 'check', 'Submit answer')}`;
    else if (p === 'scoring') a.innerHTML = `<span class="grow">Scoring your answer with the neural network...</span>`;
    else a.innerHTML = `<span class="grow">Answer scored. Take a breath.</span>${btn('next', 'primary', 'arrowR', last ? 'Finish and view report' : 'Next question')}`;
  }
  function refreshTiles() {
    const n = S.questions.length, s = Math.max(0, Math.min(S.idx, n - 3)), shown = [s, s + 1, s + 2];
    const tile = (i) => { const done = i < S.answers.length, cur = i === S.idx && !done || (i === S.idx && S.phase !== 'review'); const cls = done ? 'done' : i === S.idx ? 'cur' : 'pend'; return `<div class="tile ${cls}"><div class="tc">${done ? ic('check') : 'Q' + (i + 1)}</div><div class="nm"><i></i>${esc((S.questions[i].topic || '').split(' ').slice(0, 2).join(' ') || 'Question')}</div></div>`; };
    $('#tiles').innerHTML = `<div class="tile ai" id="aiTile"><div class="tc">N</div><div class="nm"><i></i>Nova (AI)</div></div>${shown.map(tile).join('')}<div class="tile more">+${n - 3}</div>`;
  }
  function refreshTip() {
    const q = Q();
    if (S.hint) { $('#tipT').textContent = 'Hint'; $('#tipP').textContent = q.hint; }
    else { $('#tipT').textContent = 'Coach tip'; $('#tipP').textContent = q.type === 'behav' ? 'Use STAR: Situation, Task, Action, Result. End with what you learned.' : 'Aim for 45 to 90 seconds: define it, explain how it works, give an example.'; }
  }
  function setSpeaking(on) { const s = $('#speaking'), t = $('#aiTile'); s && s.classList.toggle('on', on); t && t.classList.toggle('speak', on); }
  function setStatus(cls, text) { const el = $('#status'); if (!el) return; el.className = 'chip-status ' + cls; $('#statusT').textContent = text; }

  function tick() {
    if (!S || !$('#sidePill')) return;
    $('#sidePill').innerHTML = `${ic('clock')}<span><b>${fmt((Date.now() - S.startedAt) / 1000)}</b> elapsed</span>`;
    const p = S.phase;
    if (p === 'listening') {
      const sec = (Date.now() - S.listenStart) / 1000;
      setStatus('listen', S.muted ? `Mic muted · ${fmt(sec)}` : Listener.supported ? `Listening · ${fmt(sec)}` : `Type your answer · ${fmt(sec)}`);
    } else if (p === 'asking') setStatus('', 'Nova is asking');
    else if (p === 'scoring') setStatus('', 'Scoring...');
    else if (p === 'review') setStatus('review', 'Answer scored');
    else setStatus('', p === 'ready' ? 'Ready' : 'Getting ready');
    insights();
  }
  function insights() {
    const el = $('#ins'); if (!el) return;
    let wc = 0, wpm = null, fill = 0, R = Eval.RANGES[Q().type || 'tech'];
    const last = S.answers[S.answers.length - 1];
    if (S.phase === 'listening') {
      const t = (listener.finalText + ' ' + listener.interim + ' ' + S.typed).trim();
      const an = Eval.analyze(t, Q(), { speakSec: listener.firstWordAt ? (Date.now() - listener.firstWordAt) / 1000 : 0 }, S.level);
      wc = an.wc; wpm = an.wpm; fill = an.fillerTotal;
    } else if (last && S.phase === 'review') { wc = last.an.wc; wpm = last.an.wpm; fill = last.an.fillerTotal; }
    const paceStatus = wpm == null ? ['Waiting', 'warn', 0] : wpm > 165 ? ['Too fast', 'warn', 60] : wpm < 100 ? ['A bit slow', 'warn', 60] : ['On track', 'good', 100];
    const lenPct = Math.min(100, Math.round(wc / R.words[0] * 100));
    const fStatus = fill <= 2 ? ['Clean', 'good'] : fill <= 4 ? ['Watch it', 'warn'] : ['High', 'bad'];
    const row = (icon, title, sub, c1, v1, c2, v2, pct, cls) => `<div class="ins-row"><div class="ii">${ic(icon)}</div><div><b>${title}</b><div class="sm">${sub}</div></div><div class="col">${c1} <em>${v1}</em></div><div class="col">${c2} <em>${v2}</em></div><div class="bar ${cls}"><i style="width:${pct}%"></i></div></div>`;
    el.innerHTML =
      row('clock', 'Speaking pace', wpm ? `${wpm} words per minute` : 'Starts when you speak', 'Ideal', '110-160', 'Status', paceStatus[0], paceStatus[2], paceStatus[1]) +
      row('msg', 'Answer length', `${wc} words so far`, 'Target', `${R.words[0]}-${R.words[1]}`, 'Progress', lenPct + '%', lenPct, lenPct >= 100 ? 'good' : '') +
      row('alert', 'Filler words', `${fill} so far`, 'Goal', 'under 3', 'Status', fStatus[0], Math.min(100, fill * 17), fStatus[1]);
  }

  /* ---------- chat ---------- */
  function msgHTML(m) {
    if (m.kind === 'ai') return `<div class="msg"><div class="av">N</div><div class="bub"><div class="who"><b>Nova · ${m.label}</b><span>${m.time}</span></div>${esc(m.text)}</div></div>`;
    if (m.kind === 'me') return `<div class="msg me"><div class="bub"><div class="who"><b>You</b><span>${m.time} ✓✓</span></div>${esc(m.text)}</div></div>`;
    const d = m.sc.dims, names = NS.ANN.OUTPUTS;
    return `<div class="msg"><div class="av">N</div><div class="bub"><div class="who"><b>Nova · Feedback</b><span>${m.time}</span></div><div class="chips"><span class="big">${m.sc.overall}/100</span>${d.map((v, i) => `<span>${names[i].slice(0, 7)} ${v}</span>`).join('')}</div>${m.tip ? `<ul><li>${esc(m.tip)}</li></ul>` : ''}</div></div>`;
  }
  function addMsg(m) { m.time = now(); S.msgs.push(m); renderChat(); }
  function renderChat() { const c = $('#chat'); if (!c) return; c.innerHTML = S.msgs.map(msgHTML).join(''); c.scrollTop = c.scrollHeight; }
  function liveBubble(text) {
    const c = $('#chat'); if (!c) return;
    let b = $('#liveBubble');
    if (!b) { c.insertAdjacentHTML('beforeend', `<div class="msg me" id="liveBubble"><div class="bub live"><div class="who"><b>You</b><span>speaking</span></div><span id="liveT"></span></div></div>`); b = $('#liveBubble'); }
    $('#liveT').textContent = text || (Listener.supported ? 'Listening...' : 'Type your answer below...');
    c.scrollTop = c.scrollHeight;
  }
  function removeLive() { const b = $('#liveBubble'); b && b.remove(); }

  function meterLoop() {
    const f = $('#vol'); if (!f) return;
    const v = media && media.stream && S.phase === 'listening' && !S.muted ? media.level() : 0;
    f.style.height = Math.max(4, Math.round(v * 92)) + '%';
    raf = requestAnimationFrame(meterLoop);
  }

  NS.Interview = { start, render, suspend };
})();
