/* Turns a spoken answer (transcript + timing) into 13 numeric features, asks the
   neural network for four scores, and writes student friendly feedback. */
(function () {
  const NS = (globalThis.IAI = globalThis.IAI || {});
  const { clip } = NS.ANN;

  const STOP = new Set('a an the and or but if so of to in on at for with by from as is are was were be been it its this that these those i you we they he she my our your their me do does did have has had will would can could should not no yes very just also than then there here what which who when where how why about into over under more most some any'.split(' '));
  const FILLERS = ['um', 'uh', 'uhm', 'umm', 'er', 'erm', 'hmm', 'like', 'you know', 'basically', 'actually', 'literally', 'i mean', 'you see'];
  const HEDGES = ['maybe', 'i think', 'i guess', "i'm not sure", 'not sure', 'probably', 'kind of', 'sort of', "i don't know", 'perhaps', 'might be'];
  const STRUCT = ['first', 'firstly', 'second', 'secondly', 'third', 'then', 'next', 'finally', 'because', 'therefore', 'so that', 'for example', 'for instance', 'such as', 'in summary', 'to summarize', 'overall', 'however', 'trade-off', 'tradeoff', 'on the other hand', 'as a result', 'which means', 'the reason', 'in my experience'];
  const EXAMPLE_RX = /\b\d+(\.\d+)?%?|for example|for instance|such as|i built|i made|i used|i worked|i developed|i created|in my project|in my previous|at my internship|in college|we used|our team|my team/g;

  const RANGES = {
    intro: { words: [60, 150], secs: [30, 90] },
    tech: { words: [55, 150], secs: [35, 120] },
    behav: { words: [80, 190], secs: [50, 150] },
  };

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const norm = (t) => t.toLowerCase().replace(/[‘’]/g, "'");
  const tokens = (t) => norm(t).match(/[a-z0-9']+/g) || [];

  function phraseMatches(text, phrase, prefix) {
    const rx = new RegExp("(?<![a-z0-9'])" + esc(phrase) + (prefix ? "[a-z0-9']*" : "(?![a-z0-9'])"), 'g');
    const out = []; let m;
    while ((m = rx.exec(text))) { out.push({ start: m.index, end: m.index + m[0].length }); if (m[0].length === 0) rx.lastIndex++; }
    return out;
  }

  function tf(words) {
    const m = new Map();
    words.filter((w) => !STOP.has(w) && w.length > 1).forEach((w) => m.set(w, (m.get(w) || 0) + 1));
    return m;
  }
  function cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    a.forEach((v, k) => { na += v * v; if (b.has(k)) dot += v * b.get(k); });
    b.forEach((v) => (nb += v * v));
    return na && nb ? dot / Math.sqrt(na * nb) : 0;
  }
  const stem = (w) => w.replace(/(ing|ed|es|s)$/, '');
  const stemTf = (m) => { const o = new Map(); m.forEach((v, k) => o.set(stem(k), (o.get(stem(k)) || 0) + v)); return o; };

  function rangeFit(v, lo, hi) {
    if (v < lo) return clip(v / lo);
    if (v <= hi) return 1;
    return clip(1 - (v - hi) / hi * 0.8, 0.2, 1);
  }

  function analyze(text, q, timing, level) {
    const lower = norm(text || '');
    const words = tokens(lower);
    const wc = words.length;
    const type = q.type || 'tech';
    const R = RANGES[type];
    const typed = !!(timing && timing.typed);

    const matched = [], missed = [], kwRanges = [];
    q.kw.forEach((k) => {
      const alts = k.split('|');
      let hit = false;
      alts.forEach((a) => { const m = phraseMatches(lower, a.trim(), true); if (m.length) { hit = true; kwRanges.push(...m.map((x) => ({ ...x, cls: 'kw' }))); } });
      (hit ? matched : missed).push(alts[0].trim());
    });

    const fillerCounts = {}, fillRanges = []; let fillerTotal = 0;
    FILLERS.forEach((f) => { const m = phraseMatches(lower, f, false); if (m.length) { fillerCounts[f] = m.length; fillerTotal += m.length; fillRanges.push(...m.map((x) => ({ ...x, cls: 'fill' }))); } });
    let hedgeTotal = 0; const hedgeRanges = [];
    HEDGES.forEach((h) => { const m = phraseMatches(lower, h, false); hedgeTotal += m.length; hedgeRanges.push(...m.map((x) => ({ ...x, cls: 'hedge' }))); });
    const structHits = STRUCT.filter((s) => phraseMatches(lower, s, false).length);
    const examples = (lower.match(EXAMPLE_RX) || []).length;

    const uniq = new Set(words).size;
    const avgWl = wc ? words.reduce((s, w) => s + w.length, 0) / wc : 0;
    const ref = tf(tokens(q.model + ' ' + q.kw.map((k) => k.split('|')[0]).join(' ')));
    const cos = cosine(stemTf(tf(words)), stemTf(ref));

    const speakSec = !typed && timing && timing.speakSec ? timing.speakSec : 0;
    const wpm = speakSec >= 4 ? Math.round(wc / (speakSec / 60)) : null;
    let paceFit;
    if (typed) paceFit = 0.65;
    else if (wpm == null) paceFit = 0.25;
    else { const d = wpm < 110 ? 110 - wpm : wpm > 160 ? wpm - 160 : 0; paceFit = clip(1 - d / 70); }
    const durFit = typed || !speakSec ? rangeFit(wc, R.words[0], R.words[1]) : rangeFit(speakSec, R.secs[0], R.secs[1]);

    const features = [
      rangeFit(wc, R.words[0], R.words[1]),
      q.kw.length ? clip(matched.length / Math.max(3, Math.ceil(q.kw.length * 0.6))) : 0,
      clip(cos / 0.55),
      wc ? clip((uniq / Math.sqrt(wc) - 2.5) / 6) : 0,
      clip((avgWl - 3.4) / 2.6),
      wc ? clip(fillerTotal / wc / 0.08) : 0,
      clip(structHits.length / 5),
      clip(examples / 3),
      wc ? clip(hedgeTotal / wc / 0.05) : 0,
      paceFit,
      durFit,
      wc ? clip(matched.length / (wc / 20 + 1) / 1.2) : 0,
      level / 3,
    ];
    return {
      features, wc, wpm, speakSec: Math.round(speakSec), thinkSec: timing && timing.thinkSec != null ? Math.round(timing.thinkSec) : null,
      typed, matched, missed, fillerCounts, fillerTotal, hedgeTotal, structHits, examples,
      ranges: [...kwRanges, ...fillRanges, ...hedgeRanges], text: text || '',
    };
  }

  function score(net, features, wc) {
    if (wc < 3) return { dims: [5, 5, 5, 5], overall: 5, skipped: true };
    const o = net.predict(features).map((v) => Math.round(v * 100));
    return { dims: o, overall: Math.round(0.4 * o[0] + 0.2 * o[1] + 0.2 * o[2] + 0.2 * o[3]), skipped: false };
  }

  function feedback(an, sc, q) {
    const f = an.features, good = [], fix = [];
    const R = RANGES[q.type || 'tech'];
    if (sc.skipped) return { good: [], fix: ['No answer was captured. Check your microphone or type your answer, then try again.'] };
    if (f[1] >= 0.6) good.push(`Covered the key ideas: ${an.matched.slice(0, 4).join(', ')}.`);
    else if (an.matched.length) good.push(`Touched on ${an.matched.slice(0, 3).join(', ')}.`);
    if (f[6] >= 0.6) good.push(`Clear structure using signposts like "${an.structHits.slice(0, 2).join('", "')}".`);
    if (f[7] >= 0.5) good.push('Backed the answer with an example, a number or your own experience.');
    if (f[5] <= 0.2 && an.wc > 25) good.push('Clean delivery with very few filler words.');
    if (!an.typed && an.wpm && an.wpm >= 110 && an.wpm <= 160) good.push(`Comfortable pace at ${an.wpm} words per minute.`);

    if (f[1] < 0.6 && an.missed.length) fix.push(`Add the missing concepts: ${an.missed.slice(0, 4).join(', ')}.`);
    if (an.wc < R.words[0]) fix.push(`The answer was short (${an.wc} words). Aim for ${R.words[0]} to ${R.words[1]} words, about ${R.secs[0]} to ${R.secs[1]} seconds.`);
    if (an.wc > R.words[1] * 1.3) fix.push(`The answer ran long (${an.wc} words). Lead with the main point and trim side details.`);
    if (f[6] < 0.4) fix.push(q.type === 'behav' ? 'Use STAR: Situation, Task, Action, Result.' : 'Give it a shape: definition, how it works, an example, then a trade-off.');
    if (f[7] < 0.3) fix.push('Add one concrete example, number or project from your own experience.');
    if (f[5] > 0.35) { const top = Object.entries(an.fillerCounts).sort((a, b) => b[1] - a[1])[0]; fix.push(`Reduce filler words (${an.fillerTotal} found, most often "${top[0]}"). Pause silently instead.`); }
    if (f[8] > 0.35) fix.push('Replace hedges like "I think" or "maybe" with direct statements.');
    if (!an.typed && an.wpm) { if (an.wpm > 170) fix.push(`You spoke fast (${an.wpm} wpm). Slow down to around 130.`); else if (an.wpm < 95) fix.push(`Your pace was slow (${an.wpm} wpm). Practise to reach about 120 to 140.`); }
    if (an.thinkSec != null && an.thinkSec > 12) fix.push(`It took ${an.thinkSec} seconds to start. Buy time with "Let me think for a moment" and then give a structured answer.`);
    return { good: good.slice(0, 3), fix: fix.slice(0, 4) };
  }

  function highlight(an) {
    const esch = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const text = an.text;
    const lowerLen = norm(text).length === text.length;
    if (!lowerLen) return esch(text);
    const prio = { fill: 3, hedge: 2, kw: 1 };
    const r = [...an.ranges].sort((a, b) => a.start - b.start || prio[b.cls] - prio[a.cls] || (b.end - b.start) - (a.end - a.start));
    let out = '', pos = 0;
    for (const m of r) {
      if (m.start < pos) continue;
      out += esch(text.slice(pos, m.start)) + `<mark class="${m.cls}">${esch(text.slice(m.start, m.end))}</mark>`;
      pos = m.end;
    }
    return out + esch(text.slice(pos));
  }

  const verdictFor = (s) => (s >= 80 ? 'Interview ready' : s >= 65 ? 'Almost there' : s >= 50 ? 'Getting there' : 'Needs focused practice');
  const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

  function summarize(session) {
    const A = session.answers;
    const dims = [0, 1, 2, 3].map((i) => Math.round(avg(A.map((a) => a.score.dims[i]))));
    const overall = Math.round(avg(A.map((a) => a.score.overall)));
    const spoken = A.filter((a) => a.an.wpm);
    const avgWpm = spoken.length ? Math.round(avg(spoken.map((a) => a.an.wpm))) : null;
    const fillers = {}; let fillerTotal = 0, hedgeTotal = 0, words = 0;
    A.forEach((a) => { fillerTotal += a.an.fillerTotal; hedgeTotal += a.an.hedgeTotal; words += a.an.wc; Object.entries(a.an.fillerCounts).forEach(([k, v]) => (fillers[k] = (fillers[k] || 0) + v)); });
    const missedAll = {};
    A.forEach((a) => a.an.missed.forEach((m) => (missedAll[m] = (missedAll[m] || 0) + 1)));
    const minutes = Math.max(1, Math.round((session.endedAt - session.startedAt) / 60000));
    const best = A.reduce((b, a, i) => (a.score.overall > A[b].score.overall ? i : b), 0);
    const worst = A.reduce((b, a, i) => (a.score.overall < A[b].score.overall ? i : b), 0);

    const names = NS.ANN.OUTPUTS, order = dims.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    const strengths = [], focus = [], plan = [];
    strengths.push(`${names[order[0][1]]} is your strongest area at ${order[0][0]}.`);
    if (avgWpm && avgWpm >= 110 && avgWpm <= 160) strengths.push(`Steady pace of ${avgWpm} words per minute.`);
    if (fillerTotal / Math.max(words, 1) < 0.02) strengths.push('Very few filler words.');
    if (A[best].score.overall >= 60) strengths.push(`Best answer: Q${best + 1}, ${A[best].q.topic}.`);
    focus.push(`${names[order[3][1]]} is the lowest at ${order[3][0]}.`);
    if (fillerTotal / Math.max(words, 1) >= 0.03) focus.push(`${fillerTotal} filler words across the interview.`);
    if (avgWpm && (avgWpm < 105 || avgWpm > 165)) focus.push(`Pace of ${avgWpm} wpm is outside the 110 to 160 comfort zone.`);
    focus.push(`Weakest answer: Q${worst + 1}, ${A[worst].q.topic}.`);

    const lowContent = A.filter((a) => a.q.type === 'tech').sort((a, b) => a.score.dims[0] - b.score.dims[0]).slice(0, 2);
    lowContent.forEach((a) => { if (a.score.dims[0] < 75) plan.push({ text: `Revise "${a.q.topic}" and say: ${a.an.missed.slice(0, 3).join(', ') || 'the core idea'}.` }); });
    if (dims[1] < 70) plan.push({ text: 'Practise a fixed answer shape: definition, how it works, example, trade-off.' });
    if (fillerTotal / Math.max(words, 1) >= 0.025) plan.push({ text: 'Record yourself and replace every filler word with a short pause.' });
    if (avgWpm && (avgWpm < 105 || avgWpm > 165)) plan.push({ text: avgWpm > 165 ? 'Slow down: practise at about 130 words per minute.' : 'Speed up slightly: aim for 120 to 140 words per minute.' });
    if (avg(A.map((a) => a.an.features[7])) < 0.4) plan.push({ text: 'Prepare three personal examples (project, bug, result) you can reuse.' });
    if (hedgeTotal > 4) plan.push({ text: 'Replace "I think" and "maybe" with direct statements.' });
    plan.push({ text: 'Retake this interview in a few days and compare your scores.' });
    return { dims, overall, verdict: verdictFor(overall), avgWpm, fillers, fillerTotal, hedgeTotal, words, minutes, best, worst, strengths: strengths.slice(0, 4), focus: focus.slice(0, 4), plan: plan.slice(0, 5), missedAll };
  }

  NS.Eval = { analyze, score, feedback, highlight, summarize, verdictFor, FILLERS, HEDGES, RANGES };
  if (typeof module !== 'undefined') module.exports = NS.Eval;
})();
