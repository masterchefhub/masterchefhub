/* Device frames and the animated pointer: show a screen recording inside a Mac window, a browser or a phone,
   and move a pointer around it with clicks. */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S, U = window.__U, W = ST.W, H = ST.H;
  var esc = ST.esc, cl = ST.cl;

  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  var FR = [['mac', 'Mac window'], ['browser', 'Browser'], ['phone', 'Phone'], ['tablet', 'Tablet'], ['plain', 'Rounded screen']];
  var WALL = [['none', 'No background'], ['black', 'Black'], ['dark', 'Dark gradient'], ['light', 'Light gradient'], ['custom', 'Pick a color']];

  /* where the screen sits for each frame (design space, before scale) */
  function layout(type, size) {
    var s = size || 1, w, h, sx, sy, sw, sh, r = 14;
    switch (type) {
      case 'phone': h = 640 * s; w = h * .49; sx = -w / 2 + 12 * s; sy = -h / 2 + 12 * s; sw = w - 24 * s; sh = h - 24 * s; r = 34 * s; return { w: w, h: h, sx: sx, sy: sy, sw: sw, sh: sh, r: r, out: 42 * s };
      case 'tablet': w = 760 * s; h = 540 * s; sx = -w / 2 + 18 * s; sy = -h / 2 + 18 * s; sw = w - 36 * s; sh = h - 36 * s; return { w: w, h: h, sx: sx, sy: sy, sw: sw, sh: sh, r: 14 * s, out: 30 * s };
      case 'plain': w = 1000 * s; h = w * 9 / 16; return { w: w, h: h, sx: -w / 2, sy: -h / 2, sw: w, sh: h, r: 22 * s, out: 22 * s };
      case 'browser': w = 1040 * s; h = 600 * s; return { w: w, h: h, sx: -w / 2, sy: -h / 2 + 46 * s, sw: w, sh: h - 46 * s, r: 0, out: 12 * s, top: 46 * s };
      default: w = 1040 * s; h = 600 * s; return { w: w, h: h, sx: -w / 2, sy: -h / 2 + 38 * s, sw: w, sh: h - 38 * s, r: 0, out: 12 * s, top: 38 * s };
    }
  }

  function drawFrame(c, it, t, lt) {
    var ty = it.frame || 'mac', s = it.dsz == null ? 1 : it.dsz, L = layout(ty, s), cx = W / 2 + (it.fx || 0), cy = H / 2 + (it.fy || 0);
    var wall = it.wall || 'dark';
    if (wall !== 'none') {
      if (wall === 'black') c.fillStyle = '#000'; else if (wall === 'custom') c.fillStyle = it.wcol || '#222';
      else { var g = c.createLinearGradient(0, 0, W, H); if (wall === 'light') { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfcfcf'); } else { g.addColorStop(0, '#2c2c2c'); g.addColorStop(1, '#050505'); } c.fillStyle = g; }
      c.fillRect(0, 0, W, H);
    }
    c.save(); c.translate(cx, cy);
    var x = -L.w / 2, y = -L.h / 2;
    if (it.shadow !== false) { c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; c.shadowOffsetY = 24; c.fillStyle = '#111'; rrect(c, x, y, L.w, L.h, L.out); c.fill(); c.restore(); }
    /* the body */
    c.fillStyle = ty === 'phone' || ty === 'tablet' ? '#0b0b0b' : '#1d1d1d'; rrect(c, x, y, L.w, L.h, L.out); c.fill();
    if (ty === 'phone' || ty === 'tablet') { c.lineWidth = 2; c.strokeStyle = '#3a3a3a'; rrect(c, x, y, L.w, L.h, L.out); c.stroke(); }
    if (L.top) {
      c.save(); rrect(c, x, y, L.w, L.h, L.out); c.clip(); c.fillStyle = '#262626'; c.fillRect(x, y, L.w, L.top); c.restore();
      var cy2 = y + L.top / 2; [['#ff5f57', 0], ['#febc2e', 1], ['#28c840', 2]].forEach(function (d) { c.fillStyle = d[0]; c.beginPath(); c.arc(x + 22 * s + d[1] * 22 * s, cy2, 6.5 * s, 0, 7); c.fill(); });
      var pw = L.w * (ty === 'browser' ? .5 : .32), px = x + (L.w - pw) / 2; c.fillStyle = '#121212'; rrect(c, px, cy2 - 13 * s, pw, 26 * s, 8 * s); c.fill();
      c.fillStyle = '#b8b8b8'; c.font = '600 ' + Math.round(14 * s) + 'px Inter,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(it.url || 'masterchefhub.com', px + pw / 2, cy2 + 1);
    }
    /* the screen */
    c.save(); rrect(c, L.sx, L.sy, L.sw, L.sh, L.r); c.clip(); c.fillStyle = '#000'; c.fillRect(L.sx, L.sy, L.sw, L.sh);
    var r = it.media && EXT.mediaRec && EXT.mediaRec(it.media);
    if (r) {
      var inner = Object.create(it); inner._dw = L.sw; inner._dh = L.sh; inner.fit = it.sfit || 'fill'; inner.rad = 0; inner.bw = 0;
      var k = EXT.kinds[r.type === 'image' ? 'img' : 'vid']; c.translate(L.sx, L.sy); c.beginPath(); c.rect(0, 0, L.sw, L.sh); c.clip();
      try { k.draw(c, inner, t, lt); } catch (e) {}
    } else { c.fillStyle = '#8d8d8d'; c.font = '700 22px Inter,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Pick a video or photo in the properties', L.sx + L.sw / 2, L.sy + L.sh / 2); }
    c.restore();
    if (ty === 'phone') { c.fillStyle = '#000'; rrect(c, -L.w * .16, y + 18 * s, L.w * .32, 26 * s, 13 * s); c.fill(); }
    c.restore();
  }

  function mediaOptions() {
    return (EXT.mediaList ? EXT.mediaList() : []).filter(function (r) { return r.type !== 'audio'; }).map(function (r) { return [r.id, r.name.slice(0, 28) + ' (' + r.type + ')']; });
  }
  EXT.register('dev', {
    label: 'Device frame', cls: 'm', speed: true, trim: true, valid: function () { return true; },
    name: function (it) { return 'FRAME  ' + ((FR.filter(function (f) { return f[0] === (it.frame || 'mac'); })[0] || [])[1] || ''); },
    draw: drawFrame,
    play: function (it, x, d, b, n) { var m = EXT.mediaRec && EXT.mediaRec(it.media); if (m && m.type === 'video') EXT.kinds.vid.play(it, x, d, b, n); },
    inspector: function (it) {
      var opts = mediaOptions(); opts.unshift(['', 'Choose...']);
      var h = U.sec('SCREEN', U.select(it, 'media', 'Video or photo on the screen', opts, '') + U.select(it, 'sfit', 'How it fits the screen', [['fill', 'Fill the screen'], ['fit', 'Fit inside'], ['stretch', 'Stretch']], 'fill') + U.range(it, 'vol', 'Its volume', 0, 2, .05, 1, ''));
      h += U.sec('FRAME', U.select(it, 'frame', 'Look', FR, 'mac') + U.range(it, 'dsz', 'Size', .3, 1.6, .05, 1, 'x') + U.range(it, 'fx', 'Shift left or right', -500, 500, 5, 0, 'px') + U.range(it, 'fy', 'Shift up or down', -300, 300, 5, 0, 'px') + U.text(it, 'url', 'Address shown on top', 'masterchefhub.com') + U.check(it, 'shadow', 'Shadow', true));
      h += U.sec('BACKGROUND', U.select(it, 'wall', 'Behind the frame', WALL, 'dark') + (it.wall === 'custom' ? U.color(it, 'wcol', 'Color', '#222222') : ''));
      return h;
    }
  });
  EXT.addDevice = function (type) {
    var list = EXT.mediaList ? EXT.mediaList().filter(function (r) { return r.type !== 'audio'; }) : [], e = 0;
    S.items.forEach(function (i) { if (i.track === 0) e = Math.max(e, i.start + i.dur); });
    var m = list[0], it = { id: S.next++, kind: 'dev', frame: type, media: m ? m.id : '', track: 0, start: U.round(e), dur: m && m.type === 'video' ? m.dur : 6, off: 0, spd: 1, vol: 1, wall: 'dark', dsz: type === 'phone' ? 1.1 : 1, op: 1, sc: 1, dx: 0, dy: 0, rot: 0 };
    S.items.push(it); S.sel = it.id; ST.refresh(); ST.toast(m ? 'Added with your latest import' : 'Added. Import a video in MEDIA, then pick it here.');
  };

  /* ---------- the pointer ---------- */
  var ARROW = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 26); c.lineTo(7, 20); c.lineTo(12, 31); c.lineTo(16, 29); c.lineTo(11, 18.5); c.lineTo(19, 18.5); c.closePath();
    c.fillStyle = '#000'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.stroke(); c.restore();
  };
  function pointAt(it, lt) {
    var P = it.pts || []; if (!P.length) return null;
    if (lt <= P[0].t) return { x: P[0].x, y: P[0].y };
    var last = P[P.length - 1]; if (lt >= last.t) return { x: last.x, y: last.y };
    for (var i = 0; i < P.length - 1; i++) {
      if (lt >= P[i].t && lt <= P[i + 1].t) {
        var q = (lt - P[i].t) / Math.max(.001, P[i + 1].t - P[i].t), e = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
        var bow = Math.hypot(P[i + 1].x - P[i].x, P[i + 1].y - P[i].y) * .08 * Math.sin(Math.PI * q);
        return { x: P[i].x + (P[i + 1].x - P[i].x) * e, y: P[i].y + (P[i + 1].y - P[i].y) * e - bow };
      }
    }
    return { x: last.x, y: last.y };
  }
  EXT.register('ptr', {
    label: 'Pointer', cls: 's', nolook: false, valid: function () { return true; },
    name: function () { return 'POINTER'; },
    draw: function (c, it, t, lt) {
      var p = pointAt(it, lt); if (!p) return; var s = (it.psz || 1) * 1.1;
      (it.pts || []).forEach(function (pt) {
        if (!pt.c) return; var q = lt - pt.t; if (q < 0 || q > .7) return; var r = 8 + q / .7 * 50;
        c.save(); c.globalAlpha *= 1 - q / .7; c.lineWidth = 4; c.strokeStyle = '#fff'; c.beginPath(); c.arc(pt.x, pt.y, r, 0, 7); c.stroke(); c.lineWidth = 2; c.strokeStyle = '#000'; c.beginPath(); c.arc(pt.x, pt.y, r + 3, 0, 7); c.stroke(); c.restore();
      });
      var press = (it.pts || []).some(function (pt) { return pt.c && lt >= pt.t && lt < pt.t + .12; });
      ARROW(c, p.x, p.y, press ? s * .85 : s);
    },
    inspector: function (it) {
      var P = it.pts || [], rows = P.map(function (p, i) {
        return '<div class="lay"><span data-a="ptjump" data-i="' + i + '" style="cursor:pointer">' + (p.c ? 'Click' : 'Move') + ' at ' + p.t.toFixed(1) + 's</span><small>' + Math.round(p.x) + ',' + Math.round(p.y) + '</small><button class="b s" data-a="ptclick" data-i="' + i + '">' + (p.c ? 'No click' : 'Click') + '</button><button class="b s d" data-a="ptdel" data-i="' + i + '">X</button></div>';
      }).join('');
      return U.sec('POINTER MOVES', '<p class="xnote">Turn on Pick, then tap the preview where the pointer should be at the red line. Move the red line and tap again for the next spot. The pointer glides between your points.</p>' +
        '<div class="acts">' + U.btn('ptpick', S.pick === it.id ? 'Picking: tap the preview' : 'Pick on the preview', S.pick === it.id ? 'on' : '') + U.btn('ptclear', 'Clear points') + '</div>' + U.range(it, 'psz', 'Pointer size', .5, 3, .1, 1, 'x') + (rows ? '<div style="margin-top:8px">' + rows + '</div>' : ''));
    },
    click: function (it, a, b) {
      var i = +b.dataset.i;
      if (a === 'ptpick') { S.pick = S.pick === it.id ? null : it.id; ST.cv.style.cursor = S.pick ? 'crosshair' : ''; return true; }
      if (a === 'ptclear') { it.pts = []; return true; }
      if (a === 'ptdel') { it.pts.splice(i, 1); return true; }
      if (a === 'ptclick') { it.pts[i].c = !it.pts[i].c; return true; }
      if (a === 'ptjump') { S.t = it.start + it.pts[i].t; ST.render(); ST.ui(); return false; }
      return false;
    }
  });
  EXT.addPointer = function () {
    var it = { id: S.next++, kind: 'ptr', track: 4, start: U.round(S.t), dur: 8, pts: [], op: 1, sc: 1, dx: 0, dy: 0, rot: 0 };
    S.items.push(it); S.sel = it.id; S.pick = it.id; ST.cv.style.cursor = 'crosshair'; ST.refresh(); ST.toast('Tap the preview to place the pointer');
  };
  /* tapping the preview while picking */
  ST.cv.addEventListener('pointerdown', function (e) {
    var it = S.pick && ST.get(S.pick); if (!it || it.kind !== 'ptr') return;
    var r = ST.cv.getBoundingClientRect(), v = EXT.lastView || { s: ST.cv.width / W, ox: 0, oy: 0 };
    var px = (e.clientX - r.left) / r.width * ST.cv.width, py = (e.clientY - r.top) / r.height * ST.cv.height;
    var x = (px - v.ox) / v.s, y = (py - v.oy) / v.s, rel = Math.max(0, U.round(S.t - it.start));
    it.pts = it.pts || []; var hit = null; it.pts.forEach(function (p) { if (Math.abs(p.t - rel) < .06) hit = p; });
    if (hit) { hit.x = x; hit.y = y; } else { it.pts.push({ t: rel, x: x, y: y, c: false }); it.pts.sort(function (a, b) { return a.t - b.t; }); }
    it.dur = Math.max(it.dur, rel + 1); ST.refresh();
  });

  /* ---------- the FRAMES tab ---------- */
  EXT.tab('frames', 'FRAMES', {
    render: function (lib) {
      lib.innerHTML = '<p class="xnote">Put a screen recording inside a device. First import it in the MEDIA tab.</p><div class="cnt"><span>DEVICE FRAMES</span></div>' +
        FR.map(function (f) { return '<div class="sn"><div>' + f[1] + '<small>Shows your latest import</small></div><button class="b s f" data-dev="' + f[0] + '">Add</button></div>'; }).join('') +
        '<div class="cnt" style="margin-top:12px"><span>POINTER</span></div><div class="sn"><div>Animated pointer<small>Glides and clicks where you tap</small></div><button class="b s f" data-ptr="1">Add</button></div>' +
        '<p class="xnote">Tip for a website showcase: import your screen recording, add a Mac window, then add the pointer on top and tap the places it should go.</p>';
      lib.onclick = function (e) { var d = e.target.closest('[data-dev]'); if (d) { EXT.addDevice(d.dataset.dev); return; } if (e.target.closest('[data-ptr]')) EXT.addPointer(); };
    }
  });
})();
