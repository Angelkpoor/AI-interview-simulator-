/* From-scratch artificial neural network (multi layer perceptron).
   13 inputs -> 16 tanh -> 8 tanh -> 4 sigmoid outputs, trained with mini-batch Adam on MSE.
   No libraries. Works in the browser and in Node. */
(function () {
  const NS = (globalThis.IAI = globalThis.IAI || {});

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clip = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

  const FEATURES = [
    { key: 'len', label: 'Answer length fit', hint: 'Word count against the ideal range for this question type' },
    { key: 'kw', label: 'Keyword coverage', hint: 'Share of expected concepts that were mentioned' },
    { key: 'sim', label: 'Similarity to model answer', hint: 'Cosine similarity between your words and the reference answer' },
    { key: 'ld', label: 'Vocabulary variety', hint: 'Unique words relative to length' },
    { key: 'wl', label: 'Word precision', hint: 'Average word length, a proxy for technical vocabulary' },
    { key: 'fill', label: 'Filler words', hint: 'Like, basically, you know, actually (higher means more fillers)' },
    { key: 'sm', label: 'Structure markers', hint: 'First, because, for example, therefore, finally' },
    { key: 'ex', label: 'Examples and specifics', hint: 'Numbers, examples and phrases like "in my project"' },
    { key: 'hedge', label: 'Hedging', hint: 'Maybe, I think, not sure (higher means more hedging)' },
    { key: 'pace', label: 'Speaking pace fit', hint: 'Words per minute against the 110 to 160 comfort zone' },
    { key: 'dur', label: 'Answer duration fit', hint: 'Time spent speaking against the ideal range' },
    { key: 'kd', label: 'Keyword density', hint: 'Concept hits per 20 words' },
    { key: 'lvl', label: 'Experience level', hint: 'Fresher 0, Intern 0.33, Intermediate 0.67, Advanced 1' },
  ];
  const OUTPUTS = ['Content', 'Structure', 'Clarity', 'Delivery'];

  class MLP {
    constructor(sizes, seed) {
      this.sizes = sizes;
      const r = rng(seed || 7);
      this.W = []; this.b = []; this.mW = []; this.vW = []; this.mb = []; this.vb = [];
      for (let l = 0; l < sizes.length - 1; l++) {
        const nin = sizes[l], nout = sizes[l + 1];
        const lim = Math.sqrt(6 / (nin + nout));
        const W = Array.from({ length: nout }, () => Array.from({ length: nin }, () => (r() * 2 - 1) * lim));
        this.W.push(W);
        this.b.push(new Array(nout).fill(0));
        this.mW.push(W.map((row) => row.map(() => 0)));
        this.vW.push(W.map((row) => row.map(() => 0)));
        this.mb.push(new Array(nout).fill(0));
        this.vb.push(new Array(nout).fill(0));
      }
      this.t = 0;
    }
    forward(x, keep) {
      const acts = [x];
      let a = x;
      const L = this.W.length;
      for (let l = 0; l < L; l++) {
        const W = this.W[l], b = this.b[l];
        const out = new Array(W.length);
        for (let j = 0; j < W.length; j++) {
          let s = b[j];
          const row = W[j];
          for (let i = 0; i < row.length; i++) s += row[i] * a[i];
          out[j] = l === L - 1 ? 1 / (1 + Math.exp(-s)) : Math.tanh(s);
        }
        a = out;
        if (keep) acts.push(a);
      }
      return keep ? acts : a;
    }
    predict(x) { return this.forward(x, false); }
    // One epoch of mini-batch Adam. Returns mean squared error.
    trainEpoch(X, Y, lr, batch, r) {
      const n = X.length, L = this.W.length;
      const idx = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      let total = 0;
      for (let s = 0; s < n; s += batch) {
        const ids = idx.slice(s, s + batch);
        const gW = this.W.map((W) => W.map((row) => new Array(row.length).fill(0)));
        const gb = this.b.map((b) => new Array(b.length).fill(0));
        for (const id of ids) {
          const acts = this.forward(X[id], true);
          const out = acts[L], y = Y[id];
          let delta = out.map((o, k) => { const e = o - y[k]; total += e * e; return 2 * e * o * (1 - o) / out.length; });
          for (let l = L - 1; l >= 0; l--) {
            const aPrev = acts[l];
            const W = this.W[l];
            for (let j = 0; j < W.length; j++) {
              gb[l][j] += delta[j];
              const g = gW[l][j];
              for (let i = 0; i < aPrev.length; i++) g[i] += delta[j] * aPrev[i];
            }
            if (l > 0) {
              const nd = new Array(aPrev.length).fill(0);
              for (let i = 0; i < aPrev.length; i++) {
                let s2 = 0;
                for (let j = 0; j < W.length; j++) s2 += W[j][i] * delta[j];
                nd[i] = s2 * (1 - aPrev[i] * aPrev[i]);
              }
              delta = nd;
            }
          }
        }
        this.t++;
        const b1 = 0.9, b2 = 0.999, eps = 1e-8, m = ids.length;
        const c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
        for (let l = 0; l < L; l++) {
          for (let j = 0; j < this.W[l].length; j++) {
            for (let i = 0; i < this.W[l][j].length; i++) {
              const g = gW[l][j][i] / m;
              const mm = (this.mW[l][j][i] = b1 * this.mW[l][j][i] + (1 - b1) * g);
              const vv = (this.vW[l][j][i] = b2 * this.vW[l][j][i] + (1 - b2) * g * g);
              this.W[l][j][i] -= lr * (mm / c1) / (Math.sqrt(vv / c2) + eps);
            }
            const g = gb[l][j] / m;
            const mm = (this.mb[l][j] = b1 * this.mb[l][j] + (1 - b1) * g);
            const vv = (this.vb[l][j] = b2 * this.vb[l][j] + (1 - b2) * g * g);
            this.b[l][j] -= lr * (mm / c1) / (Math.sqrt(vv / c2) + eps);
          }
        }
      }
      return total / (n * this.sizes[this.sizes.length - 1]);
    }
    evaluate(X, Y) {
      let se = 0, ae = 0, n = 0;
      for (let i = 0; i < X.length; i++) {
        const p = this.predict(X[i]);
        for (let k = 0; k < p.length; k++) { const e = p[k] - Y[i][k]; se += e * e; ae += Math.abs(e); n++; }
      }
      return { mse: se / n, mae: ae / n };
    }
    paramCount() { return this.W.reduce((s, W, l) => s + W.length * W[0].length + this.b[l].length, 0); }
  }

  /* The rubric that produces training labels. It encodes what a good interview
     answer looks like. In a real deployment, replace this with human rated answers. */
  function teacher(f) {
    const [len, kw, sim, ld, wl, fill, sm, ex, hedge, pace, dur, kd, lvl] = f;
    const content = clip(0.42 * kw + 0.22 * sim + 0.16 * ex + 0.10 * kd + 0.10 * len - lvl * 0.10 * (1 - kw));
    const structure = clip(0.40 * sm + 0.20 * len + 0.20 * ex + 0.20 * dur - lvl * 0.10 * (1 - sm));
    const clarity = clip(0.30 * (1 - fill) + 0.25 * ld + 0.20 * wl + 0.25 * (1 - hedge));
    const delivery = clip(0.35 * pace + 0.25 * dur + 0.25 * (1 - fill) + 0.15 * (1 - hedge));
    return [content, structure, clarity, delivery];
  }

  function makeDataset(n, seed) {
    const r = rng(seed);
    const g = () => { let u = 0; for (let i = 0; i < 6; i++) u += r(); return (u - 3) / 1.5; }; // approx N(0,1)
    const X = [], Y = [];
    for (let i = 0; i < n; i++) {
      const q = clip(0.5 * r() + 0.5 * clip(0.5 + 0.22 * g()));
      const lvl = Math.floor(r() * 4) / 3;
      const f = [
        clip(0.30 + 0.65 * q + 0.14 * g()),
        clip(Math.pow(q, 1.1) + 0.14 * g()),
        clip(0.65 * q + 0.20 * q * r() + 0.10 * g()),
        clip(0.40 + 0.40 * q + 0.12 * g()),
        clip(0.35 + 0.40 * q + 0.15 * g()),
        clip((1 - q) * r() * 0.9 + 0.05 * Math.abs(g())),
        clip(0.10 + 0.75 * q + 0.18 * g()),
        clip(0.05 + 0.75 * q + 0.22 * g()),
        clip((1 - q) * r() * 0.8 + 0.05 * Math.abs(g())),
        clip(0.40 + 0.50 * q + 0.20 * g()),
        clip(0.35 + 0.55 * q + 0.22 * g()),
        clip(0.70 * Math.pow(q, 1.1) + 0.15 * g()),
        lvl,
      ];
      const y = teacher(f).map((v) => clip(v + 0.03 * g()));
      X.push(f); Y.push(y);
    }
    return { X, Y };
  }

  // Train asynchronously so the page can draw the loss curve while it learns.
  async function trainModel(opts = {}) {
    const { epochs = 45, nTrain = 3200, nTest = 600, lr = 0.006, batch = 32, seed = 42, onEpoch, yieldEvery = 1 } = opts;
    const net = new MLP([13, 16, 8, 4], seed);
    const train = makeDataset(nTrain, seed + 1), test = makeDataset(nTest, seed + 2);
    const r = rng(seed + 3);
    const history = [];
    for (let e = 0; e < epochs; e++) {
      const loss = net.trainEpoch(train.X, train.Y, lr * (1 - 0.7 * e / epochs), batch, r);
      const val = net.evaluate(test.X, test.Y).mse;
      history.push({ epoch: e + 1, loss, val });
      if (onEpoch) onEpoch(history[history.length - 1], e, epochs);
      if (typeof setTimeout === 'function' && (e + 1) % yieldEvery === 0) await new Promise((res) => setTimeout(res, 0));
    }
    const m = net.evaluate(test.X, test.Y);
    return { net, history, test: m, nTrain, nTest, epochs };
  }

  NS.ANN = { MLP, FEATURES, OUTPUTS, makeDataset, teacher, trainModel, clip, rng };
  if (typeof module !== 'undefined') module.exports = NS.ANN;
})();
