/* Effects: per layer transitions and filters, plus overlay and adjustment layers */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S, U = window.__U, W = ST.W, H = ST.H;
  var esc = ST.esc, cl = ST.cl;
  var ease = function (p) { return 1 - Math.pow(1 - p, 3); };
  var easeIO = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  var back = function (p) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  var bounce = function (p) {
    var n = 7.5625, d = 2.75;
    if (p < 1 / d) return n * p * p; if (p < 2 / d) return n * (p -= 1.5 / d) * p + .75;
    if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + .9375; return n * (p -= 2.625 / d) * p + .984375;
  };

  var TRANS = [
    ['none', 'None'], ['fade', 'Fade'], ['slideL', 'Slide from left'], ['slideR', 'Slide from right'], ['slideU', 'Slide from top'],
    ['slideD', 'Slide from bottom'], ['zoomIn', 'Zoom in'], ['zoomOut', 'Zoom out'], ['pop', 'Pop with bounce'], ['drop', 'Drop and bounce'],
    ['spin', 'Spin'], ['wipe', 'Wipe'], ['flipX', 'Flip'], ['blur', 'Blur'], ['shrink', 'Shrink away']
  ];

  /* p runs from 0 (hidden) to 1 (fully shown). Both the in and the out use the same maths. */
  function applyTrans(c, type, p, out) {
    if (type === 'none' || !type || p >= 1) return 1;
    var e = ease(p), a = 1;
    switch (type) {
      case 'fade': a = e; break;
      case 'slideL': c.translate(-(1 - e) * W, 0); break;
      case 'slideR': c.translate((1 - e) * W, 0); break;
      case 'slideU': c.translate(0, -(1 - e) * H); break;
      case 'slideD': c.translate(0, (1 - e) * H); break;
      case 'zoomIn': c.translate(W / 2, H / 2); c.scale(.3 + .7 * e, .3 + .7 * e); c.translate(-W / 2, -H / 2); a = e; break;
      case 'zoomOut': c.translate(W / 2, H / 2); c.scale(1.8 - .8 * e, 1.8 - .8 * e); c.translate(-W / 2, -H / 2); a = e; break;
      case 'pop': var b = Math.max(0, back(p)); c.translate(W / 2, H / 2); c.scale(b, b); c.translate(-W / 2, -H / 2); a = cl(p * 4); break;
      case 'drop': c.translate(0, -(1 - bounce(p)) * H * .8); a = cl(p * 5); break;
      case 'spin': c.translate(W / 2, H / 2); c.rotate((1 - e) * (out ? -1 : 1) * Math.PI * 1.5); c.scale(e, e); c.translate(-W / 2, -H / 2); a = e; break;
      case 'wipe': c.beginPath(); c.rect(0, 0, W * easeIO(p), H); c.clip(); break;
      case 'flipX': c.translate(W / 2, H / 2); c.scale(Math.max(.001, Math.abs(Math.cos((1 - e) * Math.PI / 2))), 1); c.translate(-W / 2, -H / 2); a = cl(p * 3); break;
      case 'blur': a = e; if ('filter' in c) c.filter = 'blur(' + Math.round((1 - e) * 24) + 'px)'; break;
      case 'shrink': c.translate(W / 2, H / 2); c.scale(e, e); c.translate(-W / 2, -H / 2); a = e; break;
    }
    return a;
  }

  function filterString(it) {
    var f = [];
    if (it.fb != null && it.fb !== 1) f.push('brightness(' + it.fb + ')');
    if (it.fc != null && it.fc !== 1) f.push('contrast(' + it.fc + ')');
    if (it.fs != null && it.fs !== 1) f.push('saturate(' + it.fs + ')');
    if (it.fbl) f.push('blur(' + it.fbl + 'px)');
    if (it.fg) f.push('grayscale(' + it.fg + ')');
    if (it.fse) f.push('sepia(' + it.fse + ')');
    if (it.fh) f.push('hue-rotate(' + it.fh + 'deg)');
    if (it.fi) f.push('invert(' + it.fi + ')');
    return f.join(' ');
  }
  EXT.filterString = filterString;

  EXT.fx = {
    pre: function (c, it, t, rem) {
      var a = 1, ti = it.tin, to = it.tout;
      var d1 = it.tind || .5, d2 = it.toutd || .5;
      if (ti && ti !== 'none') { var p = cl((t - it.start) / d1); if (p < 1) a *= applyTrans(c, ti, p, false); }
      if (to && to !== 'none') { var q = cl(rem / d2); if (q < 1) a *= applyTrans(c, to, q, true); }
      var fs = filterString(it);
      if (fs && 'filter' in c) c.filter = (c.filter && c.filter !== 'none' ? c.filter + ' ' : '') + fs;
      return a;
    },
    post: function () {}
  };

  /* ---------- the form shown for every layer ---------- */
  EXT.fxHtml = function (it) {
    var h = U.sec('TRANSITIONS',
      '<div class="g2">' + U.select(it, 'tin', 'Comes in', TRANS, 'none') + U.select(it, 'tout', 'Goes out', TRANS, 'none') + '</div>' +
      '<div class="g2">' + U.range(it, 'tind', 'In time', .1, 2, .05, .5, 's') + U.range(it, 'toutd', 'Out time', .1, 2, .05, .5, 's') + '</div>');
    h += U.sec('FILTERS',
      U.range(it, 'fb', 'Brightness', 0, 2, .05, 1, '') + U.range(it, 'fc', 'Contrast', 0, 2, .05, 1, '') + U.range(it, 'fs', 'Color strength', 0, 3, .05, 1, '') +
      U.range(it, 'fbl', 'Blur', 0, 20, .5, 0, 'px') + U.range(it, 'fg', 'Black and white', 0, 1, .05, 0, '') + U.range(it, 'fse', 'Warm old film', 0, 1, .05, 0, '') +
      U.range(it, 'fh', 'Shift colors', -180, 180, 5, 0, 'deg') +
      '<div class="acts">' + U.btn('fxreset', 'Reset filters') + U.btn('fxpresetbw', 'Black and white') + U.btn('fxpresetwarm', 'Warm food look') + U.btn('fxpresetpunch', 'Punchy') + '</div>');
    return h;
  };
  var PRESETS = {
    fxreset: { fb: 1, fc: 1, fs: 1, fbl: 0, fg: 0, fse: 0, fh: 0, fi: 0 },
    fxpresetbw: { fb: 1, fc: 1.15, fs: 1, fg: 1, fse: 0 },
    fxpresetwarm: { fb: 1.05, fc: 1.1, fs: 1.25, fse: .25, fh: -8 },
    fxpresetpunch: { fb: 1.02, fc: 1.25, fs: 1.45, fg: 0, fse: 0 }
  };
  EXT.fxClick = function (it, a) {
    if (!PRESETS[a]) return false;
    Object.keys(PRESETS.fxreset).forEach(function (k) { it[k] = PRESETS.fxreset[k]; });
    Object.keys(PRESETS[a]).forEach(function (k) { it[k] = PRESETS[a][k]; });
    return true;
  };

  /* ---------- overlay layers ---------- */
  var OV = {
    vignette: {
      name: 'Vignette', dur: 5, def: { amt: .7, size: .55, col: '#000000' },
      form: function (it) { return U.range(it, 'amt', 'Darkness', 0, 1, .05, .7, '') + U.range(it, 'size', 'Size', .2, 1, .05, .55, '') + U.color(it, 'col', 'Color', '#000000'); },
      draw: function (c, it, t, lt) {
        var g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (it.size == null ? .55 : it.size) * .5, W / 2, H / 2, Math.hypot(W, H) / 2);
        g.addColorStop(0, hexA(it.col || '#000', 0)); g.addColorStop(1, hexA(it.col || '#000', it.amt == null ? .7 : it.amt));
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
    },
    grain: {
      name: 'Film grain', dur: 5, def: { amt: .35, size: 2 },
      form: function (it) { return U.range(it, 'amt', 'Amount', 0, 1, .05, .35, '') + U.range(it, 'size', 'Grain size', 1, 5, .5, 2, 'px'); },
      draw: function (c, it, t) {
        var seed = Math.floor(t * 24) * 7919 + 13, n = Math.floor(2200 * (it.amt == null ? .35 : it.amt)), s = it.size || 2;
        for (var i = 0; i < n; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; var x = (seed % W), y = ((seed >>> 10) % H), v = (seed >>> 20) & 255; c.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.35)'; c.fillRect(x, y, s, s); }
      }
    },
    scan: {
      name: 'Scan lines', dur: 5, def: { amt: .25, gap: 4 },
      form: function (it) { return U.range(it, 'amt', 'Darkness', 0, .8, .05, .25, '') + U.range(it, 'gap', 'Line spacing', 2, 12, 1, 4, 'px'); },
      draw: function (c, it, t) {
        var g = it.gap || 4; c.fillStyle = 'rgba(0,0,0,' + (it.amt == null ? .25 : it.amt) + ')'; var off = (t * 20) % g;
        for (var y = -g + off; y < H; y += g) c.fillRect(0, y, W, g / 2);
      }
    },
    bars: {
      name: 'Cinema bars', dur: 5, def: { size: 90, col: '#000000' },
      form: function (it) { return U.range(it, 'size', 'Bar height', 20, 200, 5, 90, 'px') + U.color(it, 'col', 'Color', '#000000'); },
      draw: function (c, it, t, lt) {
        var p = ease(cl(lt / .6)), h = (it.size || 90) * p; c.fillStyle = it.col || '#000'; c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h);
      }
    },
    flash: {
      name: 'Flash', dur: 0.6, def: { col: '#ffffff', amt: 1 },
      form: function (it) { return U.color(it, 'col', 'Color', '#ffffff') + U.range(it, 'amt', 'Brightness', .1, 1, .05, 1, ''); },
      draw: function (c, it, t, lt) {
        var p = cl(lt / it.dur), a = (p < .2 ? p / .2 : 1 - (p - .2) / .8) * (it.amt == null ? 1 : it.amt); c.fillStyle = hexA(it.col || '#fff', cl(a)); c.fillRect(0, 0, W, H);
      }
    },
    wash: {
      name: 'Color wash', dur: 5, def: { col: '#ff8a3d', amt: .25, mode: 'soft-light' },
      form: function (it) { return U.color(it, 'col', 'Color', '#ff8a3d') + U.range(it, 'amt', 'Strength', 0, 1, .05, .25, '') + U.select(it, 'mode', 'Blend', ['source-over', 'multiply', 'screen', 'overlay', 'soft-light', 'color'], 'soft-light'); },
      draw: function (c, it) { c.save(); c.globalCompositeOperation = it.mode || 'soft-light'; c.fillStyle = hexA(it.col || '#ff8a3d', it.amt == null ? .25 : it.amt); c.fillRect(0, 0, W, H); c.restore(); }
    },
    leak: {
      name: 'Light leak', dur: 3, def: { col: '#ff9a3c', amt: .7 },
      form: function (it) { return U.color(it, 'col', 'Color', '#ff9a3c') + U.range(it, 'amt', 'Strength', 0, 1, .05, .7, ''); },
      draw: function (c, it, t, lt) {
        var p = cl(lt / it.dur), x = -200 + p * (W + 400), a = Math.sin(p * Math.PI) * (it.amt == null ? .7 : it.amt);
        c.save(); c.globalCompositeOperation = 'screen'; var g = c.createRadialGradient(x, H * .3, 0, x, H * .3, 520);
        g.addColorStop(0, hexA(it.col || '#ff9a3c', a)); g.addColorStop(1, hexA(it.col || '#ff9a3c', 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
      }
    },
    frame: {
      name: 'Border frame', dur: 5, def: { w: 18, col: '#ffffff' },
      form: function (it) { return U.range(it, 'w', 'Thickness', 2, 60, 1, 18, 'px') + U.color(it, 'col', 'Color', '#ffffff'); },
      draw: function (c, it) { var w = it.w || 18; c.strokeStyle = it.col || '#fff'; c.lineWidth = w; c.strokeRect(w / 2, w / 2, W - w, H - w); }
    }
  };
  function hexA(hex, a) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '#000000'); var n = m ? parseInt(m[1], 16) : 0;
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  EXT.hexA = hexA;

  EXT.register('fxo', {
    label: 'Overlay', cls: 'x', nolook: true,
    name: function (it) { return OV[it.type] ? OV[it.type].name : 'Overlay'; },
    valid: function (it) { return !!OV[it.type]; },
    draw: function (c, it, t, lt) { OV[it.type].draw(c, it, t, lt); },
    inspector: function (it) { return U.sec('OVERLAY', OV[it.type].form(it)); }
  });

  /* ---------- adjustment layers: they change everything underneath ---------- */
  var ADJ = {
    grade: { name: 'Color grade', def: { fb: 1, fc: 1.1, fs: 1.15, fse: 0, fg: 0, fh: 0 } },
    bw: { name: 'Black and white', def: { fb: 1, fc: 1.2, fs: 1, fg: 1 } },
    warm: { name: 'Warm food look', def: { fb: 1.04, fc: 1.1, fs: 1.3, fse: .25, fh: -8 } },
    cool: { name: 'Cool look', def: { fb: 1, fc: 1.1, fs: .95, fh: 18 } },
    blur: { name: 'Blur everything', def: { fbl: 8 } },
    camera: { name: 'Camera move', def: { z0: 1, z1: 1.15, shake: 0 } },
    shake: { name: 'Camera shake', def: { shake: 14, z0: 1.05, z1: 1.05 } }
  };
  var tmp = null;
  EXT.register('adj', {
    label: 'Adjustment', cls: 'x', nolook: true,
    name: function (it) { return ADJ[it.type] ? ADJ[it.type].name : 'Adjustment'; },
    valid: function (it) { return !!ADJ[it.type]; },
    draw: function (c, it, t, lt) {
      var cv = c.canvas, w = cv.width, h = cv.height; if (!tmp) tmp = document.createElement('canvas');
      if (tmp.width !== w || tmp.height !== h) { tmp.width = w; tmp.height = h; }
      var tc = tmp.getContext('2d'); tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalAlpha = 1; tc.clearRect(0, 0, w, h); tc.drawImage(cv, 0, 0);
      var p = cl(lt / it.dur), z = (it.z0 == null ? 1 : it.z0) + ((it.z1 == null ? 1 : it.z1) - (it.z0 == null ? 1 : it.z0)) * easeIO(p);
      var sh = it.shake || 0, ox = sh ? Math.sin(t * 53) * sh + Math.sin(t * 31) * sh * .5 : 0, oy = sh ? Math.cos(t * 47) * sh + Math.cos(t * 23) * sh * .5 : 0;
      var f = filterString(it);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      if (f && 'filter' in c) c.filter = f;
      c.globalAlpha = 1; c.clearRect(0, 0, w, h);
      c.translate(w / 2 + ox * w / W, h / 2 + oy * h / H); c.scale(z, z); c.translate(-w / 2, -h / 2); c.drawImage(tmp, 0, 0);
      c.restore();
    },
    inspector: function (it) {
      var h = U.sec('GRADE', U.range(it, 'fb', 'Brightness', 0, 2, .05, 1, '') + U.range(it, 'fc', 'Contrast', 0, 2, .05, 1, '') + U.range(it, 'fs', 'Color strength', 0, 3, .05, 1, '') +
        U.range(it, 'fg', 'Black and white', 0, 1, .05, 0, '') + U.range(it, 'fse', 'Warm old film', 0, 1, .05, 0, '') + U.range(it, 'fh', 'Shift colors', -180, 180, 5, 0, 'deg') + U.range(it, 'fbl', 'Blur', 0, 30, .5, 0, 'px'));
      h += U.sec('CAMERA', U.range(it, 'z0', 'Zoom at start', .5, 2.5, .05, 1, 'x') + U.range(it, 'z1', 'Zoom at end', .5, 2.5, .05, 1, 'x') + U.range(it, 'shake', 'Shake', 0, 40, 1, 0, 'px'));
      return h + '<p class="xnote">This layer changes everything on the rows below it. Put it on the top video row and stretch it over the part you want to change.</p>';
    }
  });

  /* ---------- the FX tab ---------- */
  function addLayer(kind, type, extra) {
    var base = (kind === 'fxo' ? OV : ADJ)[type], it = { id: S.next++, kind: kind, type: type, track: kind === 'adj' ? 4 : 4, start: U.round(S.t), dur: base.dur || 5, op: 1, sc: 1, dx: 0, dy: 0, rot: 0 };
    Object.keys(base.def || {}).forEach(function (k) { it[k] = base.def[k]; });
    S.items.push(it); S.sel = it.id; ST.refresh(); ST.toast(base.name + ' added at the red line');
  }
  var FXDESC = {
    vignette: 'Dark edges, focus on the middle', grain: 'Old film texture', scan: 'Retro TV lines', bars: 'Cinema black bars slide in', flash: 'Quick white flash on a beat',
    wash: 'Tint the whole picture', leak: 'A warm light sweeps across', frame: 'Draw a border around the picture', grade: 'Brightness, contrast and color', bw: 'Black and white',
    warm: 'Makes food look warm and rich', cool: 'Cool blue look', blur: 'Soft blur on everything', camera: 'Slow push in or pull out', shake: 'Shake on a heavy beat'
  };
  EXT.tab('fx', 'FX', {
    render: function (lib, tools) {
      var h = '<p class="xnote">Overlays draw on top. Adjustments change everything underneath them. Both are added at the red line on the top video row. You can also add a transition and filters to any single layer in its properties.</p>';
      h += '<div class="cnt"><span>OVERLAYS</span></div>' + Object.keys(OV).map(function (k) { return btnRow('fxo', k, OV[k].name); }).join('');
      h += '<div class="cnt" style="margin-top:12px"><span>ADJUSTMENTS</span></div>' + Object.keys(ADJ).map(function (k) { return btnRow('adj', k, ADJ[k].name); }).join('');
      lib.innerHTML = h;
      lib.onclick = function (e) { var b = e.target.closest('[data-fxadd]'); if (!b) return; var p = b.dataset.fxadd.split(':'); addLayer(p[0], p[1]); };
    }
  });
  function btnRow(kind, k, name) {
    return '<div class="sn"><div>' + esc(name) + '<small>' + esc(FXDESC[k] || '') + '</small></div><button class="b s f" data-fxadd="' + kind + ':' + k + '">Add</button></div>';
  }
  EXT.fxAdd = addLayer;
})();
