/* MasterChefHub Studio extension core
   Adds: tab bar buttons, shared form helpers, one inspector for every new layer type,
   undo and redo, copy and paste, markers, keyboard shortcuts and extra timeline tools. */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = ST.esc;

  /* ---------- styles used by the new tools ---------- */
  var css = [
    '.tabs{flex-wrap:wrap}',
    '.tabs button{flex:1 0 25%;padding:9px 4px;border-bottom:1px solid #333}',
    '.tabs button.on{background:#fff;color:#000}',
    '.xgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
    '.xcard{border:1.5px solid #fff;background:#000;text-align:left;padding:0;position:relative;display:block;width:100%}',
    '.xcard canvas,.xcard img,.xcard video{width:100%;aspect-ratio:16/9;display:block;object-fit:cover;background:#1a1a1a}',
    '.xcard .n{padding:6px 8px 2px;font-size:.7rem;font-weight:700;line-height:1.25}',
    '.xcard .m{padding:0 8px 7px;font-size:.58rem;color:#8d8d8d;letter-spacing:.1em;font-weight:700}',
    '.xcard .plus{position:absolute;top:6px;right:6px;width:26px;height:26px;background:#fff;color:#000;font-weight:800;display:grid;place-items:center}',
    '.xrow{display:flex;gap:8px;align-items:center;margin-bottom:8px}',
    '.xrow>*{flex:1;min-width:0}',
    '.xnote{color:#8d8d8d;font-size:.74rem;line-height:1.5;margin:6px 0 10px}',
    '.xdrop{border:2px dashed #666;padding:22px 12px;text-align:center;font-size:.76rem;font-weight:700;letter-spacing:.08em;color:#bbb;margin-bottom:10px}',
    '.xdrop.over{border-color:#fff;color:#fff;background:#151515}',
    'input[type=color]{padding:2px;height:36px;cursor:pointer}',
    '.mk{position:absolute;top:0;bottom:0;width:2px;background:#ffb020;z-index:3;cursor:pointer}',
    '.mk:before{content:"";position:absolute;top:0;left:0;border:6px solid transparent;border-top-color:#ffb020;border-left-color:#ffb020}',
    '.it.x{background:#d9d9d9;color:#000;border-style:solid}',
    '.it.t{background:#fff;color:#000;border-style:double;border-width:4px}',
    '.it.s{background:#000;color:#fff;border-style:dotted}',
    '.it.m{background:#ececec;color:#000;border-color:#fff}',
    '.it canvas.wv{position:absolute;left:0;top:0;width:100%;height:100%;opacity:.55;pointer-events:none}',
    '.pill{display:inline-block;border:1px solid #555;padding:2px 7px;font-size:.58rem;letter-spacing:.12em;font-weight:800;color:#bbb;margin:0 4px 4px 0}',
    '.kb{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:.74rem;color:#bbb}',
    '.kb b{color:#fff;font-weight:800}',
    'header .b.s{padding:6px 9px}',
    '.acts .b{white-space:normal;text-align:center;line-height:1.3}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- form helpers: every input carries data-f so one handler can edit any field ---------- */
  var U = window.__U = {
    val: function (it, f, d) { return it[f] == null ? d : it[f]; },
    range: function (it, f, label, min, max, step, d, unit) {
      var v = U.val(it, f, d);
      return '<div class="fl"><label>' + label + ' <span class="val">' + (Math.round(v * 100) / 100) + (unit || '') + '</span></label>' +
        '<input type="range" data-f="' + f + '" data-t="num" data-u="' + (unit || '') + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '"></div>';
    },
    num: function (it, f, label, min, max, step, d) {
      return '<div class="fl"><label>' + label + '</label><input type="number" data-f="' + f + '" data-t="num" min="' + min + '" max="' + max + '" step="' + step + '" value="' + U.val(it, f, d) + '"></div>';
    },
    text: function (it, f, label, d, multi) {
      var v = esc(U.val(it, f, d));
      return '<div class="fl"><label>' + label + '</label>' + (multi ? '<textarea rows="3" data-f="' + f + '" data-t="str">' + v + '</textarea>' : '<input data-f="' + f + '" data-t="str" value="' + v + '">') + '</div>';
    },
    color: function (it, f, label, d) {
      return '<div class="fl"><label>' + label + '</label><input type="color" data-f="' + f + '" data-t="str" value="' + U.val(it, f, d) + '"></div>';
    },
    select: function (it, f, label, opts, d) {
      var v = U.val(it, f, d);
      return '<div class="fl"><label>' + label + '</label><select data-f="' + f + '" data-t="str">' + opts.map(function (o) {
        var k = Array.isArray(o) ? o[0] : o, n = Array.isArray(o) ? o[1] : o;
        return '<option value="' + esc(k) + '"' + (String(v) === String(k) ? ' selected' : '') + '>' + esc(n) + '</option>';
      }).join('') + '</select></div>';
    },
    check: function (it, f, label, d) {
      return '<div class="fl"><label style="cursor:pointer;justify-content:flex-start;gap:8px"><input type="checkbox" data-f="' + f + '" data-t="bool"' + (U.val(it, f, d) ? ' checked' : '') + '> ' + label + '</label></div>';
    },
    sec: function (title, html) { return '<div class="sec"><h4>' + title + '</h4>' + html + '</div>'; },
    btn: function (act, label, extra) { return '<button class="b s' + (extra ? ' ' + extra : '') + '" data-a="' + act + '">' + label + '</button>'; },
    grid3: function (it, f, d) {
      /* nine position buttons: sets it[f] to a number 0 to 8 */
      var v = U.val(it, f, d), h = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:8px">';
      for (var i = 0; i < 9; i++) h += '<button class="b s' + (v === i ? ' on' : '') + '" data-a="pos" data-v="' + i + '" style="padding:10px 0;' + (v === i ? 'background:#fff;color:#000' : '') + '">' + ['TL', 'T', 'TR', 'L', 'C', 'R', 'BL', 'B', 'BR'][i] + '</button>';
      return h + '</div>';
    },
    round: function (v) { return Math.round(v * 100) / 100; },
    clone: function (o) { return JSON.parse(JSON.stringify(o)); },
    uid: function () { return Math.random().toString(36).slice(2, 10); },
    download: function (name, blob) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); URL.revokeObjectURL(a.href); }, 500); }
  };

  /* ---------- tabs ---------- */
  function installTabs() {
    var bar = $('.tabs');
    EXT.tabOrder.forEach(function (t) {
      if ($('.tabs button[data-tab="' + t[0] + '"]')) return;
      var b = document.createElement('button'); b.dataset.tab = t[0]; b.textContent = t[1]; bar.insertBefore(b, $('#tE'));
    });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tab]'); if (!b) return;
      var t = b.dataset.tab; if (t === 'clips' || t === 'snd' || t === 'edit') return;
      ST.setTab(t);
    });
  }

  /* ---------- the shared inspector for every new layer type ---------- */
  var LAYER_ACTIONS = [['dup', 'Duplicate'], ['split', 'Split at playhead'], ['lock', 'Lock'], ['hide', 'Hide'], ['front', 'Move up a row'], ['back', 'Move down a row'], ['rip', 'Delete, close gap'], ['del', 'Delete']];
  EXT.inspect = function (it) {
    var k = EXT.kinds[it.kind], h = '<h3 class="hd">' + esc(ST.nameOf(it).toUpperCase().slice(0, 22)) + '<small>' + esc((k.label || it.kind).toUpperCase()) + '</small></h3>';
    if (k.inspector) h += k.inspector(it);
    var aud = k.audio === true;
    h += U.sec('TIMING',
      '<div class="g2">' + U.num(it, 'start', 'Start (sec)', 0, 9999, .1, it.start) + U.num(it, 'dur', 'Length (sec)', .1, 9999, .1, it.dur) + '</div>' +
      (k.speed ? U.range(it, 'spd', 'Speed', .25, 3, .05, 1, 'x') : '') +
      (k.trim ? U.num(it, 'off', 'Start inside the file (sec)', 0, 9999, .1, 0) : '') +
      (aud ? '' : U.select(it, 'fade', 'Fade in and out', [[0, 'None'], [.3, 'Short'], [.6, 'Medium'], [1, 'Long']], 0)));
    if (aud) {
      h += U.sec('SOUND', U.range(it, 'vol', 'Volume', 0, 2, .05, 1, '') + U.range(it, 'fin', 'Fade in', 0, 5, .1, 0, 's') + U.range(it, 'fout', 'Fade out', 0, 5, .1, 0, 's'));
    } else if (!k.nolook) {
      h += U.sec('LOOK AND POSITION',
        U.range(it, 'op', 'Opacity', 0, 1, .05, 1, '') + U.range(it, 'sc', 'Size', .2, 3, .05, 1, 'x') +
        U.range(it, 'dx', 'Move left or right', -640, 640, 5, 0, '') + U.range(it, 'dy', 'Move up or down', -360, 360, 5, 0, '') +
        U.range(it, 'rot', 'Rotate', -180, 180, 1, 0, 'deg') + U.check(it, 'flip', 'Flip sideways', false));
      if (EXT.fxHtml) h += EXT.fxHtml(it);
    }
    var acts = LAYER_ACTIONS.filter(function (a) { return !aud || (a[0] !== 'front' && a[0] !== 'back' && a[0] !== 'hide'); });
    h += U.sec('ACTIONS', '<div class="acts">' + (aud ? U.btn('mute', it.mute ? 'Unmute' : 'Mute') : '') + (k.preview !== false ? U.btn('prev', 'Preview') : '') + acts.map(function (a) {
      var lab = a[0] === 'lock' && it.lock ? 'Unlock' : a[0] === 'hide' && it.hide ? 'Show' : a[1];
      return U.btn(a[0], lab, a[0] === 'del' ? 'd' : '');
    }).join('') + '</div>');
    return h;
  };

  /* typed value from an element */
  function readEl(el) {
    var t = el.dataset.t;
    if (t === 'num') { var n = parseFloat(el.value); return isNaN(n) ? 0 : n; }
    if (t === 'bool') return !!el.checked;
    return el.value;
  }
  EXT.onInput = function (it, id, v, el) {
    var f = el && el.dataset && el.dataset.f; if (!f) return false;
    var val = readEl(el);
    if (f === 'dur') val = Math.max(.1, val);
    if (f === 'start') val = Math.max(0, val);
    if (f === 'fade') val = +val;
    it[f] = val;
    var k = EXT.kinds[it.kind]; if (k && k.changed) k.changed(it, f, val);
    return true;
  };

  function moveRow(it, dir) {
    var list = ST.S && EXT.audioTracks.indexOf(it.track) >= 0 ? EXT.audioTracks : EXT.videoTracks;
    /* order top to bottom on screen: video 4,1,0 and audio 2,3,5 */
    var order = EXT.isAudTrack(it.track) ? [2, 3, 5] : [4, 1, 0], i = order.indexOf(it.track);
    var n = order[Math.max(0, Math.min(order.length - 1, i + dir))];
    it.track = n;
  }
  function split(it) {
    var at = S.t;
    if (at > it.start + .15 && at < it.start + it.dur - .15) {
      var d2 = U.clone(it); d2.id = S.next++; d2.start = at; d2.off = (it.off || 0) + (at - it.start) * (it.spd || 1); d2.dur = it.start + it.dur - at; it.dur = at - it.start; S.items.push(d2); S.sel = d2.id; return true;
    }
    return false;
  }
  EXT.actions = {
    dup: function (it) { ST.dup(it); ST.toast('Duplicated'); },
    split: function (it) { if (split(it)) ST.toast('Split'); else ST.toast('Move the playhead inside the layer first'); },
    lock: function (it) { it.lock = !it.lock; },
    hide: function (it) { it.hide = !it.hide; },
    mute: function (it) { it.mute = !it.mute; },
    front: function (it) { moveRow(it, -1); },
    back: function (it) { moveRow(it, 1); },
    del: function (it) { S.items = S.items.filter(function (i) { return i !== it; }); S.sel = null; ST.toast('Deleted'); },
    rip: function (it) {
      S.items = S.items.filter(function (i) { return i !== it; });
      S.items.forEach(function (i) { if (i.track === it.track && i.start >= it.start + it.dur - .01) i.start = Math.max(0, U.round(i.start - it.dur)); });
      S.sel = null; ST.toast('Deleted, gap closed');
    },
    prev: function (it) { ST.pause(); S.t = it.start; S.stopAt = it.start + it.dur; ST.play(); }
  };
  EXT.onClick = function (it, t) {
    var b = t.closest('[data-a]'); if (!b) return false;
    var a = b.dataset.a, k = EXT.kinds[it.kind];
    if (a === 'pos') { it.pos = +b.dataset.v; if (k && k.changed) k.changed(it, 'pos', it.pos); ST.refresh(); return true; }
    if (k && k.click && k.click(it, a, b)) { ST.refresh(); return true; }
    if (EXT.fxClick && EXT.fxClick(it, a, b)) { ST.refresh(); return true; }
    if (EXT.actions[a]) { EXT.actions[a](it); ST.refresh(); return true; }
    return false;
  };

  /* ---------- project info shown when nothing is selected ---------- */
  EXT.homeParts = []; EXT.homeActions = {};
  EXT.homeInsp = function () { return EXT.homeParts.map(function (f) { try { return f(); } catch (e) { return ''; } }).join(''); };
  $('#insp').addEventListener('click', function (e) {
    var b = e.target.closest('[data-h]'); if (!b) return;
    var f = EXT.homeActions[b.dataset.h]; if (f) { f(b); }
  });
  $('#insp').addEventListener('input', function (e) {
    var el = e.target; if (!el.dataset || !el.dataset.hf) return;
    var f = EXT.homeFields && EXT.homeFields[el.dataset.hf]; if (f) f(el.value, el);
  });

  /* ---------- undo and redo ---------- */
  var hist = [], hi = -1, restoring = false, hT = 0;
  function snap() { return JSON.stringify({ items: S.items, next: S.next, meta: S.meta || null }); }
  function pushHist() {
    if (restoring) return;
    clearTimeout(hT);
    hT = setTimeout(function () {
      var s = snap(); if (hist[hi] === s) return;
      hist = hist.slice(0, hi + 1); hist.push(s); if (hist.length > 120) hist.shift(); hi = hist.length - 1; updUndo();
    }, 300);
  }
  function restore(i) {
    var d = JSON.parse(hist[i]); restoring = true;
    S.items = d.items.filter(ST.valid); S.next = d.next; S.meta = d.meta;
    if (!ST.get(S.sel)) S.sel = null;
    ST.refresh(); restoring = false; updUndo(); EXT.emit('restored');
  }
  EXT.undo = function () { clearTimeout(hT); var s = snap(); if (hist[hi] !== s) { hist = hist.slice(0, hi + 1); hist.push(s); hi = hist.length - 1; } if (hi > 0) { hi--; restore(hi); ST.toast('Undo'); } };
  EXT.redo = function () { if (hi < hist.length - 1) { hi++; restore(hi); ST.toast('Redo'); } };
  function updUndo() {
    var u = $('#bUndo'), r = $('#bRedo'); if (u) u.disabled = hi <= 0; if (r) r.disabled = hi >= hist.length - 1;
    if (u) u.style.opacity = hi <= 0 ? .4 : 1; if (r) r.style.opacity = hi >= hist.length - 1 ? .4 : 1;
  }
  EXT.on('save', pushHist);
  EXT.resetHistory = function () { hist = [snap()]; hi = 0; updUndo(); };

  function headerButtons() {
    var h = $('header'), ex = $('#bExp');
    [['bUndo', 'Undo', EXT.undo], ['bRedo', 'Redo', EXT.redo]].forEach(function (x) {
      var b = document.createElement('button'); b.className = 'b s'; b.id = x[0]; b.textContent = x[1]; b.addEventListener('click', x[2]); h.insertBefore(b, ex);
    });
  }

  /* ---------- copy and paste ---------- */
  var clip = null;
  function copy() { var it = ST.cur(); if (it) { clip = U.clone(it); ST.toast('Copied'); } }
  function paste() {
    if (!clip) return; var d = U.clone(clip); d.id = S.next++; d.start = U.round(S.t); S.items.push(d); S.sel = d.id; ST.refresh(); ST.toast('Pasted at playhead');
  }

  /* ---------- markers ---------- */
  function meta() { S.meta = S.meta || {}; S.meta.markers = S.meta.markers || []; return S.meta; }
  EXT.addMarker = function () { var m = meta(); m.markers.push({ t: U.round(S.t), n: 'Marker ' + (m.markers.length + 1) }); m.markers.sort(function (a, b) { return a.t - b.t; }); ST.drawTL(); ST.save(); ST.toast('Marker added'); };
  EXT.on('timeline', function () {
    var r = $('#ruler'); if (!r) return; $$('.mk', r).forEach(function (n) { n.remove(); });
    (meta().markers || []).forEach(function (m, i) {
      var d = document.createElement('div'); d.className = 'mk'; d.style.left = ST.pxs(m.t) + 'px'; d.title = m.n; d.dataset.mi = i; r.appendChild(d);
    });
  });
  $('#ruler').addEventListener('dblclick', function (e) {
    var d = e.target.closest('.mk'); if (!d) return; meta().markers.splice(+d.dataset.mi, 1); ST.drawTL(); ST.save();
  });
  EXT.homeParts.push(function () {
    var m = meta().markers; if (!m.length) return '';
    return U.sec('MARKERS', m.map(function (x, i) { return '<div class="lay"><span data-h="jump" data-t="' + x.t + '" style="cursor:pointer">' + esc(x.n) + '</span><small>' + ST.fmt(x.t) + '</small><button class="b s d" data-h="mkdel" data-i="' + i + '">X</button></div>'; }).join('') + '<p class="xnote">Press M to add a marker at the red line. Double click a marker on the ruler to remove it.</p>');
  });
  EXT.homeActions.jump = function (b) { S.t = +b.dataset.t; ST.render(); ST.ui(); };
  EXT.homeActions.mkdel = function (b) { meta().markers.splice(+b.dataset.i, 1); ST.refresh(); };

  /* ---------- timeline helpers ---------- */
  function wheelZoom() {
    $('#tls').addEventListener('wheel', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault();
      S.pps = Math.max(20, Math.min(240, S.pps * (e.deltaY < 0 ? 1.12 : .89))); var z = $('#zoom'); z.max = 240; z.value = S.pps; ST.drawTL();
    }, { passive: false });
  }
  EXT.stepSel = function (dir) {
    var list = S.items.slice().sort(function (a, b) { return a.start - b.start; }), i = list.findIndex(function (x) { return x.id === S.sel; });
    var n = list[Math.max(0, Math.min(list.length - 1, i + dir))]; if (n) { S.sel = n.id; S.t = n.start; ST.drawTL(); ST.insp(); ST.render(); ST.ui(); }
  };

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    var tg = e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
    var mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? EXT.redo() : EXT.undo(); }
    else if (mod && k === 'y') { e.preventDefault(); EXT.redo(); }
    else if (mod && k === 'c') { copy(); }
    else if (mod && k === 'v') { paste(); }
    else if (mod && k === 's') { e.preventDefault(); $('#bSave').click(); }
    else if (!mod && k === 'm') { EXT.addMarker(); }
    else if (!mod && k === 's') { var it = ST.cur(); if (it && it.kind !== 'clip' && EXT.kinds[it.kind]) { split(it); ST.refresh(); } }
    else if (e.key === 'Home') { S.t = 0; ST.render(); ST.ui(); $('#tls').scrollLeft = 0; }
    else if (e.key === 'End') { S.t = ST.total(); ST.render(); ST.ui(); }
    else if (e.key === 'ArrowLeft' && e.shiftKey) { S.t = Math.max(0, S.t - 1); ST.render(); ST.ui(); }
    else if (e.key === 'ArrowRight' && e.shiftKey) { S.t += 1; ST.render(); ST.ui(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); EXT.stepSel(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); EXT.stepSel(1); }
    else if (k === '=' || k === '+') { S.pps = Math.min(240, S.pps * 1.2); ST.drawTL(); }
    else if (k === '-') { S.pps = Math.max(20, S.pps / 1.2); ST.drawTL(); }
  });
  EXT.homeParts.push(function () {
    return U.sec('SHORTCUTS',
      '<div class="kb"><b>Space</b><span>play or pause</span><b>S</b><span>split at the red line</span><b>D</b><span>duplicate</span><b>Ctrl Z / Y</b><span>undo or redo</span><b>Ctrl C / V</b><span>copy and paste</span><b>M</b><span>add a marker</span><b>Up / Down</b><span>previous or next layer</span><b>Shift + Left / Right</b><span>jump 1 second</span><b>Home / End</b><span>start or end</span><b>+ / -</b><span>zoom the timeline</span></div>');
  });

  /* ---------- start ---------- */
  window.addEventListener('load', installTabs); headerButtons(); wheelZoom();
  var ready = function () { EXT.resetHistory(); };
  var wait = setInterval(function () { if (window.__started) { clearInterval(wait); ready(); } }, 100);
})();
