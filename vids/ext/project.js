/* Projects: save several, switch between them, pick the video shape (wide, tall, square),
   start from a template, and export the project or a single frame. */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S, U = window.__U, W = ST.W, H = ST.H;
  var esc = ST.esc, $ = function (s) { return document.querySelector(s); };

  var KEY = 'mch_projects';
  function store() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function putStore(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch (e) { ST.toast('Could not save: this device is out of space'); return false; } }
  function meta() { S.meta = S.meta || {}; S.meta.markers = S.meta.markers || []; return S.meta; }

  /* ---------- shapes of video ---------- */
  var ASPECTS = {
    '16:9': { n: 'Wide (YouTube)', r: 16 / 9, p: [1280, 720], e: { 720: [1280, 720], 1080: [1920, 1080] } },
    '9:16': { n: 'Tall (Reel, Short, TikTok)', r: 9 / 16, p: [540, 960], e: { 720: [720, 1280], 1080: [1080, 1920] } },
    '1:1': { n: 'Square (Post)', r: 1, p: [720, 720], e: { 720: [720, 720], 1080: [1080, 1080] } },
    '4:5': { n: 'Portrait (Post)', r: .8, p: [720, 900], e: { 720: [720, 900], 1080: [1080, 1350] } }
  };
  function asp() { return ASPECTS[meta().aspect] || ASPECTS['16:9']; }
  EXT.view = function (c, w, h) {
    var m = meta(), mode = m.fit || 'fit', s = mode === 'fill' ? Math.max(w / W, h / H) : Math.min(w / W, h / H);
    var px = (m.pan || 0) / 100 * (W * s - w) / 2;
    if (mode === 'fit' && m.bg && m.bg !== '#000000') { c.fillStyle = m.bg; c.fillRect(0, 0, w, h); }
    EXT.lastView = { s: s, ox: (w - W * s) / 2 - (mode === 'fill' ? px : 0), oy: (h - H * s) / 2 };
    c.translate((w - W * s) / 2 - (mode === 'fill' ? px : 0), (h - H * s) / 2); c.scale(s, s);
    c.beginPath(); c.rect(0, 0, W, H); c.clip();
  };
  EXT.previewSize = function () { return asp().p; };
  EXT.exportSize = function (res) { return asp().e[res] || asp().e[720]; };
  function applyAspect() {
    var a = asp(), cv = ST.cv; if (!S.exporting) { cv.width = a.p[0]; cv.height = a.p[1]; }
    var stage = $('.stage'); stage.style.aspectRatio = a.r > 1.7 ? '16/9' : (a.p[0] + '/' + a.p[1]);
    stage.style.width = a.r < 1 ? 'min(100%,calc((100vh - 56px - 340px) * ' + a.r + '))' : '';
    ST.render();
  }

  /* ---------- the panel shown when nothing is selected ---------- */
  EXT.homeParts.unshift(function () {
    var m = meta(), all = store(), names = Object.keys(all).sort(function (a, b) { return all[b].t - all[a].t; });
    var h = U.sec('PROJECT',
      '<div class="fl"><label>Name</label><input data-hf="name" value="' + esc(m.name || 'My video') + '"></div>' +
      '<div class="fl"><label>Video shape</label><select data-hf="aspect">' + Object.keys(ASPECTS).map(function (k) { return '<option value="' + k + '"' + ((m.aspect || '16:9') === k ? ' selected' : '') + '>' + ASPECTS[k].n + '</option>'; }).join('') + '</select></div>' +
      ((m.aspect || '16:9') !== '16:9' ? '<div class="fl"><label>Fit the 16:9 design into it</label><select data-hf="fit"><option value="fit"' + (m.fit !== 'fill' ? ' selected' : '') + '>Fit inside (bars)</option><option value="fill"' + (m.fit === 'fill' ? ' selected' : '') + '>Fill (crops the sides)</option></select></div>' +
        (m.fit === 'fill' ? '<div class="fl"><label>Move the crop <span class="val">' + (m.pan || 0) + '</span></label><input type="range" min="-100" max="100" step="5" value="' + (m.pan || 0) + '" data-hf="pan"></div>' : '') +
        (m.fit !== 'fill' ? '<div class="fl"><label>Bar color</label><input type="color" data-hf="bg" value="' + (m.bg || '#000000') + '"></div>' : '') : '') +
      '<div class="acts">' + '<button class="b s" data-h="psave">Save</button><button class="b s" data-h="psaveas">Save a copy</button><button class="b s" data-h="pnew">New project</button><button class="b s" data-h="pjson">Download file</button></div>' +
      '<p class="xnote">' + S.items.length + ' layers, ' + ST.fmt(ST.total()) + ' long. Every change is also saved automatically on this device.</p>');
    h += U.sec('SAVED PROJECTS', names.length ? names.map(function (id) {
      return '<div class="lay"><span data-h="popen" data-id="' + id + '" style="cursor:pointer">' + esc(all[id].name) + '</span><small>' + new Date(all[id].t).toLocaleDateString([], { month: 'short', day: 'numeric' }) + '</small><button class="b s d" data-h="pdel" data-id="' + id + '">X</button></div>';
    }).join('') : '<p class="hint">None yet. Press Save to keep this version.</p>');
    h += U.sec('START FROM A TEMPLATE', '<div class="acts">' + Object.keys(TEMPLATES).map(function (k) { return '<button class="b s" data-h="ptpl" data-k="' + k + '">' + TEMPLATES[k].n + '</button>'; }).join('') + '</div>');
    h += U.sec('PICTURE', '<div class="acts"><button class="b s" data-h="pframe">Save this frame as a picture</button><button class="b s" data-h="pthumb">Make a YouTube thumbnail</button></div><p class="xnote">The frame is saved at the size you picked for export.</p>');
    return h;
  });
  EXT.homeFields = {
    name: function (v) { meta().name = v; ST.save(); },
    aspect: function (v) { meta().aspect = v; applyAspect(); ST.save(); ST.insp(); },
    fit: function (v) { meta().fit = v; ST.render(); ST.save(); ST.insp(); },
    pan: function (v) { meta().pan = +v; ST.render(); ST.save(); },
    bg: function (v) { meta().bg = v; ST.render(); ST.save(); }
  };

  function snapshot() { return { name: meta().name || 'My video', items: U.clone(S.items), next: S.next, meta: U.clone(meta()), t: Date.now() }; }
  function load(p) {
    ST.pause(); S.items = p.items.filter(ST.valid); S.next = p.next || (S.items.length + 1); S.meta = p.meta || {}; S.sel = null; S.t = 0;
    applyAspect(); ST.refresh(); if (EXT.resetHistory) EXT.resetHistory(); EXT.emit('restored');
  }
  EXT.homeActions.psave = function () {
    var all = store(), id = meta().pid || ('p' + U.uid()); meta().pid = id; all[id] = snapshot(); if (putStore(all)) { ST.save(); ST.refresh(); ST.toast('Saved'); }
  };
  EXT.homeActions.psaveas = function () {
    var all = store(), id = 'p' + U.uid(), p = snapshot(); p.name += ' copy'; p.meta.pid = id; p.meta.name = p.name; all[id] = p; if (putStore(all)) { load(p); ST.toast('Saved a copy'); }
  };
  EXT.homeActions.pnew = function () {
    if (S.items.length && !confirm('Start a new empty project? Save this one first if you want to keep it.')) return;
    load({ items: [], next: 1, meta: { name: 'My video' } });
  };
  EXT.homeActions.popen = function (b) { var p = store()[b.dataset.id]; if (p) { if (S.items.length && !confirm('Open this project? Unsaved changes in the current one will be replaced.')) return; p.meta = p.meta || {}; p.meta.pid = b.dataset.id; load(p); ST.toast('Opened ' + p.name); } };
  EXT.homeActions.pdel = function (b) { var all = store(); delete all[b.dataset.id]; putStore(all); ST.insp(); };
  EXT.homeActions.pjson = function () {
    var p = snapshot(); U.download((meta().name || 'masterchefhub-project').replace(/[^\w\- ]+/g, '') + '.json', new Blob([JSON.stringify({ v: 3, name: p.name, items: p.items, next: p.next, meta: p.meta })], { type: 'application/json' }));
  };

  /* ---------- one picture of the current frame ---------- */
  function framePNG(name, sizeKey) {
    var cv = ST.cv, ow = cv.width, oh = cv.height, sz = sizeKey ? sizeKey : EXT.exportSize(+($('#res') || { value: 1080 }).value);
    cv.width = sz[0]; cv.height = sz[1]; ST.render();
    cv.toBlob(function (b) { cv.width = ow; cv.height = oh; ST.render(); if (b) U.download(name, b); }, 'image/png');
  }
  EXT.homeActions.pframe = function () { framePNG((meta().name || 'frame').replace(/[^\w\- ]+/g, '') + '.png'); };
  EXT.homeActions.pthumb = function () {
    var a = meta().aspect; if (a && a !== '16:9') { ST.toast('Switch the video shape to Wide first'); return; }
    framePNG('youtube-thumbnail.png', [1280, 720]);
  };

  /* ---------- templates ---------- */
  function clip(id, start, text, sub) {
    ST.S.t = start; var before = S.items.length; window.__addClip(id);
    var it = S.items[S.items.length - 1]; if (S.items.length - before > 0) { it.start = start; if (text != null) it.text = text; if (sub != null) it.sub = sub; }
    S.items.filter(function (i) { return i.kind === 'snd' && i.id > it.id; }).forEach(function (s) { s.start = start; });
    return it;
  }
  function snd(id, start, vol, dur) { ST.addSnd(id, start, true); var it = S.items[S.items.length - 1]; it.vol = vol == null ? 1 : vol; if (dur) it.dur = dur; return it; }
  function tx(o) { ST.S.t = o.start; var n = S.items.length; EXT.addText(o); var it = S.items[S.items.length - 1]; it.dur = o.dur || 3; return it; }
  var TEMPLATES = {
    yt: { n: 'YouTube intro and outro', make: function () {
      clip('drop-0', 0, 'WELCOME TO|MASTERCHEFHUB', 'fresh food. chef made.'); snd('beat1', 0, .5, 8);
      tx({ start: 4.2, dur: 3, text: 'Subscribe is optional', size: 54, pos: 7, box: true, pad: 16, tin: 'slideU', tout: 'fade', bold: false });
      clip('outro-3', 8, 'THANKS FOR WATCHING', 'masterchefhub.com');
    } },
    reel: { n: 'Reel, 15 seconds', make: function () {
      meta().aspect = '9:16'; meta().fit = 'fill'; applyAspect();
      clip('zoom-0', 0, 'FRESH FOOD|CHEF MADE', 'long island ny'); snd('beat2', 0, .5, 15);
      tx({ start: 3, dur: 4, text: 'Order online', size: 120, pos: 4, reveal: 'rise', tin: 'fade', tout: 'fade' });
      tx({ start: 7, dur: 4, text: '{n}+ dishes', size: 150, pos: 4, cnt0: 0, cnt1: 74, rev: 1.5, tin: 'zoomIn', tout: 'fade' });
      clip('outro-3', 11, 'MASTERCHEFHUB', 'order at masterchefhub.com');
    } },
    show: { n: 'Website showcase skeleton', make: function () {
      clip('drop-0', 0, 'WELCOME TO|MASTERCHEFHUB', 'a quick tour'); snd('beat1', 0, .5, 8);
      ['Home', 'Food', 'Plans', 'Community'].forEach(function (n, i) {
        tx({ start: 4 + i * 5, dur: 4, text: n.toUpperCase(), size: 46, pos: 6, align: 0, box: true, pad: 18, accent: true, tin: 'slideL', tout: 'slideL', maxw: 600 });
      });
      tx({ start: 4, dur: 18, text: 'Import your screen recordings in the MEDIA tab and drop them on the first row', size: 28, pos: 1, bold: false, op: .6, box: true, pad: 10 });
      clip('outro-3', 24, 'THANKS FOR WATCHING', 'masterchefhub.com');
    } }
  };
  EXT.homeActions.ptpl = function (b) {
    if (S.items.length && !confirm('A template replaces the current layers. Continue?')) return;
    var k = TEMPLATES[b.dataset.k]; ST.pause(); S.items = []; S.sel = null; S.meta = { name: k.n, markers: [] }; S.next = 1; S.sfx = false;
    k.make(); S.sfx = true; S.t = 0; applyAspect(); ST.refresh(); EXT.resetHistory(); ST.toast('Template ready. Click any layer to change it.');
  };

  /* ---------- export dialog ---------- */
  var HD = '<h3 style="letter-spacing:.2em;font-size:.8rem;margin-bottom:12px">';
  EXT.fileName = 'masterchefhub-video';
  document.addEventListener('click', function (e) {
    var b = e.target.closest('#bExp'); if (!b) return;
    if (window.__expGo) { window.__expGo = false; return; }
    e.stopImmediatePropagation(); e.preventDefault();
    if (!ST.total()) { ST.ov(HD + 'NOTHING TO EXPORT</h3><p class="hint">Add a clip first.</p><div style="height:14px"></div><button class="b f" id="ovx">OK</button>'); return; }
    var a = asp(), est = ST.total();
    ST.ov(HD + 'EXPORT VIDEO</h3><div style="text-align:left">' +
      '<div class="fl"><label>File name</label><input id="xName" value="' + esc((meta().name || 'masterchefhub-video').replace(/[^\w\- ]+/g, '')) + '"></div>' +
      '<div class="g2"><div class="fl"><label>Quality</label><select id="xQ"><option value="720">720p</option><option value="1080"' + (+$('#res').value === 1080 ? ' selected' : '') + '>1080p</option></select></div>' +
      '<div class="fl"><label>Smoothness</label><select id="xFps"><option value="24">24 fps (film)</option><option value="30" selected>30 fps</option><option value="60">60 fps</option></select></div></div>' +
      '<div class="fl"><label>File size</label><select id="xBr"><option value="3">Small</option><option value="6" selected>Normal</option><option value="12">High quality</option></select></div>' +
      '<p class="xnote">Shape: ' + a.n + '. It records in real time, so it takes about ' + ST.fmt(est) + '. Keep this page open.</p></div>' +
      '<button class="b f" id="xGo" style="width:100%;margin-bottom:8px">START EXPORT</button><button class="b" id="ovx" style="width:100%">CANCEL</button>');
  }, true);
  document.addEventListener('click', function (e) {
    if (e.target.id !== 'xGo') return;
    $('#res').value = $('#xQ').value; EXT.fps = +$('#xFps').value; var q = +$('#xQ').value, mult = +$('#xBr').value / 6;
    EXT.bitrate = Math.round((q === 1080 ? 9e6 : 5e6) * mult); EXT.fileName = ($('#xName').value || 'masterchefhub-video').replace(/[^\w\- ]+/g, '').trim() || 'masterchefhub-video';
    window.__expGo = true; $('#bExp').click();
  });

  /* ---------- load an uploaded project file ---------- */
  var fl = $('#fLoad'); if (fl) fl.addEventListener('change', function () { setTimeout(function () { applyAspect(); if (EXT.resetHistory) EXT.resetHistory(); }, 200); });
  EXT.on('started', function () { applyAspect(); });
  var wait = setInterval(function () { if (window.__started) { clearInterval(wait); applyAspect(); } }, 100);
})();
