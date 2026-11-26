/* Keyframes: make any layer move, grow, turn or fade over time */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S, U = window.__U;
  var PROPS = [['dx', 'Left or right', 0], ['dy', 'Up or down', 0], ['sc', 'Size', 1], ['rot', 'Rotate', 0], ['op', 'Opacity', 1]];
  var DEFAULT = {}; PROPS.forEach(function (p) { DEFAULT[p[0]] = p[2]; });
  var CORE_IDS = { iX: 'dx', iY: 'dy', iSc: 'sc', iR: 'rot', iOp: 'op' };
  var EASE = {
    linear: function (p) { return p; },
    ease: function (p) { return p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; },
    out: function (p) { return 1 - Math.pow(1 - p, 3); },
    in: function (p) { return p * p * p; },
    hold: function (p) { return p < 1 ? 0 : 1; },
    bounce: function (p) { var n = 7.5625, d = 2.75; if (p < 1 / d) return n * p * p; if (p < 2 / d) return n * (p -= 1.5 / d) * p + .75; if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + .9375; return n * (p -= 2.625 / d) * p + .984375; }
  };

  /* the layer as it looks at time t */
  EXT.kf = function (it, t) {
    var rel = t - it.start, out = Object.create(it), any = false;
    PROPS.forEach(function (p) {
      var list = it.kf[p[0]]; if (!list || !list.length) return; any = true;
      var a = list[0], b = list[list.length - 1], v;
      if (rel <= a.t) v = a.v; else if (rel >= b.t) v = b.v;
      else for (var i = 0; i < list.length - 1; i++) {
        if (rel >= list[i].t && rel <= list[i + 1].t) { var span = list[i + 1].t - list[i].t, q = span > 0 ? (rel - list[i].t) / span : 1; v = list[i].v + (list[i + 1].v - list[i].v) * (EASE[list[i + 1].e || 'ease'] || EASE.ease)(q); break; }
      }
      out[p[0]] = v;
    });
    return any ? out : it;
  };

  function relNow(it) { return Math.max(0, U.round(S.t - it.start)); }
  function setKey(it, prop, v, e) {
    it.kf = it.kf || {}; var list = it.kf[prop] = it.kf[prop] || [], r = relNow(it), hit = null;
    list.forEach(function (k) { if (Math.abs(k.t - r) < .06) hit = k; });
    if (hit) { hit.v = v; if (e) hit.e = e; } else { list.push({ t: r, v: v, e: e || 'ease' }); list.sort(function (a, b) { return a.t - b.t; }); }
  }
  function currentValue(it, p) { var cur = EXT.kf && it.kf ? EXT.kf(it, S.t) : it; return cur[p] == null ? DEFAULT[p] : cur[p]; }

  /* while a layer has keyframes, moving a slider writes a keyframe at the red line */
  var prevInput = EXT.onInput;
  EXT.onInput = function (it, id, v, el) {
    var prop = CORE_IDS[id] || (el && el.dataset && el.dataset.f && DEFAULT.hasOwnProperty(el.dataset.f) ? el.dataset.f : null);
    if (prop && it.kf && it.kf[prop] && it.kf[prop].length) { setKey(it, prop, parseFloat(v), null); }
    return prevInput ? prevInput(it, id, v, el) : false;
  };

  var prevFx = EXT.fxHtml;
  EXT.fxHtml = function (it) {
    var h = prevFx ? prevFx(it) : '', kf = it.kf || {}, rows = '';
    PROPS.forEach(function (p) {
      (kf[p[0]] || []).forEach(function (k, i) { rows += '<div class="lay"><span>' + p[1] + '</span><small>' + k.t.toFixed(1) + 's</small><small>' + (Math.round(k.v * 100) / 100) + '</small><button class="b s d" data-a="kfdel" data-p="' + p[0] + '" data-i="' + i + '">X</button></div>'; });
    });
    h += U.sec('ANIMATE (KEYFRAMES)',
      '<p class="xnote">Move the red line, set Move, Size, Rotate and Opacity above, then press Set keyframe. The layer glides between your keyframes. Once a layer has keyframes, moving a slider updates the keyframe at the red line.</p>' +
      U.select(it, 'kfe', 'How it glides', [['ease', 'Smooth'], ['linear', 'Steady'], ['out', 'Fast then slow'], ['in', 'Slow then fast'], ['bounce', 'Bounce'], ['hold', 'Jump']], 'ease') +
      '<div class="acts">' + U.btn('kfset', 'Set keyframe here') + U.btn('kfclear', 'Clear all') + '</div>' +
      '<div class="cnt" style="margin-top:10px"><span>PRESETS</span></div><div class="acts">' + U.btn('kfp:pop', 'Pop in') + U.btn('kfp:slide', 'Slide across') + U.btn('kfp:float', 'Float') + U.btn('kfp:push', 'Slow push in') + U.btn('kfp:spin', 'Spin in') + U.btn('kfp:shake', 'Wiggle') + '</div>' +
      (rows ? '<div style="margin-top:10px">' + rows + '</div>' : ''));
    return h;
  };

  var PRE = {
    pop: function (it) { return { sc: [[0, 0, 'ease'], [.35, 1.12, 'out'], [.55, 1, 'ease']] }; },
    slide: function (it) { return { dx: [[0, -700, 'ease'], [it.dur, 700, 'linear']] }; },
    float: function (it) { var d = it.dur, k = []; for (var i = 0; i <= 4; i++) k.push([d * i / 4, i % 2 ? -18 : 18, 'ease']); return { dy: k }; },
    push: function (it) { return { sc: [[0, 1, 'ease'], [it.dur, 1.18, 'linear']] }; },
    spin: function (it) { return { rot: [[0, -180, 'ease'], [.8, 0, 'out']], sc: [[0, .2, 'ease'], [.8, 1, 'out']], op: [[0, 0, 'linear'], [.3, 1, 'linear']] }; },
    shake: function (it) { var k = [], i; for (i = 0; i < 9; i++) k.push([i * .08, i % 2 ? 6 : -6, 'linear']); k.push([.8, 0, 'ease']); return { rot: k }; }
  };
  var prevClick = EXT.fxClick;
  EXT.fxClick = function (it, a, b) {
    if (a === 'kfset') {
      PROPS.forEach(function (p) {
        var has = it.kf && it.kf[p[0]] && it.kf[p[0]].length, v = has ? currentValue(it, p[0]) : (it[p[0]] == null ? DEFAULT[p[0]] : it[p[0]]);
        setKey(it, p[0], v, it.kfe || 'ease');
      });
      ST.toast('Keyframe set at ' + relNow(it).toFixed(1) + 's'); return true;
    }
    if (a === 'kfclear') { it.kf = null; ST.toast('Keyframes cleared'); return true; }
    if (a === 'kfdel') { var l = it.kf && it.kf[b.dataset.p]; if (l) { l.splice(+b.dataset.i, 1); if (!l.length) delete it.kf[b.dataset.p]; } return true; }
    if (a.indexOf('kfp:') === 0) {
      var def = PRE[a.slice(4)](it); it.kf = {};
      Object.keys(def).forEach(function (p) { it.kf[p] = def[p].map(function (r) { return { t: r[0], v: r[1], e: r[2] }; }); });
      if (a === 'kfp:pop' || a === 'kfp:spin') { it.sc = 1; it.rot = 0; }
      ST.toast('Animation added'); return true;
    }
    return prevClick ? prevClick(it, a, b) : false;
  };
})();
