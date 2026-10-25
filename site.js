/*! MasterChefHub shared engine: sound effects, generated music radio, music upload and settings.
    Load on every page with:  <script src="/site.js"></script>  */
(function () {
'use strict';
if (window.MCH) return;

/* =====================================================================
   SETTINGS
   ===================================================================== */
var KEY = 'mch_settings', NPKEY = 'mch_np';
var defaults = {
  sfx: true, hoverSfx: true, sfxVolume: 0.6,
  music: true, autoplay: true, musicVolume: 0.5, station: 'random', shuffleUploads: true, miniPlayer: true,
  loader: true, loaderFast: false,
  notifications: true, notifySound: true, notifyPos: 'top-right', notifyDuration: 5,
  reduceMotion: false, textSize: 'normal'
};
var S = Object.assign({}, defaults);
try {
  var raw = localStorage.getItem(KEY);
  if (raw) Object.assign(S, JSON.parse(raw));
  else if (localStorage.getItem('mch_sound') === 'off') S.sfx = false;
} catch (e) {}

/* how did this page open?  (new visit / refresh  vs  moving around the site) */
var NAVTYPE = 'navigate';
try { var _nv = performance.getEntriesByType('navigation')[0]; if (_nv && _nv.type) NAVTYPE = _nv.type; } catch (e) {}
var SAMEORIGIN = false;
try { SAMEORIGIN = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
var INTERNAL = (NAVTYPE === 'navigate' && SAMEORIGIN) || NAVTYPE === 'back_forward';
/* if autoplay is off, every fresh visit starts with the music paused */
if (!INTERNAL && !S.autoplay && S.music) { S.music = false; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

var listeners = {};
function emit(ev, d) { (listeners[ev] || []).forEach(function (f) { try { f(d); } catch (e) {} }); }
function on(ev, f) { (listeners[ev] = listeners[ev] || []).push(f); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* =====================================================================
   AUDIO CONTEXT
   ===================================================================== */
var ctx = null, comp = null, musicGain = null, sfxGain = null, noiseBuf = null, gestured = false;

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = S.musicVolume * S.musicVolume * 0.9;
    musicGain.connect(comp);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = S.sfxVolume;
    sfxGain.connect(comp);
    var len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') { try { ctx.resume().catch(function () {}); } catch (e) {} }
  return ctx;
}
function whenRunning(fn) {
  var c = ac();
  if (!c) return;
  if (c.state === 'running') return fn(c);
  if (gestured) c.resume().then(function () { if (c.state === 'running') fn(c); }).catch(function () {});
}
function ctxRunning() { return !!ctx && ctx.state === 'running'; }

/* =====================================================================
   SOUND EFFECTS
   ===================================================================== */
function tone(freq, dur, type, vol, slideTo, delay) {
  if (!S.sfx) return;
  dur = dur || 0.08; type = type || 'sine'; vol = vol == null ? 0.05 : vol; delay = delay || 0;
  whenRunning(function (c) {
    var t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  });
}
var sfx = {
  hover: function () { tone(880, 0.05, 'sine', 0.018); },
  click: function () { tone(520, 0.07, 'triangle', 0.06, 780); tone(780, 0.09, 'triangle', 0.05, 1040, 0.05); },
  on: function () { tone(440, 0.1, 'sine', 0.06); tone(660, 0.1, 'sine', 0.06, null, 0.09); tone(880, 0.16, 'sine', 0.06, null, 0.18); },
  off: function () { tone(880, 0.1, 'sine', 0.05); tone(660, 0.1, 'sine', 0.05, null, 0.09); tone(440, 0.16, 'sine', 0.05, null, 0.18); },
  open: function () { tone(300, 0.16, 'triangle', 0.05, 600); },
  heart: function () { tone(600, 0.12, 'sine', 0.07, 1200); tone(1200, 0.14, 'sine', 0.05, 1600, 0.08); },
  success: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, 'sine', 0.06, null, i * 0.09); }); },
  whoops: function () { tone(520, 0.18, 'triangle', 0.07, 300); tone(380, 0.22, 'triangle', 0.07, 190, 0.16); },
  boing: function () { tone(240, 0.25, 'sine', 0.08, 620); tone(620, 0.18, 'sine', 0.05, 320, 0.2); }
};
window.sfx = sfx;

var lastHover = 0;
document.addEventListener('mouseover', function (e) {
  var t = e.target && e.target.closest && e.target.closest('a,.btn,button,.cat,.card,.row,.val,.step,.stat,.tl,.coll,.chip,.switch,.opt,.mchp-chip');
  if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
  var n = Date.now();
  if (S.hoverSfx !== false && n - lastHover > 90) { lastHover = n; sfx.hover(); }
});
document.addEventListener('click', function (e) {
  if (e.target && e.target.closest && e.target.closest('a,.btn,button,.switch')) sfx.click();
});

/* =====================================================================
   GENERATIVE MUSIC ENGINE  (every track is made on the fly, never repeats)
   ===================================================================== */
function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function rng(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var QUAL = { maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10], m9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14] };
var PROGS = [
  [[2, 'min7'], [7, 'dom7'], [0, 'maj7'], [9, 'min7']],
  [[0, 'maj9'], [9, 'm9'], [2, 'm9'], [7, 'dom7']],
  [[9, 'min7'], [2, 'min7'], [7, 'dom7'], [0, 'maj7']],
  [[5, 'maj7'], [4, 'min7'], [2, 'min7'], [0, 'maj9']],
  [[0, 'maj7'], [5, 'maj7'], [4, 'min7'], [9, 'min7']]
];
var STATIONS = {
  lofi:    { name: 'Lo-fi Kitchen',   bpm: [70, 84],  swing: 0.18, bars: 32 },
  jazz:    { name: 'Jazz Cafe',       bpm: [92, 112], swing: 0.30, bars: 32 },
  ambient: { name: 'Sunday Ambient',  bpm: [56, 66],  swing: 0,    bars: 24 }
};
function makePlan(station, seed) {
  var r = rng(seed), st = STATIONS[station];
  var keys = [0, 2, 3, 5, 7, 8, 10];
  return {
    station: station, seed: seed, st: st,
    key: 48 + keys[Math.floor(r() * keys.length)],
    prog: PROGS[Math.floor(r() * PROGS.length)],
    bpm: st.bpm[0] + Math.floor(r() * (st.bpm[1] - st.bpm[0] + 1)),
    title: st.name + ' · ' + (seed % 9000 + 1000)
  };
}

var gen = { plan: null, bus: null, send: null, sendMel: null, bed: null, timer: null, step: 0, bar: 0, startBar: 0, nextTime: 0, running: false, lastMel: 76 };

function noise(t, dur, type, freq, q, vol, out) {
  var c = ctx, s = c.createBufferSource();
  s.buffer = noiseBuf;
  var f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(out);
  s.start(t, Math.random() * 1.5, dur + 0.05);
}
function kick(t, vel, out) {
  var c = ctx, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
  g.gain.setValueAtTime(vel * 0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.32);
}
function snare(t, vel, out, soft) {
  noise(t, 0.16, 'bandpass', soft ? 1500 : 2200, 0.7, vel * 0.16, out);
  var c = ctx, o = c.createOscillator(), g = c.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(185, t); o.frequency.exponentialRampToValueAtTime(130, t + 0.08);
  g.gain.setValueAtTime(vel * 0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.12);
}
function hat(t, vel, open, out) { noise(t, open ? 0.2 : 0.045, 'highpass', 7500, 0.7, vel * 0.055, out); }
function epiano(m, t, dur, vel, out) {
  var c = ctx, f = mtof(m);
  var g = c.createGain(), lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 1500 + vel * 1500;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vel * 0.11, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  var o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
  o1.type = 'sine'; o1.frequency.value = f;
  o2.type = 'triangle'; o2.frequency.value = f * 2; o2.detune.value = 4; g2.gain.value = 0.25;
  o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp);
  lp.connect(out); lp.connect(gen.send);
  o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
function bass(m, t, dur, vel, out) {
  while (m >= 48) m -= 12;
  while (m < 36) m += 12;
  var c = ctx, f = mtof(m), g = c.createGain(), lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 520;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vel * 0.28, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  var o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
  o1.type = 'sine'; o1.frequency.value = f;
  o2.type = 'triangle'; o2.frequency.value = f; g2.gain.value = 0.3;
  o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(out);
  o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
function pad(m, t, dur, vel, out) {
  var c = ctx, f = mtof(m), g = c.createGain(), lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 1100;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.05 * vel, t + 2.2);
  g.gain.setValueAtTime(0.05 * vel, t + Math.max(2.3, dur - 1.5));
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  [-7, 7].forEach(function (d) {
    var o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = d;
    o.connect(g); o.start(t); o.stop(t + dur + 0.1);
  });
  g.connect(lp); lp.connect(out); lp.connect(gen.send);
}
function bell(m, t, out) {
  var c = ctx, f = mtof(m), g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.05, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
  var o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
  o1.type = 'sine'; o1.frequency.value = f;
  o2.type = 'sine'; o2.frequency.value = f * 2.76; g2.gain.value = 0.18;
  o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(out); g.connect(gen.sendMel);
  o1.start(t); o2.start(t); o1.stop(t + 3.3); o2.stop(t + 3.3);
}
function pentNote(p) {
  var pent = [0, 2, 4, 7, 9], cands = [];
  for (var m = 66; m <= 88; m++) { if (pent.indexOf(((m - p.key) % 12 + 12) % 12) > -1) cands.push(m); }
  var near = cands.filter(function (m) { return Math.abs(m - gen.lastMel) <= 5; });
  var pool = near.length ? near : cands;
  var n = pool[Math.floor(Math.random() * pool.length)];
  gen.lastMel = n;
  return n;
}
function mel(p, t, sd, out) {
  var c = ctx, m = pentNote(p), f = mtof(m), g = c.createGain(), lp = c.createBiquadFilter();
  var jazz = p.station === 'jazz', dur = jazz ? 1.1 : 0.7;
  lp.type = 'lowpass'; lp.frequency.value = 2400;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.055, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  var o1 = c.createOscillator(); o1.type = jazz ? 'sine' : 'triangle'; o1.frequency.value = f;
  o1.connect(g);
  if (jazz) { var o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'sine'; o2.frequency.value = f * 4; g2.gain.value = 0.12; o2.connect(g2); g2.connect(g); o2.start(t); o2.stop(t + dur + 0.05); }
  g.connect(lp); lp.connect(out); lp.connect(gen.sendMel);
  o1.start(t); o1.stop(t + dur + 0.05);
}
function voicing(root, ivs) {
  return ivs.slice(1).map(function (i) {
    var m = root + i;
    while (m < 58) m += 12;
    while (m >= 76) m -= 12;
    return m;
  }).sort(function (a, b) { return a - b; });
}

function playStep(p, step, bar, t, sd) {
  var out = gen.bus, st = p.station;
  var lofi = st === 'lofi', jazz = st === 'jazz', amb = st === 'ambient';
  var chordLen = amb ? 2 : 1, n = p.prog.length;
  var ci = Math.floor(bar / chordLen) % n, ch = p.prog[ci], nx = p.prog[(ci + 1) % n];
  var root = p.key + ch[0], ivs = QUAL[ch[1]], v = voicing(root, ivs);
  var intro = bar < 2, last = bar >= p.st.bars - 1, bi = bar % chordLen;

  if (last && step === 0) {
    out.gain.cancelScheduledValues(t);
    out.gain.setValueAtTime(1, t);
    out.gain.linearRampToValueAtTime(0.0001, t + sd * 16);
  }

  /* chords */
  if (amb) {
    if (step === 0 && bi === 0) v.forEach(function (m, i) { pad(m, t + i * 0.05, sd * 16 * chordLen + 1.5, 0.5 + Math.random() * 0.4, out); });
    if (step % 8 === 0 && bar > 0 && Math.random() < 0.35) bell(pentNote(p) + 12, t, out);
  } else {
    var hit = 0;
    if (lofi) { if (step === 0) hit = 1; else if (step === 10 && Math.random() < 0.55) hit = 0.55; else if (step === 6 && Math.random() < 0.25) hit = 0.45; }
    else { if (step === 0) hit = 0.9; else if (step === 6) hit = 0.55; else if (step === 10 && Math.random() < 0.5) hit = 0.5; else if (step === 14 && Math.random() < 0.3) hit = 0.4; }
    if (hit) v.forEach(function (m, i) { epiano(m, t + i * 0.012 + Math.random() * 0.01, sd * (lofi ? 10 : 5), hit * (0.7 + Math.random() * 0.3), out); });
  }

  /* bass */
  if (!amb) {
    if (lofi) {
      if (step === 0) bass(root, t, sd * 7, 1, out);
      else if (step === 10 && Math.random() < 0.6) bass(root, t, sd * 4, 0.8, out);
      else if (step === 14 && Math.random() < 0.3) bass(root + 7, t, sd * 2, 0.7, out);
    } else if (step % 4 === 0) {
      var tones = [root, root + ivs[1], root + ivs[2], root + ivs[3]], m;
      if (step === 0) m = root;
      else if (step === 12) m = p.key + nx[0] + (Math.random() < 0.5 ? 1 : -1);
      else m = tones[Math.floor(Math.random() * tones.length)];
      bass(m, t, sd * 3.6, 0.9, out);
    }
  }

  /* drums */
  if (!intro && !amb) {
    if (lofi) {
      if (step === 0) kick(t, 1, out); else if (step === 10) kick(t, 0.8, out); else if (step === 7 && Math.random() < 0.35) kick(t, 0.5, out);
      if (step === 4 || step === 12) snare(t, 0.8, out, true);
      if (step % 2 === 0 && Math.random() < 0.9) hat(t, (step % 4 === 0 ? 0.7 : 0.45) * (0.7 + Math.random() * 0.3), false, out);
      else if (Math.random() < 0.12) hat(t, 0.25, false, out);
      if (step === 14 && Math.random() < 0.25) hat(t, 0.5, true, out);
    } else {
      if (step === 0 || step === 4 || step === 6 || step === 8 || step === 12 || step === 14) hat(t, (step === 6 || step === 14) ? 0.5 : 0.7, false, out);
      if (step === 0 && Math.random() < 0.5) kick(t, 0.3, out);
      if (step === 4 || step === 12) hat(t, 0.8, false, out);
      if (Math.random() < 0.06) snare(t, 0.25, out, true);
    }
  }

  /* melody */
  if (!amb && !intro && bar % 4 >= 1) {
    var slots = lofi ? [0, 3, 6, 8, 11, 14] : [0, 2, 4, 6, 8, 10, 12, 14];
    if (slots.indexOf(step) > -1 && Math.random() < (lofi ? 0.2 : 0.3)) mel(p, t, sd, out);
  }
}

function genTick() {
  var c = ctx;
  if (!c || !gen.running) return;
  if (c.state !== 'running') { gen.nextTime = Math.max(gen.nextTime, c.currentTime + 0.1); return; }
  var p = gen.plan, sd = 60 / p.bpm / 4, ahead = document.hidden ? 1.5 : 0.35;
  while (gen.nextTime < c.currentTime + ahead) {
    var sw = (gen.step % 2 === 1) ? p.st.swing * sd : 0;
    playStep(p, gen.step, gen.bar, gen.nextTime + sw, sd);
    gen.nextTime += sd; gen.step++;
    if (gen.step >= 16) {
      gen.step = 0; gen.bar++;
      if (gen.bar >= p.st.bars) {
        gen.running = false; clearInterval(gen.timer); gen.timer = null;
        var tk = token, wait = Math.max(0, (gen.nextTime - c.currentTime) * 1000);
        setTimeout(function () { if (tk === token && S.music) player.next(); }, wait);
        return;
      }
    }
  }
  if (cur && cur.type === 'gen') cur.bar = gen.bar;
}

function genStart(plan, startBar) {
  var c = ac();
  if (!c) return false;
  genStop();
  gen.plan = plan; gen.step = 0; gen.bar = startBar || 0; gen.startBar = gen.bar; gen.lastMel = 76;
  var bus = c.createGain();
  bus.gain.value = 0.0001; bus.gain.setTargetAtTime(1, c.currentTime, 0.4); bus.connect(musicGain);
  var dl = c.createDelay(2); dl.delayTime.value = 60 / plan.bpm * 0.75;
  var fb = c.createGain(); fb.gain.value = 0.34;
  var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
  var wet = c.createGain(); wet.gain.value = 0.55;
  dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(bus);
  var send = c.createGain(); send.gain.value = 0.18; send.connect(dl);
  var sendMel = c.createGain(); sendMel.gain.value = 0.5; sendMel.connect(dl);
  gen.bus = bus; gen.send = send; gen.sendMel = sendMel;
  if (plan.station === 'lofi') {
    var s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    var lp2 = c.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 9000;
    var bg = c.createGain(); bg.gain.value = 0.01;
    s.connect(hp); hp.connect(lp2); lp2.connect(bg); bg.connect(bus); s.start();
    gen.bed = s;
  }
  gen.nextTime = c.currentTime + 0.1;
  gen.running = true;
  gen.timer = setInterval(genTick, 40);
  return true;
}
function genStop() {
  if (gen.timer) { clearInterval(gen.timer); gen.timer = null; }
  gen.running = false;
  var bus = gen.bus, bed = gen.bed, c = ctx;
  if (bus && c) {
    try { bus.gain.cancelScheduledValues(c.currentTime); bus.gain.setValueAtTime(bus.gain.value, c.currentTime); bus.gain.setTargetAtTime(0, c.currentTime, 0.12); } catch (e) {}
    setTimeout(function () { try { bus.disconnect(); } catch (e) {} try { if (bed) bed.stop(); } catch (e) {} }, 900);
  }
  gen.bus = null; gen.bed = null;
}

/* =====================================================================
   UPLOADED MUSIC  (stored on this device in IndexedDB)
   ===================================================================== */
function idb() {
  return new Promise(function (res, rej) {
    var r = indexedDB.open('mch_music', 1);
    r.onupgradeneeded = function () { r.result.createObjectStore('tracks', { keyPath: 'id' }); };
    r.onsuccess = function () { res(r.result); };
    r.onerror = function () { rej(r.error); };
  });
}
function dbReq(mode, fn) {
  return idb().then(function (d) {
    return new Promise(function (res, rej) {
      var tx = d.transaction('tracks', mode), q = fn(tx.objectStore('tracks'));
      tx.oncomplete = function () { res(q && q.result); };
      tx.onerror = tx.onabort = function () { rej(tx.error); };
    });
  });
}
var lib = [];
var libReady = refreshLib();
function refreshLib() {
  return dbReq('readonly', function (s) { return s.getAll(); }).then(function (all) {
    lib = (all || []).map(function (r) { return { id: r.id, name: r.name, size: r.size }; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    emit('lib', lib);
  }).catch(function () { lib = []; });
}
var AUDIO_EXT = /\.(mp3|m4a|aac|wav|ogg|oga|flac|opus|webm)$/i;
function addFiles(files) {
  var list = Array.prototype.slice.call(files || []).filter(function (f) { return /^audio\//.test(f.type) || AUDIO_EXT.test(f.name); });
  if (!list.length) { notify({ type: 'error', title: 'Wrong file type', message: 'Please choose audio files (mp3, wav, m4a, ogg or flac).' }); return Promise.resolve([]); }
  var ids = [];
  var chain = Promise.resolve();
  list.forEach(function (f) {
    chain = chain.then(function () {
      var id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      return dbReq('readwrite', function (s) { return s.put({ id: id, name: f.name.replace(/\.[^.]+$/, ''), size: f.size, type: f.type, blob: f }); }).then(function () { ids.push(id); });
    });
  });
  return chain.then(function () { return refreshLib(); }).then(function () {
    notify({ type: 'success', title: list.length === 1 ? 'Song added' : list.length + ' songs added', message: 'Now playing from My music.' });
    if (ids.length) player.playFile(ids[0]);
    return ids;
  }).catch(function () { notify({ type: 'error', title: 'Could not save the song', message: 'Your browser storage may be full or blocked.' }); return []; });
}
function removeFile(id) {
  var wasCur = cur && cur.type === 'file' && cur.id === id;
  return dbReq('readwrite', function (s) { return s.delete(id); }).then(refreshLib).then(function () {
    if (wasCur) { cur = null; if (S.music) player.next(); else { stopEngines(); emit('track'); } }
    notify({ type: 'info', title: 'Song removed' });
  });
}
function clearUploads() {
  return dbReq('readwrite', function (s) { return s.clear(); }).then(refreshLib).then(function () {
    if (cur && cur.type === 'file') { cur = null; if (S.music) player.next(); else { stopEngines(); emit('track'); } }
    notify({ type: 'info', title: 'My music cleared', message: 'All uploaded songs were removed from this device.' });
  }).catch(function () {});
}

var au = new Audio();
au.preload = 'auto';
au.volume = S.musicVolume;
var fileURL = null;
au.addEventListener('ended', function () { if (S.music) player.next(); });
au.addEventListener('error', function () { if (cur && cur.type === 'file' && S.music) setTimeout(function () { player.next(); }, 400); });

function playFileTrack(tr, time, tk) {
  return dbReq('readonly', function (s) { return s.get(tr.id); }).then(function (rec) {
    if (tk !== token) return;
    if (!rec) { player.next(); return; }
    if (fileURL) URL.revokeObjectURL(fileURL);
    fileURL = URL.createObjectURL(rec.blob);
    au.src = fileURL;
    if (time > 1) au.onloadedmetadata = function () { try { au.currentTime = Math.min(time, Math.max(0, au.duration - 1)); } catch (e) {} au.onloadedmetadata = null; };
    return au.play().catch(function () { /* waits for first tap */ });
  }).catch(function () {});
}

/* =====================================================================
   PLAYER
   ===================================================================== */
var cur = null, token = 0, booted = false;
var TAB = Math.random().toString(36).slice(2), OWNKEY = 'mch_owner', yielded = false;
function claim() { yielded = false; try { localStorage.setItem(OWNKEY, TAB + ':' + Date.now()); } catch (e) {} }
function releaseOwner() { try { var o = localStorage.getItem(OWNKEY) || ''; if (o.split(':')[0] === TAB) localStorage.removeItem(OWNKEY); } catch (e) {} }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function genTrack(st, seed) {
  var plan = makePlan(st, seed || Math.floor(Math.random() * 1e9));
  return { type: 'gen', plan: plan, title: plan.title, bar: 0 };
}
function fileTrack(f) { return { type: 'file', id: f.id, title: f.name, time: 0 }; }
function pickTrack() {
  var others = lib.filter(function (f) { return !(cur && cur.type === 'file' && cur.id === f.id); });
  var pool = others.length ? others : lib;
  if (S.station === 'uploads' && lib.length) return fileTrack(pick(pool));
  if (S.station === 'random' && S.shuffleUploads && lib.length && Math.random() < 0.4) return fileTrack(pick(pool));
  var st = STATIONS[S.station] ? S.station : (function () { var r = Math.random(); return r < 0.5 ? 'lofi' : r < 0.8 ? 'jazz' : 'ambient'; })();
  return genTrack(st);
}
function stopEngines() { genStop(); try { au.pause(); } catch (e) {} }
function startTrack(tr, pos) {
  claim();
  token++;
  var tk = token;
  stopEngines();
  cur = tr;
  if (tr.type === 'gen') genStart(tr.plan, pos || tr.bar || 0);
  else playFileTrack(tr, pos || tr.time || 0, tk);
  emit('track', cur);
}
function stopAll() {
  if (cur) { if (cur.type === 'gen') cur.bar = gen.bar; else cur.time = au.currentTime || 0; }
  savePos();
  token++;
  stopEngines();
  emit('track', cur);
}
function savePos() {
  if (!cur) return;
  try {
    var rec = cur.type === 'gen'
      ? { type: 'gen', station: cur.plan.station, seed: cur.plan.seed, bar: gen.bar || cur.bar || 0 }
      : { type: 'file', id: cur.id, time: au.currentTime || cur.time || 0 };
    localStorage.setItem(NPKEY, JSON.stringify(rec));
  } catch (e) {}
}
setInterval(function () { if (S.music && cur && (ctxRunning() || !au.paused)) savePos(); }, 1500);
window.addEventListener('pagehide', function () { savePos(); releaseOwner(); });

var spPromise = null;
function startPlayback() {
  if (!S.music) return Promise.resolve();
  if (spPromise) return spPromise;
  spPromise = libReady.then(function () { spPromise = null; return startNow(); });
  return spPromise;
}
function startNow() {
  {
    if (!S.music) return;
    if (cur) { startTrack(cur, cur.type === 'gen' ? cur.bar : cur.time); return; }
    var np = null;
    if (!booted && INTERNAL) { try { np = JSON.parse(localStorage.getItem(NPKEY) || 'null'); } catch (e) {} }
    booted = true;
    if (np && np.type === 'gen' && STATIONS[np.station]) { var t = genTrack(np.station, np.seed); startTrack(t, np.bar || 0); return; }
    if (np && np.type === 'file') {
      var f = lib.filter(function (x) { return x.id === np.id; })[0];
      if (f) { var ft = fileTrack(f); ft.time = np.time || 0; startTrack(ft, ft.time); return; }
    }
    startTrack(pickTrack());
  }
}
function running() { return (cur && cur.type === 'file') ? !au.paused : (cur ? ctxRunning() && gen.running : false); }

var player = {
  next: function () {
    return libReady.then(function () {
      if (!S.music) { S.music = true; save(); emit('settings', { key: 'music', value: true, settings: S }); }
      startTrack(pickTrack());
    });
  },
  toggle: function () {
    if (yielded && S.music) { startTrack(cur || pickTrack(), cur ? (cur.type === 'gen' ? cur.bar : cur.time) : 0); return; }
    set('music', !S.music);
  },
  isYielded: function () { return yielded; },
  playFile: function (id) {
    return libReady.then(function () {
      var f = lib.filter(function (x) { return x.id === id; })[0];
      if (!f) return;
      if (!S.music) { S.music = true; save(); emit('settings', { key: 'music', value: true, settings: S }); }
      startTrack(fileTrack(f));
    });
  },
  playStation: function (st) {
    S.station = st; S.music = true; save();
    emit('settings', { key: 'station', value: st, settings: S });
    return player.next();
  }
};

function set(k, v) {
  S[k] = v; save();
  if (k === 'musicVolume') {
    au.volume = v;
    if (musicGain) musicGain.gain.setTargetAtTime(v * v * 0.9, ctx.currentTime, 0.05);
  }
  if (k === 'sfxVolume' && sfxGain) sfxGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
  if (k === 'music') { if (v) { ac(); startPlayback(); } else stopAll(); }
  if (k === 'reduceMotion' || k === 'textSize') applyDisplay();
  if (k === 'miniPlayer' && ui) ui.style.display = v ? '' : 'none';
  if (k === 'notifyPos' && nWrap) nWrap.setAttribute('data-pos', v);
  emit('settings', { key: k, value: v, settings: S });
}
function reset() {
  Object.keys(defaults).forEach(function (k) { S[k] = defaults[k]; });
  save();
  au.volume = S.musicVolume;
  if (musicGain) musicGain.gain.value = S.musicVolume * S.musicVolume * 0.9;
  if (sfxGain) sfxGain.gain.value = S.sfxVolume;
  stopAll(); cur = null;
  applyDisplay(); if (ui) ui.style.display = '';
  if (nWrap) nWrap.setAttribute('data-pos', S.notifyPos);
  startPlayback();
  emit('settings', { key: '*', value: null, settings: S });
}

/* keep tabs in sync */
window.addEventListener('storage', function (e) {
  if (e.key === OWNKEY && e.newValue && e.newValue.split(':')[0] !== TAB && S.music && cur && !yielded) {
    yielded = true; stopEngines(); emit('track', cur); return;
  }
  if (e.key === 'mch_user') { paintUser(); return; }
  if (e.key !== KEY || !e.newValue) return;
  try {
    var n = JSON.parse(e.newValue), wasMusic = S.music;
    Object.assign(S, n);
    au.volume = S.musicVolume;
    if (musicGain) musicGain.gain.value = S.musicVolume * S.musicVolume * 0.9;
    if (sfxGain) sfxGain.gain.value = S.sfxVolume;
    if (wasMusic && !S.music) stopAll();
    applyDisplay(); if (ui) ui.style.display = S.miniPlayer === false ? 'none' : '';
    emit('settings', { key: '*', value: null, settings: S });
  } catch (err) {}
});

/* first tap unlocks audio (browsers require it) */
function onGesture() {
  gestured = true;
  ac();
  if (S.music) {
    if (!cur) startPlayback();
    else if (cur.type === 'file' && au.paused && au.src) au.play().catch(function () {});
  }
}
['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, onGesture, { capture: true, passive: true }); });
document.addEventListener('visibilitychange', function () { if (!document.hidden && S.music && ctx && ctx.state === 'suspended' && gestured) ctx.resume().catch(function () {}); });

/* =====================================================================
   MINI PLAYER UI  (bottom right on every page)
   ===================================================================== */
var ICON = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M5 5v14l10-7z"/><rect x="16.5" y="5" width="2.5" height="14" rx="1"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h9M18 6h3M3 12h3M12 12h9M3 18h10M19 18h2"/><circle cx="15" cy="6" r="2.5"/><circle cx="9" cy="12" r="2.5"/><circle cx="16" cy="18" r="2.5"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>'
};
var CSS =
'.mchp{position:fixed;right:20px;bottom:20px;z-index:400;font-family:Inter,system-ui,sans-serif;color:#fff;width:340px;max-width:calc(100vw - 28px)}' +
'.mchp *{box-sizing:border-box}' +
'.mchp-bar{display:flex;align-items:center;gap:6px;background:#0a0a0a;border:1px solid #333;border-radius:999px;padding:7px;box-shadow:0 18px 44px rgba(0,0,0,.35)}' +
'.mchp button{font-family:inherit;cursor:pointer;border:0;color:inherit;background:none}' +
'.mchp svg{width:18px;height:18px;display:block}' +
'.mchp-play{width:42px;height:42px;border-radius:50%;background:#fff!important;color:#0a0a0a!important;display:grid;place-items:center;flex-shrink:0;transition:transform .25s}' +
'.mchp-play:hover{transform:scale(1.08)}' +
'.mchp-info{flex:1;min-width:0;display:flex;align-items:center;gap:10px;padding:0 4px}' +
'.mchp-eq{display:flex;align-items:flex-end;gap:2px;height:16px;flex-shrink:0}' +
'.mchp-eq i{width:3px;height:3px;background:#fff;border-radius:2px;display:block}' +
'.mchp.on .mchp-eq i{animation:mchpeq .9s ease-in-out infinite}' +
'.mchp.on .mchp-eq i:nth-child(2){animation-delay:-.3s}.mchp.on .mchp-eq i:nth-child(3){animation-delay:-.6s}.mchp.on .mchp-eq i:nth-child(4){animation-delay:-.15s}' +
'@keyframes mchpeq{0%,100%{height:3px}50%{height:16px}}' +
'.mchp-txt{min-width:0;line-height:1.25}' +
'.mchp-txt b{display:block;font-size:.82rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.mchp-txt small{display:block;font-size:.7rem;color:#9a9a9a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.mchp-ico{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:#d0d0d0;flex-shrink:0;transition:.25s}' +
'.mchp-ico:hover{background:#222;color:#fff}' +
'.mchp-more svg{transition:transform .3s}.mchp[data-open="1"] .mchp-more svg{transform:rotate(180deg)}' +
'.mchp-panel{display:none;background:#0a0a0a;border:1px solid #333;border-radius:24px;padding:18px;margin-bottom:10px;box-shadow:0 18px 44px rgba(0,0,0,.35)}' +
'.mchp[data-open="1"] .mchp-panel{display:block;animation:mchpin .25s ease}' +
'@keyframes mchpin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
'.mchp-h{font-size:.66rem;letter-spacing:.18em;text-transform:uppercase;color:#7d7d7d;font-weight:700;margin:0 0 9px}' +
'.mchp-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}' +
'.mchp-chip{padding:7px 13px;border-radius:99px;border:1px solid #333!important;font-size:.76rem;font-weight:600;color:#cfcfcf!important;transition:.2s}' +
'.mchp-chip:hover{background:#1c1c1c!important}.mchp-chip.act{background:#fff!important;color:#0a0a0a!important;border-color:#fff!important}' +
'.mchp-vol{display:flex;align-items:center;gap:10px;margin-bottom:16px}' +
'.mchp-vol input{flex:1;accent-color:#fff;height:4px}' +
'.mchp-vol span{font-size:.72rem;color:#9a9a9a;width:34px;text-align:right}' +
'.mchp-list{max-height:140px;overflow:auto;margin-bottom:12px;display:grid;gap:4px}' +
'.mchp-item{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 10px;border-radius:12px;background:#151515;font-size:.78rem}' +
'.mchp-item.act{background:#232323}' +
'.mchp-item .nm{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;font-size:.78rem}' +
'.mchp-item button{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#bbb}.mchp-item button:hover{background:#2c2c2c;color:#fff}' +
'.mchp-item svg{width:14px;height:14px}' +
'.mchp-empty{font-size:.76rem;color:#7d7d7d;padding:2px 2px 4px}' +
'.mchp-row{display:flex;gap:8px}' +
'.mchp-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 12px;border-radius:99px;font-size:.78rem;font-weight:700;border:1px solid #333!important;color:#fff!important;text-decoration:none;transition:.2s}' +
'.mchp-btn:hover{background:#fff!important;color:#0a0a0a!important}' +
'.mchp-btn svg{width:15px;height:15px}' +
'.mchp-toast{position:fixed;left:50%;bottom:96px;z-index:500;transform:translateX(-50%) translateY(10px);background:#fff;color:#0a0a0a;font:600 .82rem Inter,system-ui,sans-serif;padding:11px 20px;border-radius:99px;opacity:0;pointer-events:none;transition:.3s;white-space:nowrap;box-shadow:0 14px 34px rgba(0,0,0,.3);border:1px solid #e4e4e1}' +
'.mchp-toast.show{opacity:1;transform:translateX(-50%)}' +
'.mchn-wrap{position:fixed;z-index:600;display:flex;flex-direction:column;gap:10px;width:min(390px,calc(100vw - 28px));pointer-events:none}' +
'.mchn-wrap[data-pos="top-right"]{top:18px;right:18px}' +
'.mchn-wrap[data-pos="top-center"]{top:18px;left:50%;transform:translateX(-50%)}' +
'.mchn-wrap[data-pos="bottom-right"]{bottom:92px;right:18px;flex-direction:column-reverse}' +
'.mchn{pointer-events:auto;position:relative;overflow:hidden;display:flex;gap:12px;align-items:flex-start;background:#0a0a0a;color:#fff;border:1px solid #2c2c2c;border-radius:18px;padding:14px 14px 17px;box-shadow:0 20px 50px rgba(0,0,0,.4);font-family:Inter,system-ui,sans-serif;animation:mchnIn .5s cubic-bezier(.2,.9,.3,1.2) both}' +
'.mchn.out{animation:mchnOut .32s ease forwards}' +
'@keyframes mchnIn{from{opacity:0;transform:translateX(40px) scale(.94)}to{opacity:1;transform:none}}' +
'@keyframes mchnOut{to{opacity:0;transform:translateX(40px) scale(.94)}}' +
'.mchn-wrap[data-pos="top-center"] .mchn{animation-name:mchnInT}' +
'@keyframes mchnInT{from{opacity:0;transform:translateY(-24px) scale(.94)}to{opacity:1;transform:none}}' +
'.mchn-ic{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;flex-shrink:0;background:#1e1e1e;color:#fff}' +
'.mchn-ic svg{width:17px;height:17px}' +
'.mchn-success .mchn-ic{background:#16a34a}.mchn-error .mchn-ic{background:#e5484d}.mchn-warning .mchn-ic{background:#f5a524;color:#0a0a0a}.mchn-info .mchn-ic{background:#fff;color:#0a0a0a}' +
'.mchn-tx{flex:1;min-width:0;padding-top:1px;line-height:1.35}' +
'.mchn-tx b{display:block;font-size:.88rem;font-weight:700}' +
'.mchn-tx span{display:block;font-size:.82rem;color:#b5b5b5;margin-top:2px;overflow-wrap:anywhere}' +
'.mchn-x{width:28px;height:28px;border-radius:50%;border:0;background:transparent;color:#8f8f8f;display:grid;place-items:center;cursor:pointer;flex-shrink:0;transition:.2s}' +
'.mchn-x:hover{background:#222;color:#fff}.mchn-x svg{width:14px;height:14px}' +
'.mchn-bar{position:absolute;left:0;bottom:0;height:3px;width:100%;background:#fff;opacity:.85;transform-origin:left;animation:mchnBar linear forwards}' +
'.mchn-success .mchn-bar{background:#16a34a}.mchn-error .mchn-bar{background:#e5484d}.mchn-warning .mchn-bar{background:#f5a524}' +
'.mchn.hold .mchn-bar{animation-play-state:paused}' +
'@keyframes mchnBar{from{transform:scaleX(1)}to{transform:scaleX(0)}}' +
'.mchu{display:flex;align-items:center;gap:12px;background:#151515;border:1px solid #262626;border-radius:16px;padding:10px 10px 10px 12px;color:#fff;font-family:Inter,system-ui,sans-serif}' +
'.mchu-av{width:38px;height:38px;border-radius:50%;background:#fff;color:#0a0a0a;display:grid;place-items:center;font-weight:800;flex-shrink:0;overflow:hidden}' +
'.mchu-av img{width:100%;height:100%;object-fit:cover;display:block}' +
'.mchu-tx{flex:1;min-width:0;line-height:1.25}.mchu-tx b{display:block;font-size:.86rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.mchu-tx small{display:block;font-size:.72rem;color:#8f8f8f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.mchu-out{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#bbb;flex-shrink:0;transition:.2s}.mchu-out:hover{background:#2a2a2a;color:#fff}.mchu-out svg{width:17px;height:17px}' +
'.mch-reduce *,.mch-reduce *::before,.mch-reduce *::after{animation-duration:.001ms!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}' +
'@media(max-width:600px){.mchn-wrap[data-pos="top-right"],.mchn-wrap[data-pos="top-center"]{top:12px;left:14px;right:14px;width:auto;transform:none}.mchn-wrap[data-pos="bottom-right"]{right:14px;left:14px;width:auto}}' +
'@media(max-width:960px){.mchp{right:14px;left:14px;bottom:14px;width:auto;max-width:none}}' +
'@media(prefers-reduced-motion:reduce){.mchp *{animation:none!important;transition:none!important}}';

var ui = null, nWrap = null, styleDone = false, pendingN = [];
function injectStyle() {
  if (styleDone) return; styleDone = true;
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
}
function applyDisplay() {
  var r = document.documentElement;
  r.classList.toggle('mch-reduce', !!S.reduceMotion);
  r.style.fontSize = S.textSize === 'small' ? '15px' : S.textSize === 'large' ? '17.5px' : '';
}

/* ---------------- NOTIFICATIONS ---------------- */
var NI = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5M12 17h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11v6M12 7h.01"/></svg>'
};
var NX = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
function notifySound(type) {
  if (!S.notifySound) return;
  if (type === 'success') { tone(660, 0.09, 'sine', 0.06); tone(990, 0.16, 'sine', 0.06, null, 0.08); }
  else if (type === 'error') { tone(260, 0.16, 'triangle', 0.07, 180); tone(200, 0.2, 'triangle', 0.07, 140, 0.13); }
  else if (type === 'warning') { tone(520, 0.1, 'triangle', 0.06); tone(520, 0.12, 'triangle', 0.06, null, 0.14); }
  else tone(720, 0.1, 'sine', 0.05, 940);
}
function notify(o) {
  if (typeof o === 'string') o = { message: o };
  o = o || {};
  if (!S.notifications) return null;
  if (!document.body) { pendingN.push(o); return null; }
  injectStyle();
  var type = NI[o.type] ? o.type : 'info';
  if (!nWrap) {
    nWrap = document.createElement('div'); nWrap.className = 'mchn-wrap';
    nWrap.setAttribute('aria-live', 'polite'); nWrap.setAttribute('data-pos', S.notifyPos || 'top-right');
    document.body.appendChild(nWrap);
  }
  while (nWrap.children.length >= 4) nWrap.removeChild(nWrap.firstChild);
  var dur = o.duration != null ? o.duration : (S.notifyDuration || 5) * 1000;
  if (type === 'error' && o.duration == null) dur = Math.max(dur, 6500);
  var el = document.createElement('div');
  el.className = 'mchn mchn-' + type;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = '<div class="mchn-ic">' + NI[type] + '</div>' +
    '<div class="mchn-tx">' + (o.title ? '<b>' + esc(o.title) + '</b>' : '') + (o.message ? '<span>' + esc(o.message) + '</span>' : '') + '</div>' +
    '<button class="mchn-x" aria-label="Dismiss">' + NX + '</button>' +
    '<i class="mchn-bar" style="animation-duration:' + dur + 'ms"></i>';
  nWrap.appendChild(el);
  var timer = null, left = dur, started = 0;
  function close() {
    if (el.classList.contains('out')) return;
    clearTimeout(timer); el.classList.add('out');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
  }
  function arm() { started = Date.now(); timer = setTimeout(close, left); }
  el.querySelector('.mchn-x').addEventListener('click', close);
  el.addEventListener('mouseenter', function () { clearTimeout(timer); left -= Date.now() - started; el.classList.add('hold'); });
  el.addEventListener('mouseleave', function () { left = Math.max(left, 1500); el.classList.remove('hold'); arm(); });
  arm();
  notifySound(type);
  return { close: close };
}
['success', 'error', 'warning', 'info'].forEach(function (t) {
  notify[t] = function (title, message, extra) { return notify(Object.assign({ type: t, title: title, message: message }, extra || {})); };
});
function toast(msg, type) { return notify({ type: type || 'info', message: msg }); }

window.addEventListener('offline', function () { notify({ type: 'warning', title: 'You are offline', message: 'Some parts of the site may not load until you reconnect.' }); });
window.addEventListener('online', function () { notify({ type: 'success', title: 'Back online', message: 'Your connection has been restored.' }); });
window.addEventListener('mch:slowload', function () { notify({ type: 'warning', title: 'Slow connection', message: 'Some parts of the page are still loading.' }); });

/* ---------------- ACCOUNT CHIP (shows who is signed in) ---------------- */
function getUser() { try { return JSON.parse(localStorage.getItem('mch_user') || 'null'); } catch (e) { return null; } }
function paintUser() {
  var sb = document.querySelector('.side-bottom');
  if (!sb) return;
  var u = getUser(), old = sb.querySelector('.mchu');
  if (!u) {
    if (old && !sb.querySelector('a[href="/login"]')) {
      old.outerHTML = '<a href="/login" class="btn btn-white"><svg class="ico"><use href="#i-user"/></svg>Log in</a><a href="/login" class="btn btn-line">Create account</a>';
    }
    return;
  }
  var name = u.name || (u.email ? u.email.split('@')[0] : 'Account');
  var av = u.photo ? '<img src="' + esc(u.photo) + '" alt="" referrerpolicy="no-referrer">' : esc(name.charAt(0).toUpperCase());
  var html = '<div class="mchu"><div class="mchu-av">' + av + '</div><div class="mchu-tx"><b>' + esc(name) + '</b><small>' + esc(u.email || 'Signed in') + '</small></div>' +
             '<a class="mchu-out" href="/login?signout=1" aria-label="Sign out" title="Sign out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg></a></div>';
  if (old) { old.outerHTML = html; return; }
  var links = sb.querySelectorAll('a[href="/login"]');
  if (!links.length) return;
  links[0].insertAdjacentHTML('beforebegin', html);
  Array.prototype.forEach.call(links, function (a) { a.parentNode.removeChild(a); });
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

function buildUI() {
  injectStyle();
  if (document.body.getAttribute('data-mch-player') === 'off') return;
  ui = document.createElement('div'); ui.className = 'mchp'; ui.setAttribute('data-open', '0');
  ui.innerHTML =
    '<div class="mchp-panel">' +
      '<div class="mchp-h">Station</div>' +
      '<div class="mchp-chips">' +
        '<button class="mchp-chip" data-st="random">Random mix</button>' +
        '<button class="mchp-chip" data-st="lofi">Lo-fi</button>' +
        '<button class="mchp-chip" data-st="jazz">Jazz</button>' +
        '<button class="mchp-chip" data-st="ambient">Ambient</button>' +
        '<button class="mchp-chip" data-st="uploads">My music</button>' +
      '</div>' +
      '<div class="mchp-h">Volume</div>' +
      '<div class="mchp-vol"><input type="range" min="0" max="100" step="1" aria-label="Music volume"><span></span></div>' +
      '<div class="mchp-h">My music</div>' +
      '<div class="mchp-list"></div>' +
      '<div class="mchp-row">' +
        '<button class="mchp-btn" data-act="upload">' + ICON.upload + 'Upload music</button>' +
        '<a class="mchp-btn" href="/settings">' + ICON.gear + 'Settings</a>' +
      '</div>' +
    '</div>' +
    '<div class="mchp-bar">' +
      '<button class="mchp-play" data-act="toggle" aria-label="Play or pause music"></button>' +
      '<div class="mchp-info"><div class="mchp-eq"><i></i><i></i><i></i><i></i></div><div class="mchp-txt"><b></b><small></small></div></div>' +
      '<button class="mchp-ico" data-act="next" aria-label="Next song">' + ICON.next + '</button>' +
      '<button class="mchp-ico mchp-more" data-act="more" aria-label="Music menu">' + ICON.up + '</button>' +
    '</div>';
  document.body.appendChild(ui);

  ui.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act],[data-st],[data-play],[data-del]');
    if (!b) return;
    if (b.dataset.act === 'toggle') { var willOn = player.isYielded() ? true : !S.music; player.toggle(); willOn ? sfx.on() : sfx.off(); }
    else if (b.dataset.act === 'next') player.next();
    else if (b.dataset.act === 'more') ui.setAttribute('data-open', ui.getAttribute('data-open') === '1' ? '0' : '1');
    else if (b.dataset.act === 'upload') fileInput.click();
    else if (b.dataset.st) player.playStation(b.dataset.st);
    else if (b.dataset.play) player.playFile(b.dataset.play);
    else if (b.dataset.del) removeFile(b.dataset.del);
  });
  var vol = ui.querySelector('.mchp-vol input');
  vol.addEventListener('input', function () { set('musicVolume', vol.value / 100); });
  document.addEventListener('click', function (e) { if (ui.getAttribute('data-open') === '1' && !ui.contains(e.target)) ui.setAttribute('data-open', '0'); });
  if (S.miniPlayer === false) ui.style.display = 'none';
  paint();
}

function nowInfo() {
  var waiting = S.music && !running() && (!ctx || ctx.state !== 'running' || (cur && cur.type === 'file'));
  return {
    title: cur ? cur.title : (S.music ? 'Starting music...' : 'Music is off'),
    sub: yielded && S.music ? 'Playing in another tab. Press play to move it here' : !S.music ? 'Press play to listen' : waiting ? 'Tap anywhere to start the music' : cur ? (cur.type === 'gen' ? 'MasterChefHub Radio · ' + cur.plan.bpm + ' BPM' : 'From your music') : 'MasterChefHub Radio',
    kind: cur ? cur.type : null,
    playing: S.music && !yielded, waiting: waiting && !yielded, running: running(), yielded: yielded,
    id: cur && cur.type === 'file' ? cur.id : null
  };
}
function paint() {
  if (!ui) return;
  var n = nowInfo();
  ui.classList.toggle('on', n.playing && n.running);
  ui.querySelector('.mchp-play').innerHTML = (S.music && !yielded) ? ICON.pause : ICON.play;
  ui.querySelector('.mchp-txt b').textContent = n.title;
  ui.querySelector('.mchp-txt small').textContent = n.sub;
  Array.prototype.forEach.call(ui.querySelectorAll('.mchp-chip'), function (c) { c.classList.toggle('act', c.dataset.st === S.station); });
  var vol = ui.querySelector('.mchp-vol input');
  if (document.activeElement !== vol) vol.value = Math.round(S.musicVolume * 100);
  ui.querySelector('.mchp-vol span').textContent = Math.round(S.musicVolume * 100) + '%';
  paintLib();
}
function paintLib() {
  if (!ui) return;
  var box = ui.querySelector('.mchp-list');
  var id = cur && cur.type === 'file' ? cur.id : null;
  if (!lib.length) { box.innerHTML = '<div class="mchp-empty">Upload your own songs and they will play here.</div>'; return; }
  box.innerHTML = lib.map(function (f) {
    return '<div class="mchp-item' + (f.id === id ? ' act' : '') + '"><button class="nm" data-play="' + f.id + '" title="Play">' + esc(f.name) + '</button>' +
      '<button data-del="' + f.id + '" aria-label="Remove" title="Remove">' + ICON.trash + '</button></div>';
  }).join('');
}
on('track', paint); on('settings', paint); on('lib', paint);
setInterval(paint, 1200);

/* hidden file picker shared by every page */
var fileInput = document.createElement('input');
fileInput.type = 'file'; fileInput.accept = 'audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac,.opus'; fileInput.multiple = true; fileInput.style.display = 'none';
fileInput.addEventListener('change', function () { if (fileInput.files.length) addFiles(fileInput.files); fileInput.value = ''; });

function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
ready(function () {
  injectStyle();
  applyDisplay();
  document.body.appendChild(fileInput);
  buildUI();
  paintUser();
  pendingN.splice(0).forEach(notify);
  if (window.__mchSlow) window.dispatchEvent(new CustomEvent('mch:slowload'));
  if (S.music) startPlayback();
  /* browsers block sound until the first tap: say so once, politely */
  if (!INTERNAL) setTimeout(function () {
    if (S.music && !gestured && !yielded && !running()) notify({ type: 'info', title: 'Tap to start the music', message: 'Your browser needs one tap on the page before it can play sound.' });
  }, 3200);
});

/* =====================================================================
   PUBLIC API  (used by settings.html)
   ===================================================================== */
window.MCH = {
  settings: S, defaults: defaults, stations: STATIONS,
  set: set, on: on, reset: reset, toast: toast,
  now: nowInfo, lib: function () { return lib.slice(); },
  toggle: player.toggle, next: player.next, playFile: player.playFile, playStation: player.playStation,
  upload: function () { fileInput.click(); }, addFiles: addFiles, remove: removeFile, clearUploads: clearUploads,
  notify: notify, user: getUser, internalNav: INTERNAL, navType: NAVTYPE
};
})();
