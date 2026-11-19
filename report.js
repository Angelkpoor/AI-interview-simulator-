/* Evaluation dashboard (styled after the second reference image). */
(function () {
  const NS = (globalThis.IAI = globalThis.IAI || {});
  const U = NS.UI, { state, $, ic, esc, fmt, toast } = U;
  const { ANN, LEVELS, Eval } = NS;
  let R = null, tab = 'overview', done = {}, accOpen = 0;

  function show(rec) {
    R = rec; tab = 'overview'; done = {}; accOpen = 0;
    document.body.classList.add('report-mode');
    $('#report').hidden = false; draw(); window.scrollTo({ top: 0 });
  }
  const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const TABS = [['overview', 'Overview'], ['answers', 'Answers'], ['delivery', 'Delivery'], ['ann', 'ANN insights']];

  function draw() {
    const s = R.summary, A = R.answers;
    const greet = s.overall >= 80 ? 'Outstanding work' : s.overall >= 65 ? 'Nice work' : s.overall >= 50 ? 'Good start' : 'Keep going';
    const order = s.dims.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    const rank = {}; order.forEach(([, i], r) => (rank[i] = r));
    const pcls = ['k', 'c', 'h', 'o'];
    $('#report').innerHTML = `<div class="rpt">
      <header class="rpt-top"><button class="logo-pill" data-r="home">InterviewAI</button>
        <nav class="nav-pill">${TABS.map(([k, t]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${t}</button>`).join('')}</nav>
        <button class="pill-btn" data-r="new">${ic('refresh')} New interview</button>
        <button class="circle-w" data-r="print" title="Print or save as PDF" aria-label="Print">${ic('download')}</button>
        <button class="circle-w" data-r="history" title="All reports" aria-label="Reports">${ic('user')}</button></header>
      <h1 class="rpt-h">${greet}, ${esc(R.name)}</h1>
      <div class="rpt-stats">
        <div class="pillbars">${ANN.OUTPUTS.map((n, i) => `<div class="pb" style="flex:${Math.max(8, s.dims[i])} 1 0"><span>${n}</span><div class="p ${pcls[i]}">${s.dims[i]}%</div></div>`).join('')}</div>
        <div class="bignums"><div><b>${s.overall}</b><span>Overall</span></div><div><b>${A.length}</b><span>Questions</span></div><div><b>${s.minutes}</b><span>Minutes</span></div></div>
      </div>
      <div id="tabBody">${tab === 'overview' ? overview(s, A, rank) : tab === 'answers' ? answers(A) : tab === 'delivery' ? delivery(s, A) : annTab(s, A)}</div>
      <p class="rpt-foot">Scores come from a neural network trained on a scoring rubric. Use them as practice guidance, not as a hiring verdict. ${esc(s.verdict)}.</p>
    </div>`;
  }

  /* ---------- overview ---------- */
  function overview(s, A, rank) {
    const lvl = LEVELS[R.level].name;
    const best = A.reduce((b, a, i) => (a.score.overall > A[b].score.overall ? i : b), 0);
    const circ = 2 * Math.PI * 60, ratio = s.avgWpm ? Math.min(s.avgWpm / 200, 1) : 0;
    const inZone = s.avgWpm && s.avgWpm >= 110 && s.avgWpm <= 160;
    const scls = (i) => ['c', 'k', 'g', 'l'][Math.min(3, rank[i])];
    const T = Math.max(1, (R.endedAt - R.startedAt) / 1000);
    const icons = ['target', 'mic', 'clock', 'msg', 'spark'];
    const doneN = Object.values(done).filter(Boolean).length;
    const missed = Object.entries(s.missedAll).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const fills = Object.entries(s.fillers).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const acc = [
      ['What went well', `<ul>${s.strengths.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`],
      ['Focus areas', `<ul>${s.focus.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`],
      ['Filler words', fills.length ? `<div class="tags">${fills.map(([k, v]) => `<span>${esc(k)} ×${v}</span>`).join('')}</div><p style="margin:8px 0 0">${s.fillerTotal} fillers in ${s.words} words. Hedges like "I think": ${s.hedgeTotal}.</p>` : '<p style="margin:0">None detected. Clean delivery.</p>'],
      ['Concepts to revise', missed.length ? `<div class="tags">${missed.map(([k, v]) => `<span>${esc(k)}</span>`).join('')}</div>` : '<p style="margin:0">You covered nearly every expected concept.</p>'],
    ];
    return `<div class="bento">
      <div class="g g-photo">${R.snapshot ? `<div class="ph" style="background-image:url(${R.snapshot})"></div>` : `<div class="ph init">${esc(R.name.charAt(0).toUpperCase())}</div>`}
        <div class="cap"><div><b>${esc(R.name)}</b><span>${esc(R.roleName)} · ${lvl}</span></div><div class="sc">${s.overall}/100</div></div></div>
      <div class="g g-bars"><h4>Score by question</h4><button class="arrow" data-tab="answers" aria-label="Open answers">${ic('arrowUR')}</button>
        <div class="big-thin">${s.overall}<small>avg</small></div>
        <div class="rbars">${A.map((a, i) => `<div class="bar-c ${i === best ? 'top' : ''}" data-goto="${i}" title="${esc(a.q.topic)}"><span class="tip">${a.score.overall}</span><div class="b" style="height:${Math.max(12, a.score.overall * 0.78)}px"></div><div class="dot"></div><span>Q${i + 1}</span></div>`).join('')}</div></div>
      <div class="g g-ring"><h4>Speaking pace</h4><button class="arrow" data-tab="delivery" aria-label="Open delivery">${ic('arrowUR')}</button>
        <div class="ring-wrap"><svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="73" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1" stroke-dasharray="2 4"/><circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="9"/><circle cx="80" cy="80" r="60" fill="none" stroke="#58d9f8" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(ratio * circ).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 80 80)"/></svg><div class="ring-c"><b>${s.avgWpm || '-'}</b><span>${s.avgWpm ? 'words / min' : 'typed answers'}</span></div></div>
        <div class="ring-btn"><span>Ideal 110 to 160</span><span>${s.avgWpm ? (inZone ? 'On target' : s.avgWpm > 160 ? 'Too fast' : 'Too slow') : 'No audio'}</span></div></div>
      <div class="g-side">
        <div class="g-skill"><div class="top"><h4 style="margin:0">Skills</h4><div class="big-thin">${s.overall}%</div></div>
          <div class="seg-bars">${s.dims.map((v, i) => `<div style="flex:${Math.max(18, v)} 1 0"><span class="t">${v}%</span><div class="s ${scls(i)}"><span>${ANN.OUTPUTS[i]}</span><b style="font-weight:400">${v}%</b></div></div>`).join('')}</div></div>
        <div class="g-plan"><div class="hd"><b>Action plan</b><span>${doneN}/${s.plan.length}</span></div>
          ${s.plan.map((p, i) => `<button class="todo ${done[i] ? 'done' : ''}" data-plan="${i}"><span class="ti">${ic(icons[i % 5])}</span><span class="tx">${esc(p.text)}</span><span class="ck">${ic('check')}</span></button>`).join('')}</div>
      </div>
      <div class="g g-acc">${acc.map(([t, b], i) => `<div class="acc-i ${accOpen === i ? 'open' : ''}"><button class="acc-h" data-acc="${i}"><span>${t}</span>${ic('chev')}</button><div class="acc-b">${b}</div></div>`).join('')}</div>
      <div class="g g-time"><div class="t-head"><span>Start</span><b>Interview timeline</b><span>${fmt(T)}</span></div>
        <div class="t-grid"><div class="t-inner"><div class="t-axis">${[0, 1, 2, 3, 4].map((i) => `<i><b>${fmt(T * i / 4)}</b></i>`).join('')}</div>
          ${A.map((a, i) => { const l = Math.min(100, a.t0 / T * 100), w = Math.max(2, a.dur / T * 100); return `<div class="t-row"><div class="t-ev ${a.score.overall >= 70 ? 'hi' : ''}" data-goto="${i}" style="left:min(${l.toFixed(1)}%,calc(100% - 190px));width:max(${w.toFixed(1)}%,190px)"><div><b>Q${i + 1} · ${esc(a.q.topic)}</b><small>Score ${a.score.overall} · ${fmt(a.dur)}</small></div><div class="mini"><i>${a.score.overall >= 70 ? '✓' : '!'}</i><i>${a.an.matched.length}</i></div></div></div>`; }).join('')}</div></div></div>
    </div>`;
  }

  /* ---------- answers ---------- */
  function answers(A) {
    return A.map((a, i) => {
      const d = a.score.dims, mx = Math.max(...d), n = ANN.OUTPUTS;
      const an = a.an;
      const hits = an.matched.map((k) => `<span>✓ ${esc(k)}</span>`).join('') + an.missed.map((k) => `<span style="opacity:.5">+ ${esc(k)}</span>`).join('');
      return `<article class="ans" id="ans-${i}">
        <div class="ans-h"><div><div class="qn">Question ${i + 1} · ${esc(a.q.topic)}</div><h3>${esc(a.q.q)}</h3></div><div class="ans-score"><div class="big">${a.score.overall}</div></div></div>
        <div class="dims4">${d.map((v, k) => `<div class="dim ${v === mx ? 'best' : ''}">${n[k]}<b>${v}</b><div class="mb"><i style="width:${v}%"></i></div></div>`).join('')}</div>
        <div class="said">${a.text ? Eval.highlight(an) : '<em>No answer was captured for this question.</em>'}</div>
        <div class="legend"><span><i style="background:#c8f1de"></i>Expected concept</span><span><i style="background:#ffd9a8"></i>Filler word</span><span><i style="background:#e5d9ff"></i>Hedge</span></div>
        <div class="metrics"><span>${an.wc} words</span><span>${an.typed ? 'typed answer' : an.wpm ? an.wpm + ' wpm' : 'pace n/a'}</span>${an.thinkSec != null ? `<span>started after ${an.thinkSec}s</span>` : ''}<span>${an.fillerTotal} fillers</span><span>${an.matched.length}/${a.q.kw.length} concepts</span></div>
        <div class="tags" style="margin-top:12px">${hits}</div>
        <div class="two"><div><h5>What went well</h5>${a.fb.good.length ? `<ul>${a.fb.good.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p style="margin:0">Nothing stood out yet. Focus on the fixes.</p>'}</div><div><h5>To improve</h5>${a.fb.fix.length ? `<ul>${a.fb.fix.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p style="margin:0">Great answer. Keep this up.</p>'}</div></div>
        <details><summary>${esc(a.q.modelLabel || 'Model answer')}</summary><p style="margin:10px 0 0">${esc(a.q.model)}</p></details>
        <details><summary>What the neural network saw</summary>${ANN.FEATURES.map((f, k) => `<div class="frow"><span title="${esc(f.hint)}">${f.label}</span><div class="tr"><i style="width:${Math.round(an.features[k] * 100)}%"></i></div><span>${Math.round(an.features[k] * 100)}</span></div>`).join('')}</details>
      </article>`;
    }).join('');
  }

  /* ---------- delivery ---------- */
  function delivery(s, A) {
    const think = A.filter((a) => a.an.thinkSec != null);
    const tAvg = think.length ? Math.round(avg(think.map((a) => a.an.thinkSec))) : null;
    const tips = [];
    if (s.avgWpm && s.avgWpm > 160) tips.push('Slow down. Pause for a full second after each key point.');
    if (s.avgWpm && s.avgWpm < 110) tips.push('Pick up the pace a little. Practise answering out loud with a timer.');
    if (s.fillerTotal / Math.max(1, s.words) > 0.03) tips.push('Replace filler words with a silent pause. Pauses sound confident.');
    if (tAvg != null && tAvg > 8) tips.push('You took a while to start. It is fine to say "Let me structure my thoughts" and then begin.');
    if (!tips.length) tips.push('Your delivery is solid. Keep practising under time pressure.');
    return `<div class="tiles4">
      <div class="g"><h4>Average pace</h4><div class="big-thin">${s.avgWpm || '-'}<small>wpm</small></div></div>
      <div class="g"><h4>Words spoken</h4><div class="big-thin">${s.words}</div></div>
      <div class="g"><h4>Filler words</h4><div class="big-thin">${s.fillerTotal}</div></div>
      <div class="g"><h4>Average start delay</h4><div class="big-thin">${tAvg != null ? tAvg : '-'}<small>sec</small></div></div></div>
      <div class="g" style="margin-top:14px"><h4>Per answer</h4><table class="dl"><thead><tr><th>Question</th><th>Pace (ideal zone shaded)</th><th>Speaking</th><th>Start delay</th><th>Fillers</th><th>Hedges</th></tr></thead><tbody>
      ${A.map((a, i) => `<tr><td>Q${i + 1}</td><td>${a.an.wpm ? `<div class="pace-bar"><div class="zone" style="left:${110 / 2.2}%;width:${50 / 2.2}%"></div><i style="left:${Math.min(100, a.an.wpm / 2.2)}%"></i></div><small>${a.an.wpm} wpm</small>` : a.an.typed ? 'typed' : 'n/a'}</td><td>${a.an.speakSec ? fmt(a.an.speakSec) : '-'}</td><td>${a.an.thinkSec != null ? a.an.thinkSec + 's' : '-'}</td><td>${a.an.fillerTotal}</td><td>${a.an.hedgeTotal}</td></tr>`).join('')}</tbody></table></div>
      <div class="g" style="margin-top:14px"><h4>How to improve your delivery</h4><ul style="margin:8px 0 0;padding-left:18px;line-height:1.7;font-weight:300">${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
  }

  /* ---------- ANN ---------- */
  function annTab(s, A) {
    const F = ANN.FEATURES.map((f, k) => ({ f, v: avg(A.map((a) => a.an.features[k])) }));
    return `<div class="g" style="margin-top:14px"><h4>What the neural network noticed</h4>
      <p class="tabs-intro">Every answer is turned into 13 numbers between 0 and 1. A 13 to 16 to 8 to 4 neural network then predicts your Content, Structure, Clarity and Delivery scores. These are your averages across the interview.</p>
      ${F.map(({ f, v }, k) => `<div class="frow"><span title="${esc(f.hint)}">${f.label}${k === 5 || k === 8 ? ' (lower is better)' : ''}</span><div class="tr"><i style="width:${Math.round(v * 100)}%"></i></div><span>${Math.round(v * 100)}</span></div>`).join('')}
      <div style="margin-top:20px"><button class="pill-btn" data-r="lab" style="background:#1b1b1d;color:#fff">${ic('network')} Open the ANN Lab</button></div></div>`;
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    if ($('#report').hidden) return;
    const t = e.target, T = t.closest('[data-tab]');
    if (T) { tab = T.dataset.tab; draw(); return window.scrollTo({ top: 0, behavior: 'smooth' }); }
    const G = t.closest('[data-goto]');
    if (G) { tab = 'answers'; draw(); const el = $('#ans-' + G.dataset.goto); el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const P = t.closest('[data-plan]'); if (P) { done[P.dataset.plan] = !done[P.dataset.plan]; draw(); return; }
    const A = t.closest('[data-acc]'); if (A) { accOpen = accOpen === +A.dataset.acc ? -1 : +A.dataset.acc; draw(); return; }
    const B = t.closest('[data-r]'); if (!B) return;
    const r = B.dataset.r;
    if (r === 'home' || r === 'new') U.go('setup');
    else if (r === 'history') U.go('history');
    else if (r === 'lab') U.go('ann');
    else if (r === 'print') { try { window.print(); } catch (err) { toast("Use your browser's Print menu to save as PDF."); } }
  });

  NS.Report = { show };
})();
