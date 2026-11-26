/* Audio mixer and beat grid: volume for each sound row, a master volume, tap tempo, beat lines and beat snapping */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S, U = window.__U;
  var $ = function (s) { return document.querySelector(s); };
  var ROWS = [['m', 'Master'], ['v', 'Sound inside videos'], [2, 'Row A1'], [3, 'Row A2'], [5, 'Row A3']];

  function meta() { S.meta = S.meta || {}; return S.meta; }
  function mix() { var m = meta(); m.mix = m.mix || {}; return m.mix; }
  function level(k) { var v = mix()[k]; return v == null ? 1 : v; }

  var G = {};
  EXT.masterVol = function () { return level('m'); };
  EXT.playStart = function () { G = {}; };
  EXT.destFor = function (it, x, master) {
    var off = meta().off || {}; if (off[it.track]) return null;
    var key = EXT.isAudTrack(it.track) ? it.track : 'v';
    if (!G[key]) { var g = x.createGain(); g.gain.value = level(key); g.connect(master); G[key] = g; }
    return G[key];
  };

  /* ---------- panel ---------- */
  EXT.homeParts.push(function () {
    var m = meta(), h = U.sec('MIXER', ROWS.map(function (r) {
      var v = level(r[0]);
      return '<div class="fl"><label>' + r[1] + ' <span class="val">' + Math.round(v * 100) + '%</span></label><input type="range" min="0" max="2" step="0.05" value="' + v + '" data-hf="mix' + r[0] + '"></div>';
    }).join('') + '<p class="xnote">Quiet the music under your voice by lowering the row the music is on.</p>');
    h += U.sec('BEATS',
      '<div class="g2"><div class="fl"><label>Beats per minute</label><input type="number" min="40" max="220" step="1" value="' + (m.bpm || 100) + '" data-hf="bpm"></div>' +
      '<div class="fl"><label>First beat at (sec)</label><input type="number" min="0" step="0.05" value="' + (m.boff || 0) + '" data-hf="boff"></div></div>' +
      '<div class="acts"><button class="b s" data-h="tap">Tap tempo</button><button class="b s" data-h="bmarks">Marker on every bar</button></div>' +
      '<div class="fl" style="margin-top:8px"><label style="cursor:pointer;justify-content:flex-start;gap:8px"><input type="checkbox" data-hf="bshow"' + (m.bshow ? ' checked' : '') + '> Show beat lines</label></div>' +
      '<div class="fl"><label style="cursor:pointer;justify-content:flex-start;gap:8px"><input type="checkbox" data-hf="bsnap"' + (m.bsnap ? ' checked' : '') + '> Snap layers to the beat</label></div>');
    return h;
  });
  EXT.homeFields = EXT.homeFields || {};
  ROWS.forEach(function (r) {
    EXT.homeFields['mix' + r[0]] = function (v, el) {
      mix()[r[0]] = +v; var lab = el.closest('.fl').querySelector('.val'); if (lab) lab.textContent = Math.round(v * 100) + '%';
      var key = r[0]; if (key === 'm') { var M = ST.MASTER; if (M) M.gain.value = +v; } else if (G[key]) G[key].gain.value = +v; ST.save();
    };
  });
  var oldFields = EXT.homeFields;
  var inputs = {
    bpm: function (v) { meta().bpm = Math.max(40, Math.min(220, +v || 100)); beatLines(); ST.save(); },
    boff: function (v) { meta().boff = Math.max(0, +v || 0); beatLines(); ST.save(); },
    bshow: function (v, el) { meta().bshow = el.checked; beatLines(); ST.save(); },
    bsnap: function (v, el) { meta().bsnap = el.checked; ST.save(); }
  };
  Object.keys(inputs).forEach(function (k) { EXT.homeFields[k] = inputs[k]; });

  /* tap tempo */
  var taps = [];
  EXT.homeActions.tap = function () {
    var n = performance.now(); if (taps.length && n - taps[taps.length - 1] > 2000) taps = []; taps.push(n);
    if (taps.length >= 3) { var d = []; for (var i = 1; i < taps.length; i++) d.push(taps[i] - taps[i - 1]); var avg = d.reduce(function (a, b) { return a + b; }, 0) / d.length; meta().bpm = Math.round(60000 / avg); ST.save(); ST.insp(); ST.toast(meta().bpm + ' BPM'); }
    else ST.toast('Keep tapping...');
  };
  EXT.homeActions.bmarks = function () {
    var m = meta(), bar = 4 * 60 / (m.bpm || 100), t = m.boff || 0, tot = Math.max(ST.total(), 8); m.markers = m.markers || [];
    for (var i = 1; t < tot && i < 200; i++, t += bar) m.markers.push({ t: U.round(t), n: 'Bar ' + i });
    m.markers.sort(function (a, b) { return a.t - b.t; }); ST.refresh(); ST.toast('Markers added');
  };

  function beatLines() {
    var r = $('#ruler'); if (!r) return; Array.prototype.slice.call(r.querySelectorAll('.bt')).forEach(function (n) { n.remove(); });
    var m = meta(); if (!m.bshow) return; var step = 60 / (m.bpm || 100), t = m.boff || 0, tot = Math.max(ST.total() + 12, 30), i = 0;
    for (; t < tot && i < 1500; t += step, i++) { var d = document.createElement('div'); d.className = 'bt'; d.style.cssText = 'position:absolute;bottom:0;width:1px;height:' + (i % 4 === 0 ? 14 : 7) + 'px;background:' + (i % 4 === 0 ? '#ffb020' : '#666') + ';left:' + ST.pxs(t) + 'px;pointer-events:none'; r.appendChild(d); }
  }
  EXT.on('timeline', beatLines);
  EXT.snapBeat = function (v) {
    var m = meta(); if (!m.bsnap) return null; var step = 60 / (m.bpm || 100), o = m.boff || 0, n = Math.round((v - o) / step); return Math.max(0, o + n * step);
  };
})();
