/* Shape layers: boxes, circles, lines, arrows, progress bars, backgrounds and stickers */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S, U = window.__U, W = ST.W, H = ST.H;
  var esc = ST.esc, cl = ST.cl;
  var ease = function (p) { return 1 - Math.pow(1 - p, 3); };

  var TYPES = {
    rect: 'Rectangle', round: 'Rounded box', circle: 'Circle', ring: 'Ring', tri: 'Triangle', star: 'Star', line: 'Line', arrow: 'Arrow',
    bar: 'Progress bar', grad: 'Gradient background', solid: 'Solid background', check: 'Checker background', dots: 'Dot pattern', burst: 'Sunburst',
    cursor: 'Mouse pointer', hat: 'Chef hat badge', pulse: 'Pulse ring', underline: 'Underline stroke'
  };
  var DEF = { w: 400, h: 240, fill: '#ffffff', stroke: '#000000', sw: 0, rad: 24, grow: 'none', gt: .6, fill2: '#000000', angle: 90, count: 12, op2: 1, cx: 0, cy: 0 };
  function v(it, k) { return it[k] == null ? DEF[k] : it[k]; }

  function poly(c, pts) { c.beginPath(); pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); }
  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function paintPath(c, it) {
    if (it.nofill !== true) { c.fillStyle = v(it, 'fill'); c.fill(); }
    if (v(it, 'sw') > 0) { c.lineWidth = v(it, 'sw'); c.strokeStyle = v(it, 'stroke'); c.lineJoin = 'round'; c.stroke(); }
  }

  /* grow animation: how far the shape is drawn at local time lt */
  function grow(it, lt) {
    var m = v(it, 'grow'), p = ease(cl(lt / v(it, 'gt')));
    return m === 'none' ? 1 : p;
  }

  function drawShape(c, it, t, lt) {
    var w = v(it, 'w'), h = v(it, 'h'), g = grow(it, lt), gm = v(it, 'grow'), x = W / 2 - w / 2 + v(it, 'cx'), y = H / 2 - h / 2 + v(it, 'cy');
    c.save();
    if (gm === 'scale') { c.translate(x + w / 2, y + h / 2); c.scale(g, g); c.translate(-(x + w / 2), -(y + h / 2)); }
    if (gm === 'fade') c.globalAlpha *= g;
    var gw = gm === 'wipe' ? g : 1;
    switch (it.type) {
      case 'rect': c.beginPath(); c.rect(x, y, w * gw, h); paintPath(c, it); break;
      case 'round': rrect(c, x, y, w * gw, h, v(it, 'rad')); paintPath(c, it); break;
      case 'circle': c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2 * (gm === 'wipe' ? g : 1), h / 2 * (gm === 'wipe' ? g : 1), 0, 0, Math.PI * 2); paintPath(c, it); break;
      case 'ring': c.beginPath(); c.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (gm === 'wipe' ? g : 1)); c.lineWidth = Math.max(4, v(it, 'sw') || 14); c.strokeStyle = v(it, 'fill'); c.stroke(); break;
      case 'tri': poly(c, [[x + w / 2, y], [x + w, y + h], [x, y + h]]); paintPath(c, it); break;
      case 'star': var pts = [], R = Math.min(w, h) / 2, r2 = R * .45; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r2 : R; pts.push([x + w / 2 + Math.cos(a) * rr, y + h / 2 + Math.sin(a) * rr]); } poly(c, pts); paintPath(c, it); break;
      case 'line': c.beginPath(); c.moveTo(x, y + h / 2); c.lineTo(x + w * (gm === 'wipe' ? g : 1), y + h / 2); c.lineWidth = Math.max(2, v(it, 'sw') || 8); c.strokeStyle = v(it, 'fill'); c.lineCap = 'round'; c.stroke(); break;
      case 'underline':
        c.beginPath(); c.moveTo(x, y + h / 2); c.bezierCurveTo(x + w * .25, y + h / 2 - 14, x + w * .6, y + h / 2 + 16, x + w, y + h / 2 - 6); c.lineWidth = Math.max(3, v(it, 'sw') || 10); c.strokeStyle = v(it, 'fill'); c.lineCap = 'round';
        var len = w * 1.05; c.setLineDash([len, len]); c.lineDashOffset = len * (1 - g); c.stroke(); break;
      case 'arrow':
        var L = w * (gm === 'wipe' ? g : 1), th = Math.max(8, v(it, 'sw') || 14), hy = y + h / 2;
        c.beginPath(); c.moveTo(x, hy); c.lineTo(x + Math.max(0, L - th * 2.2), hy); c.lineWidth = th; c.strokeStyle = v(it, 'fill'); c.lineCap = 'butt'; c.stroke();
        poly(c, [[x + L, hy], [x + L - th * 2.6, hy - th * 1.6], [x + L - th * 2.6, hy + th * 1.6]]); c.fillStyle = v(it, 'fill'); c.fill(); break;
      case 'bar':
        c.fillStyle = hexA(v(it, 'fill'), .25); rrect(c, x, y + h / 2 - 10, w, 20, 10); c.fill();
        c.fillStyle = v(it, 'fill'); rrect(c, x, y + h / 2 - 10, Math.max(20, w * cl(lt / it.dur)), 20, 10); c.fill(); break;
      case 'grad': var gr = c.createLinearGradient(0, 0, W * Math.cos(v(it, 'angle') * Math.PI / 180) || 0, H * Math.sin(v(it, 'angle') * Math.PI / 180)); gr.addColorStop(0, v(it, 'fill')); gr.addColorStop(1, v(it, 'fill2')); c.fillStyle = gr; c.fillRect(0, 0, W, H); break;
      case 'solid': c.fillStyle = v(it, 'fill'); c.fillRect(0, 0, W, H); break;
      case 'check': var s = v(it, 'rad') + 20, off = (lt * 30) % (s * 2); c.fillStyle = v(it, 'fill2'); c.fillRect(0, 0, W, H); c.fillStyle = v(it, 'fill');
        for (var yy = -s * 2; yy < H + s; yy += s) for (var xx = -s * 2; xx < W + s; xx += s) if (((xx / s + yy / s) % 2 + 2) % 2 === 0) c.fillRect(xx + off, yy, s, s); break;
      case 'dots': c.fillStyle = v(it, 'fill2'); c.fillRect(0, 0, W, H); c.fillStyle = v(it, 'fill'); var sp = v(it, 'rad') + 18; for (var dy = 0; dy < H + sp; dy += sp) for (var dx = 0; dx < W + sp; dx += sp) { c.beginPath(); c.arc(dx + ((lt * 20) % sp), dy, sp * .14, 0, 7); c.fill(); } break;
      case 'burst': c.fillStyle = v(it, 'fill2'); c.fillRect(0, 0, W, H); c.save(); c.translate(W / 2 + v(it, 'cx'), H / 2 + v(it, 'cy')); c.rotate(lt * .25); c.fillStyle = v(it, 'fill'); var n = v(it, 'count');
        for (var k = 0; k < n; k++) { c.rotate(Math.PI * 2 / n); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.hypot(W, H), -Math.hypot(W, H) * Math.tan(Math.PI / n / 2)); c.lineTo(Math.hypot(W, H), Math.hypot(W, H) * Math.tan(Math.PI / n / 2)); c.closePath(); c.fill(); } c.restore(); break;
      case 'cursor': c.save(); c.translate(x + w / 2, y + h / 2); var sc = Math.min(w, h) / 30; c.scale(sc, sc); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 26); c.lineTo(7, 20); c.lineTo(12, 31); c.lineTo(16, 29); c.lineTo(11, 18.5); c.lineTo(19, 18.5); c.closePath();
        c.fillStyle = v(it, 'fill'); c.fill(); c.lineWidth = 2; c.strokeStyle = v(it, 'stroke'); c.lineJoin = 'round'; c.stroke(); c.restore(); break;
      case 'hat': hatBadge(c, x + w / 2, y + h / 2, Math.min(w, h), v(it, 'fill'), v(it, 'fill2')); break;
      case 'pulse': for (var r = 0; r < 3; r++) { var pp = ((lt * .8) + r / 3) % 1; c.beginPath(); c.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2 * (.2 + pp * .8), 0, 7); c.lineWidth = 6 * (1 - pp) + 1; c.strokeStyle = hexA(v(it, 'fill'), 1 - pp); c.stroke(); } break;
    }
    c.restore();
  }
  function hexA(hex, a) { return EXT.hexA(hex, a); }
  function hatBadge(c, cx, cy, s, fg, bg) {
    c.save(); c.translate(cx, cy); var u = s / 100;
    c.fillStyle = bg; rrect(c, -50 * u, -50 * u, 100 * u, 100 * u, 22 * u); c.fill();
    c.fillStyle = fg; c.beginPath(); c.arc(-18 * u, -14 * u, 18 * u, 0, 7); c.arc(0, -24 * u, 21 * u, 0, 7); c.arc(18 * u, -14 * u, 18 * u, 0, 7); c.fill(); c.fillRect(-26 * u, -14 * u, 52 * u, 40 * u);
    c.fillStyle = bg; c.fillRect(-26 * u, 20 * u, 52 * u, 4 * u); c.fillStyle = fg; c.fillRect(-26 * u, 28 * u, 52 * u, 14 * u); c.restore();
  }

  EXT.register('shape', {
    label: 'Shape', cls: 's',
    name: function (it) { return TYPES[it.type] || 'Shape'; },
    valid: function (it) { return !!TYPES[it.type]; },
    draw: drawShape,
    inspector: function (it) {
      var bg = /grad|solid|check|dots|burst/.test(it.type), h = '';
      if (!bg) h += U.sec('SIZE', U.range(it, 'w', 'Width', 10, 1280, 5, 400, 'px') + U.range(it, 'h', 'Height', 10, 720, 5, 240, 'px'));
      var f = U.color(it, 'fill', /check|dots|burst/.test(it.type) ? 'Main color' : 'Color', '#ffffff');
      if (/grad|check|dots|burst|hat/.test(it.type)) f += U.color(it, 'fill2', 'Second color', '#000000');
      if (/rect|round|circle|tri|star|cursor/.test(it.type)) f += U.range(it, 'sw', 'Border', 0, 40, 1, 0, 'px') + (it.sw ? U.color(it, 'stroke', 'Border color', '#000000') : '');
      if (/line|arrow|underline|ring/.test(it.type)) f += U.range(it, 'sw', 'Thickness', 2, 60, 1, 10, 'px');
      if (it.type === 'round') f += U.range(it, 'rad', 'Corner roundness', 0, 120, 1, 24, 'px');
      if (/check|dots/.test(it.type)) f += U.range(it, 'rad', 'Pattern size', 10, 120, 2, 24, 'px');
      if (it.type === 'burst') f += U.range(it, 'count', 'Rays', 4, 40, 1, 12, '');
      if (it.type === 'grad') f += U.range(it, 'angle', 'Direction', 0, 360, 5, 90, 'deg');
      h += U.sec('COLOR', f);
      if (!bg && it.type !== 'bar' && it.type !== 'pulse') h += U.sec('DRAW ANIMATION', U.select(it, 'grow', 'How it appears', [['none', 'Just appears'], ['wipe', 'Draws across'], ['scale', 'Grows'], ['fade', 'Fades']], 'none') + (it.grow && it.grow !== 'none' ? U.range(it, 'gt', 'Takes', .1, 3, .1, .6, 's') : ''));
      if (!bg) h += U.sec('OFFSET', U.range(it, 'cx', 'Shift left or right', -640, 640, 5, 0, 'px') + U.range(it, 'cy', 'Shift up or down', -360, 360, 5, 0, 'px'));
      return h;
    }
  });

  var SETS = [
    ['Backgrounds', ['solid', 'grad', 'check', 'dots', 'burst']],
    ['Boxes and shapes', ['rect', 'round', 'circle', 'ring', 'tri', 'star']],
    ['Lines and arrows', ['line', 'arrow', 'underline', 'bar']],
    ['Stickers', ['cursor', 'hat', 'pulse']]
  ];
  var INIT = {
    solid: { fill: '#0a0a0a' }, grad: { fill: '#1a1a1a', fill2: '#000000', angle: 60 }, check: { fill: '#161616', fill2: '#0a0a0a', rad: 40 }, dots: { fill: '#2a2a2a', fill2: '#0a0a0a', rad: 30 }, burst: { fill: '#1b1b1b', fill2: '#0a0a0a', count: 14 },
    rect: { w: 500, h: 300 }, round: { w: 500, h: 300, rad: 36 }, circle: { w: 300, h: 300 }, ring: { w: 300, h: 300, sw: 16, grow: 'wipe', gt: 1.2 }, tri: { w: 300, h: 260 }, star: { w: 300, h: 300 },
    line: { w: 600, h: 40, sw: 8, grow: 'wipe' }, arrow: { w: 420, h: 100, sw: 16, grow: 'wipe' }, underline: { w: 600, h: 60, sw: 10, grow: 'wipe', gt: 1 }, bar: { w: 700, h: 80 },
    cursor: { w: 180, h: 180, fill: '#ffffff', stroke: '#000000' }, hat: { w: 220, h: 220, fill: '#ffffff', fill2: '#0a0a0a' }, pulse: { w: 360, h: 360 }
  };
  function addShape(type) {
    var bgs = /solid|grad|check|dots|burst/.test(type);
    var it = { id: S.next++, kind: 'shape', type: type, track: bgs ? 0 : 4, start: U.round(S.t), dur: bgs ? 6 : 4, op: 1, sc: 1, dx: 0, dy: 0, rot: 0 };
    Object.keys(INIT[type] || {}).forEach(function (k) { it[k] = INIT[type][k]; });
    if (bgs) { var e = 0; S.items.forEach(function (i) { if (i.track === 0) e = Math.max(e, i.start + i.dur); }); if (!ST.total()) it.start = 0; }
    S.items.push(it); S.sel = it.id; ST.refresh(); ST.toast(TYPES[type] + ' added');
  }
  function thumb(cvs, type) {
    var c = cvs.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#242424'; c.fillRect(0, 0, cvs.width, cvs.height); c.scale(cvs.width / W, cvs.height / H);
    var it = { type: type, dur: 4 }; Object.keys(INIT[type] || {}).forEach(function (k) { it[k] = INIT[type][k]; }); it.grow = 'none';
    if (type === 'solid') it.fill = '#444'; c.save(); try { drawShape(c, it, 1, 1.2); } catch (e) {} c.restore();
  }
  EXT.tab('shapes', 'SHAPES', {
    render: function (lib) {
      lib.innerHTML = SETS.map(function (s) {
        return '<div class="cnt"><span>' + s[0].toUpperCase() + '</span></div><div class="xgrid" style="margin-bottom:12px">' + s[1].map(function (t) {
          return '<button class="xcard" data-shape="' + t + '"><canvas width="320" height="180"></canvas><span class="plus">+</span><div class="n">' + esc(TYPES[t]) + '</div></button>';
        }).join('') + '</div>';
      }).join('');
      Array.prototype.forEach.call(lib.querySelectorAll('[data-shape]'), function (b) { thumb(b.querySelector('canvas'), b.dataset.shape); });
      lib.onclick = function (e) { var b = e.target.closest('[data-shape]'); if (b) addShape(b.dataset.shape); };
    }
  });
  EXT.addShape = addShape;
})();
