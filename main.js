(function () {
  const NS = globalThis.IAI, U = NS.UI, { state } = U;
  U.load();
  U.go('setup');
  // Train the neural network in the background (about one second).
  NS.ANN.trainModel({ epochs: 45, yieldEvery: 3 }).then((m) => {
    state.model = m; state.modelBusy = false;
    if (state.view === 'setup') { const y = window.scrollY; U.go('setup'); window.scrollTo({ top: y }); }
    else if (state.view === 'ann') U.go('ann');
    else { const p = U.$('#sidePill'); if (p && state.view !== 'interview') p.innerHTML = `<span><b>ANN ready</b></span>`; }
  });
})();
