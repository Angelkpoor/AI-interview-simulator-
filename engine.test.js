globalThis.IAI = {};
const ANN = require('../src/ann.js'); require('../src/questions.js'); const E = require('../src/evaluate.js');
(async () => {
  const t0 = Date.now();
  const m = await ANN.trainModel({ epochs: 45 });
  console.log('train ms', Date.now() - t0, 'params', m.net.paramCount(), 'first', m.history[0].loss.toFixed(4), 'last', m.history.at(-1).loss.toFixed(4), 'test', m.test);
  // teacher agreement
  const ds = ANN.makeDataset(300, 99); let ok = 0;
  ds.X.forEach((x, i) => { const p = m.net.predict(x); if (p.every((v, k) => Math.abs(v - ds.Y[i][k]) < 0.1)) ok++; });
  console.log('within 0.10 on all 4 outputs:', (ok / 3).toFixed(1) + '%');
  const iv = IAI.buildInterview('be', 2, 7, '', 1);
  console.log(iv.questions.map(q => `${q.type}/${q.t}: ${q.q.slice(0, 50)}`).join('\n'));
  const q = iv.questions.find(x => x.type === 'tech');
  const good = "First, caching. I would keep services stateless so we can scale horizontally behind a load balancer, and cache hot reads with redis or a cdn. For example in my project we added read replicas and an index, which cut latency by 40%. We also apply rate limits, paginate results and move slow work to a queue. Finally I monitor latency and errors to find bottlenecks, because that tells us where to invest.";
  const weak = "um I think maybe like you know it is basically just a server and, like, you add more servers I guess";
  for (const [n, t, sec] of [['good', good, 55], ['weak', weak, 12], ['empty', '', 0]]) {
    const an = E.analyze(t, q, { speakSec: sec, thinkSec: 3 }, 2);
    const sc = E.score(m.net, an.features, an.wc); const fb = E.feedback(an, sc, q);
    console.log(n, sc.dims, sc.overall, 'wpm', an.wpm, 'kw', an.matched.length + '/' + q.kw.length); console.log(' good', fb.good, '\n fix', fb.fix);
  }
  console.log(E.highlight(E.analyze(weak, q, {speakSec: 12}, 2)));
})();
