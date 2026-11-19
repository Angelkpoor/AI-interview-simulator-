/* Browser wrappers: speech to text, text to speech, camera and microphone level. */
(function () {
  const NS = (globalThis.IAI = globalThis.IAI || {});
  const SR = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;

  class Listener {
    constructor(lang, onUpdate, onError) {
      this.lang = lang; this.onUpdate = onUpdate; this.onError = onError || (() => {});
      this.finalText = ''; this.interim = ''; this.active = false; this.firstWordAt = null; this.startAt = null;
    }
    static get supported() { return !!SR; }
    reset() { this.finalText = ''; this.interim = ''; this.firstWordAt = null; this.startAt = Date.now(); }
    start() {
      if (!SR) return false;
      this.active = true; if (!this.startAt) this.startAt = Date.now();
      this._spawn(); return true;
    }
    _spawn() {
      const r = new SR();
      r.lang = this.lang; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
      r.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) this.finalText += (this.finalText ? ' ' : '') + res[0].transcript.trim();
          else interim += res[0].transcript;
        }
        this.interim = interim.trim();
        if (!this.firstWordAt && (this.finalText || this.interim)) this.firstWordAt = Date.now();
        this.onUpdate(this.finalText, this.interim);
      };
      r.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.active = false; this.onError('denied'); }
        else if (e.error !== 'no-speech' && e.error !== 'aborted') this.onError(e.error);
      };
      r.onend = () => { if (this.active) setTimeout(() => { if (this.active) this._spawn(); }, 120); };
      try { r.start(); this.rec = r; } catch (err) { /* already started */ }
    }
    pause() { this.active = false; try { this.rec && this.rec.stop(); } catch (e) {} }
    resume() { if (!this.active) { this.active = true; this._spawn(); } }
    async finish() {
      this.pause();
      await new Promise((r) => setTimeout(r, 500));
      return (this.finalText + ' ' + this.interim).trim();
    }
  }

  const Voice = {
    get supported() { return 'speechSynthesis' in globalThis; },
    voices() { return Voice.supported ? speechSynthesis.getVoices() : []; },
    speak(text, { rate = 1, voiceURI = '', lang = 'en-IN' } = {}) {
      return new Promise((resolve) => {
        if (!Voice.supported) return resolve();
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const vs = Voice.voices();
        const v = vs.find((x) => x.voiceURI === voiceURI) || vs.find((x) => x.lang === lang) || vs.find((x) => x.lang.startsWith('en'));
        if (v) { u.voice = v; u.lang = v.lang; } else u.lang = lang;
        u.rate = rate; u.pitch = 1;
        let done = false;
        const fin = () => { if (!done) { done = true; resolve(); } };
        u.onend = fin; u.onerror = fin;
        speechSynthesis.speak(u);
        setTimeout(fin, 3000 + text.split(/\s+/).length * 520 / rate);
      });
    },
    stop() { if (Voice.supported) speechSynthesis.cancel(); },
  };

  class Media {
    constructor() { this.stream = null; this.vstream = null; this.ctx = null; this.analyser = null; this.buf = null; }
    async startMic() {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      this.ctx = new AC();
      const src = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 512;
      src.connect(this.analyser); this.buf = new Uint8Array(this.analyser.fftSize);
    }
    level() {
      if (!this.analyser) return 0;
      this.analyser.getByteTimeDomainData(this.buf);
      let s = 0; for (let i = 0; i < this.buf.length; i++) { const v = (this.buf[i] - 128) / 128; s += v * v; }
      return Math.min(1, Math.sqrt(s / this.buf.length) * 5);
    }
    async startCam(video) {
      this.vstream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } });
      video.srcObject = this.vstream; await video.play().catch(() => {});
    }
    stopCam(video) {
      if (this.vstream) this.vstream.getTracks().forEach((t) => t.stop());
      this.vstream = null; if (video) video.srcObject = null;
    }
    snapshot(video) {
      try {
        if (!this.vstream || !video.videoWidth) return null;
        const c = document.createElement('canvas'); const w = 360, h = Math.round(360 * video.videoHeight / video.videoWidth);
        c.width = w; c.height = h; const x = c.getContext('2d'); x.translate(w, 0); x.scale(-1, 1); x.drawImage(video, 0, 0, w, h);
        return c.toDataURL('image/jpeg', 0.7);
      } catch (e) { return null; }
    }
    stopAll(video) {
      this.stopCam(video);
      if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null; if (this.ctx) this.ctx.close().catch(() => {}); this.ctx = null; this.analyser = null;
    }
  }

  NS.Speech = { Listener, Voice, Media };
})();
