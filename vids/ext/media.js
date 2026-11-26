/* Your own media: import videos, photos and audio, keep them on this device, edit them on the timeline,
   record a voiceover, and mix their sound into the exported video. */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S, U = window.__U, W = ST.W, H = ST.H;
  var esc = ST.esc, cl = ST.cl;

  /* ---------- storage on this device (IndexedDB) ---------- */
  var DB = null;
  function openDB() {
    return new Promise(function (res, rej) {
      if (DB) return res(DB);
      var r; try { r = indexedDB.open('mch_studio_media', 1); } catch (e) { return rej(e); }
      r.onupgradeneeded = function () { r.result.createObjectStore('media', { keyPath: 'id' }); };
      r.onsuccess = function () { DB = r.result; res(DB); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function tx(mode, fn) {
    return openDB().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction('media', mode), st = t.objectStore('media'), out = fn(st);
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : undefined); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  var dbPut = function (rec) { return tx('readwrite', function (s) { return s.put(rec); }); };
  var dbDel = function (id) { return tx('readwrite', function (s) { return s.delete(id); }); };
  var dbAll = function () { return tx('readonly', function (s) { return s.getAll(); }); };

  var LIB = [], BY = {}, filter = 'all';
  var M = {};            /* runtime cache per media id: url, img, buf, peaks */

  function rec(id) { return BY[id]; }
  function url(id) { var r = rec(id); if (!r) return null; var m = M[id] = M[id] || {}; if (!m.url) m.url = URL.createObjectURL(r.blob); return m.url; }
  function img(id) {
    var m = M[id] = M[id] || {}; if (m.img) return m.img; var u = url(id); if (!u) return null;
    var i = new Image(); i.onload = function () { m.ready = true; ST.render(); }; i.src = u; m.img = i; return i;
  }
  function fmtDur(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  /* ---------- audio decoding and waveform ---------- */
  function decodeCtx() { return ST.audio() || new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 44100); }
  function buffer(id) {
    var m = M[id] = M[id] || {}; if (m.buf) return Promise.resolve(m.buf); if (m.dec) return m.dec;
    var r = rec(id); if (!r) return Promise.resolve(null);
    m.dec = r.blob.arrayBuffer().then(function (ab) {
      return new Promise(function (res, rej) { var c = decodeCtx(); var p = c.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); });
    }).then(function (b) { m.buf = b; m.peaks = null; ST.drawTL(); return b; }).catch(function () { m.noAudio = true; return null; });
    return m.dec;
  }
  function peaks(id, n) {
    var m = M[id]; if (!m || !m.buf) return null; if (m.peaks && m.peaks.length === n) return m.peaks;
    var d = m.buf.getChannelData(0), step = Math.max(1, Math.floor(d.length / n)), out = new Array(n);
    for (var i = 0; i < n; i++) { var mx = 0, base = i * step; for (var j = 0; j < step; j += Math.max(1, step >> 5)) { var v = Math.abs(d[base + j] || 0); if (v > mx) mx = v; } out[i] = mx; }
    m.peaks = out; return out;
  }
  function decorate(it, d) {
    var id = it.media; if (!M[id] || !M[id].buf) { if (rec(id)) buffer(id); return; }
    var w = Math.max(20, Math.round(ST.pxs(it.dur))), cvs = document.createElement('canvas'); cvs.className = 'wv'; cvs.width = Math.min(w, 2000); cvs.height = 38;
    var c = cvs.getContext('2d'), buf = M[id].buf, n = cvs.width, d0 = buf.getChannelData(0), spd = it.spd || 1, o0 = (it.off || 0) * buf.sampleRate, span = it.dur * spd * buf.sampleRate;
    c.fillStyle = it.kind === 'vid' ? '#000' : '#fff';
    for (var x = 0; x < n; x++) {
      var a = Math.floor(o0 + span * x / n), b = Math.floor(o0 + span * (x + 1) / n), mx = 0, st = Math.max(1, (b - a) >> 4);
      for (var i = a; i < b; i += st) { var v = Math.abs(d0[i] || 0); if (v > mx) mx = v; }
      var h = Math.max(1, mx * 34); c.fillRect(x, 19 - h / 2, 1, h);
    }
    d.appendChild(cvs);
  }

  /* ---------- reading a file ---------- */
  function meta(file) {
    return new Promise(function (res) {
      var type = file.type.indexOf('video') === 0 ? 'video' : file.type.indexOf('image') === 0 ? 'image' : file.type.indexOf('audio') === 0 ? 'audio' : null;
      if (!type) { var n = file.name.toLowerCase(); type = /\.(mp4|mov|m4v|webm|mkv)$/.test(n) ? 'video' : /\.(png|jpe?g|webp|gif|heic|avif)$/.test(n) ? 'image' : /\.(mp3|wav|m4a|aac|ogg|flac)$/.test(n) ? 'audio' : null; }
      if (!type) return res(null);
      var u = URL.createObjectURL(file), out = { type: type, dur: 5, w: 0, h: 0, thumb: '' };
      function done() { URL.revokeObjectURL(u); res(out); }
      if (type === 'image') {
        var i = new Image(); i.onload = function () { out.w = i.naturalWidth; out.h = i.naturalHeight; out.thumb = shot(i, i.naturalWidth, i.naturalHeight); done(); }; i.onerror = function () { res(null); URL.revokeObjectURL(u); }; i.src = u;
      } else if (type === 'video') {
        var v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = u;
        v.onloadedmetadata = function () { out.dur = v.duration || 5; out.w = v.videoWidth; out.h = v.videoHeight; try { v.currentTime = Math.min(1, out.dur / 3); } catch (e) { done(); } };
        v.onseeked = function () { out.thumb = shot(v, v.videoWidth, v.videoHeight); done(); };
        v.onerror = function () { res(null); URL.revokeObjectURL(u); };
        setTimeout(function () { if (!out.thumb) done(); }, 6000);
      } else {
        var a = document.createElement('audio'); a.preload = 'metadata'; a.src = u; a.onloadedmetadata = function () { out.dur = isFinite(a.duration) ? a.duration : 5; done(); }; a.onerror = function () { done(); };
        setTimeout(function () { if (out.dur === 5) done(); }, 4000);
      }
    });
  }
  function shot(src, w, h) {
    var c = document.createElement('canvas'); c.width = 320; c.height = 180; var x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, 320, 180);
    if (w && h) { var s = Math.max(320 / w, 180 / h); x.drawImage(src, (320 - w * s) / 2, (180 - h * s) / 2, w * s, h * s); }
    try { return c.toDataURL('image/jpeg', .7); } catch (e) { return ''; }
  }

  function importFiles(files) {
    var list = Array.prototype.slice.call(files || []); if (!list.length) return Promise.resolve();
    ST.toast('Importing ' + list.length + (list.length > 1 ? ' files' : ' file') + '...');
    return list.reduce(function (p, f) {
      return p.then(function () {
        return meta(f).then(function (m) {
          if (!m) { ST.toast('Skipped ' + f.name + ': not a video, photo or audio file'); return; }
          var r = { id: 'm' + U.uid(), name: f.name.replace(/\.[^.]+$/, ''), type: m.type, blob: f, size: f.size, dur: m.dur, w: m.w, h: m.h, thumb: m.thumb, added: Date.now() };
          return dbPut(r).then(function () { LIB.unshift(r); BY[r.id] = r; if (m.type !== 'image') buffer(r.id); });
        });
      });
    }, Promise.resolve()).then(function () { if (S.tab === 'media') ST.lib(); ST.toast('Imported'); }).catch(function () { ST.toast('Could not save that file on this device'); });
  }
  EXT.importFiles = importFiles;

  /* ---------- the layer types ---------- */
  var FIT = [['fit', 'Fit inside'], ['fill', 'Fill the screen'], ['stretch', 'Stretch']];

  function place(c, w, h, it) {
    var fit = it.fit || 'fit', s, dw = it._dw || W, dh = it._dh || H;
    if (fit === 'stretch') return { x: 0, y: 0, w: dw, h: dh };
    s = fit === 'fill' ? Math.max(dw / w, dh / h) : Math.min(dw / w, dh / h);
    return { x: (dw - w * s) / 2, y: (dh - h * s) / 2, w: w * s, h: h * s };
  }
  function frame(c, p, it) {
    var r = it.rad || 0, bw = it.bw || 0;
    if (r > 0) { c.beginPath(); c.moveTo(p.x + r, p.y); c.arcTo(p.x + p.w, p.y, p.x + p.w, p.y + p.h, r); c.arcTo(p.x + p.w, p.y + p.h, p.x, p.y + p.h, r); c.arcTo(p.x, p.y + p.h, p.x, p.y, r); c.arcTo(p.x, p.y, p.x + p.w, p.y, r); c.closePath(); c.clip(); }
    else { c.beginPath(); c.rect(p.x, p.y, p.w, p.h); c.clip(); }
  }
  function border(c, p, it) {
    if (!it.bw) return; var r = it.rad || 0; c.save(); c.lineWidth = it.bw * 2; c.strokeStyle = it.bcol || '#fff';
    c.beginPath(); if (r > 0) { c.moveTo(p.x + r, p.y); c.arcTo(p.x + p.w, p.y, p.x + p.w, p.y + p.h, r); c.arcTo(p.x + p.w, p.y + p.h, p.x, p.y + p.h, r); c.arcTo(p.x, p.y + p.h, p.x, p.y, r); c.arcTo(p.x, p.y, p.x + p.w, p.y, r); c.closePath(); } else c.rect(p.x, p.y, p.w, p.h);
    c.clip(); c.stroke(); c.restore();
  }
  function missing(c, it, label) {
    c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, W, H); c.fillStyle = '#8d8d8d'; c.font = '700 34px Inter,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label || 'Media not on this device', W / 2, H / 2 - 20); c.font = '600 22px Inter,sans-serif'; c.fillText('Import the file again in the MEDIA tab', W / 2, H / 2 + 24);
  }
  function kenburns(c, it, lt) {
    var k = it.kb || 'none'; if (k === 'none') return;
    var p = cl(lt / Math.max(.5, it.dur)), z = k === 'in' ? 1 + .18 * p : k === 'out' ? 1.18 - .18 * p : 1.12, px = k === 'left' ? (.5 - p) * 120 : k === 'right' ? (p - .5) * 120 : 0, py = k === 'up' ? (.5 - p) * 70 : k === 'down' ? (p - .5) * 70 : 0;
    c.translate(W / 2 + px, H / 2 + py); c.scale(z, z); c.translate(-W / 2, -H / 2);
  }
  var KB = [['none', 'No movement'], ['in', 'Slow zoom in'], ['out', 'Slow zoom out'], ['left', 'Pan left'], ['right', 'Pan right'], ['up', 'Pan up'], ['down', 'Pan down']];

  function visForm(it, isVid) {
    var h = U.sec('PICTURE', U.select(it, 'fit', 'How it fits', FIT, 'fit') + (isVid ? '' : U.select(it, 'kb', 'Camera movement', KB, 'none')) + U.range(it, 'rad', 'Round the corners', 0, 200, 2, 0, 'px') + U.range(it, 'bw', 'Border', 0, 30, 1, 0, 'px') + (it.bw ? U.color(it, 'bcol', 'Border color', '#ffffff') : '') +
      '<div class="g2">' + U.range(it, 'cl', 'Crop left', 0, 45, 1, 0, '%') + U.range(it, 'cr', 'Crop right', 0, 45, 1, 0, '%') + U.range(it, 'ct', 'Crop top', 0, 45, 1, 0, '%') + U.range(it, 'cb', 'Crop bottom', 0, 45, 1, 0, '%') + '</div>');
    return h;
  }
  function srcRect(it, w, h) {
    var l = (it.cl || 0) / 100, r = (it.cr || 0) / 100, t = (it.ct || 0) / 100, b = (it.cb || 0) / 100;
    return { x: w * l, y: h * t, w: Math.max(2, w * (1 - l - r)), h: Math.max(2, h * (1 - t - b)) };
  }

  EXT.register('img', {
    label: 'Photo', cls: 'm', valid: function () { return true; },
    name: function (it) { var r = rec(it.media); return 'PHOTO  ' + (r ? r.name.slice(0, 16) : 'missing'); },
    draw: function (c, it, t, lt) {
      var i = rec(it.media) && img(it.media); if (!i || !i.complete || !i.naturalWidth) { missing(c, it, rec(it.media) ? 'Loading photo' : null); return; }
      var s = srcRect(it, i.naturalWidth, i.naturalHeight), p = place(c, s.w, s.h, it);
      c.save(); kenburns(c, it, lt); c.save(); frame(c, p, it); c.drawImage(i, s.x, s.y, s.w, s.h, p.x, p.y, p.w, p.h); c.restore(); border(c, p, it); c.restore();
    },
    inspector: function (it) { return visForm(it, false); }
  });

  /* video elements: one per layer so the same file can be used twice */
  var VE = {};
  function vel(it) {
    var e = VE[it.id]; if (e && e.__m === it.media) return e;
    var u = url(it.media); if (!u) return null;
    e = document.createElement('video'); e.muted = true; e.playsInline = true; e.setAttribute('playsinline', ''); e.preload = 'auto'; e.src = u; e.__m = it.media;
    e.addEventListener('seeked', function () { if (!S.playing) ST.render(); }); e.addEventListener('loadeddata', function () { if (!S.playing) ST.render(); });
    VE[it.id] = e; return e;
  }
  EXT.on('pause', function () { Object.keys(VE).forEach(function (k) { try { VE[k].pause(); } catch (e) {} }); });
  EXT.register('vid', {
    label: 'Video', cls: 'm', speed: true, trim: true, valid: function () { return true; },
    name: function (it) { var r = rec(it.media); return 'VIDEO  ' + (r ? r.name.slice(0, 16) : 'missing'); },
    decorate: function (it, d) { if (it.vol !== 0 && !it.mute) decorate(it, d); },
    draw: function (c, it, t, lt) {
      var e = rec(it.media) && vel(it); if (!e) { missing(c, it); return; }
      var playing = S.playing || S.exporting, want = Math.max(0, lt);
      if (playing) {
        if (e.paused || Math.abs(e.currentTime - want) > .35) { try { e.currentTime = want; } catch (x) {} }
        e.playbackRate = it.spd || 1; if (e.paused) { var pr = e.play(); if (pr && pr.catch) pr.catch(function () {}); }
      } else {
        if (!e.paused) e.pause();
        if (Math.abs(e.currentTime - want) > .03) { try { e.currentTime = want; } catch (x) {} }
      }
      if (e.readyState < 2) { missing(c, it, 'Loading video'); return; }
      var s = srcRect(it, e.videoWidth, e.videoHeight), p = place(c, s.w, s.h, it);
      c.save(); frame(c, p, it); c.drawImage(e, s.x, s.y, s.w, s.h, p.x, p.y, p.w, p.h); c.restore(); border(c, p, it);
    },
    play: function (it, x, dest, base, now) { playBuf(it, x, dest, base, now); },
    inspector: function (it) {
      return visForm(it, true) + U.sec('ITS SOUND', U.range(it, 'vol', 'Volume', 0, 2, .05, 1, '') + U.range(it, 'fin', 'Fade in', 0, 5, .1, 0, 's') + U.range(it, 'fout', 'Fade out', 0, 5, .1, 0, 's') +
        '<div class="acts">' + U.btn('detach', 'Split sound onto its own row') + '</div>');
    },
    click: function (it, a) {
      if (a !== 'detach') return false;
      var d = { id: S.next++, kind: 'aud', media: it.media, track: 2, start: it.start, dur: it.dur, off: it.off || 0, spd: it.spd || 1, vol: it.vol == null ? 1 : it.vol, fin: it.fin || 0, fout: it.fout || 0 };
      S.items.push(d); it.vol = 0; ST.toast('Sound is now on its own row'); return true;
    }
  });

  function playBuf(it, x, dest, base, now) {
    var m = M[it.media]; if (!m || !m.buf) { if (rec(it.media)) buffer(it.media); return; }
    var spd = it.spd || 1, vol = it.vol == null ? 1 : it.vol; if (vol <= 0) return;
    var startAt = base + Math.max(0, it.start - now), skip = (it.off || 0) + Math.max(0, now - it.start) * spd, len = (it.start + it.dur - Math.max(it.start, now));
    if (skip >= m.buf.duration) return;
    var src = x.createBufferSource(), g = x.createGain(); src.buffer = m.buf; src.playbackRate.value = spd; src.connect(g); g.connect(dest);
    var fin = it.fin || 0, fout = it.fout || 0, tEnd = startAt + len;
    g.gain.setValueAtTime(fin > 0 && now <= it.start ? 0 : vol, startAt);
    if (fin > 0 && now <= it.start) g.gain.linearRampToValueAtTime(vol, startAt + fin);
    if (fout > 0) { g.gain.setValueAtTime(vol, Math.max(startAt, tEnd - fout)); g.gain.linearRampToValueAtTime(0, tEnd); }
    src.start(startAt, skip, Math.min(len * spd, m.buf.duration - skip)); src.stop(tEnd + .05);
  }
  EXT.register('aud', {
    label: 'Audio', cls: 'a', audio: true, speed: true, trim: true, valid: function () { return true; },
    name: function (it) { var r = rec(it.media); return (it.vo ? 'VOICE  ' : 'AUDIO  ') + (r ? r.name.slice(0, 16) : 'missing'); },
    decorate: decorate, play: function (it, x, dest, base, now) { playBuf(it, x, dest, base, now); },
    draw: function () {},
    inspector: function () { return ''; }
  });

  /* ---------- adding media to the timeline ---------- */
  function addMedia(id, at) {
    var r = rec(id); if (!r) return;
    var it = { id: S.next++, media: id, start: 0, dur: r.dur || 5, op: 1, sc: 1, dx: 0, dy: 0, rot: 0, fade: 0 };
    if (r.type === 'audio') {
      it.kind = 'aud'; it.start = at == null ? U.round(S.t) : at; it.track = S.items.some(function (i) { return i.track === 2 && it.start < i.start + i.dur && it.start + it.dur > i.start; }) ? 3 : 2; it.vol = 1; it.off = 0;
    } else {
      var e = 0; S.items.forEach(function (i) { if (i.track === 0) e = Math.max(e, i.start + i.dur); });
      it.track = 0; it.start = at == null ? U.round(e) : at; it.fit = 'fit';
      if (r.type === 'image') { it.kind = 'img'; it.dur = 5; it.kb = 'in'; } else { it.kind = 'vid'; it.off = 0; it.vol = 1; it.spd = 1; buffer(id); }
    }
    S.items.push(it); S.sel = it.id; S.t = it.start; ST.refresh(); ST.toast('Added to the timeline');
    var sc = document.querySelector('#tls'); if (sc) sc.scrollLeft = Math.max(0, ST.pxs(it.start) - 40);
  }
  EXT.addMedia = addMedia;

  /* ---------- the MEDIA tab ---------- */
  var recState = null;
  EXT.tab('media', 'MEDIA', {
    render: function (lib) {
      lib.innerHTML = '<input type="file" id="xFile" accept="video/*,image/*,audio/*,.mov,.mp4,.m4a,.heic" multiple hidden>' +
        '<button class="b f" id="xImp" style="width:100%;margin-bottom:8px">+ Import videos, photos or audio</button>' +
        '<div class="xdrop" id="xDrop">or drop files here</div>' +
        '<div class="xrow"><button class="b s' + (recState ? ' d' : '') + '" id="xRec">' + (recState ? 'Stop recording' : 'Record voiceover') + '</button><label style="font-size:.62rem;display:flex;gap:6px;align-items:center;letter-spacing:.06em"><input type="checkbox" id="xRecPlay" checked> PLAY VIDEO WHILE RECORDING</label></div>' +
        '<div class="chips" id="xChips">' + [['all', 'ALL'], ['video', 'VIDEOS'], ['image', 'PHOTOS'], ['audio', 'AUDIO']].map(function (c) { return '<button data-mf="' + c[0] + '" class="' + (filter === c[0] ? 'on' : '') + '">' + c[1] + '</button>'; }).join('') + '</div>' +
        '<div class="cnt"><span id="xCnt"></span><span id="xStore"></span></div><div class="xgrid" id="xGrid"></div>' +
        '<p class="xnote">Everything you import stays on this device only. It is never uploaded. Videos and photos play in the preview and are included when you export.</p>';
      paint();
      var f = lib.querySelector('#xFile'), dz = lib.querySelector('#xDrop');
      lib.onclick = function (e) {
        var t = e.target;
        if (t.id === 'xImp') { f.click(); return; }
        if (t.id === 'xRec') { toggleRec(); return; }
        var mf = t.closest('[data-mf]'); if (mf) { filter = mf.dataset.mf; ST.lib(); return; }
        var del = t.closest('[data-mdel]'); if (del) { removeMedia(del.dataset.mdel); return; }
        var ad = t.closest('[data-madd]'); if (ad) addMedia(ad.dataset.madd);
      };
      f.onchange = function () { importFiles(f.files).then(function () { f.value = ''; }); };
      ['dragenter', 'dragover'].forEach(function (n) { dz.addEventListener(n, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
      ['dragleave', 'drop'].forEach(function (n) { dz.addEventListener(n, function (e) { e.preventDefault(); dz.classList.remove('over'); }); });
      dz.addEventListener('drop', function (e) { importFiles(e.dataTransfer.files); });
      storageInfo();
    }
  });
  function paint() {
    var g = document.getElementById('xGrid'); if (!g) return;
    var list = LIB.filter(function (r) { return filter === 'all' || r.type === filter; });
    var c = document.getElementById('xCnt'); if (c) c.textContent = list.length + ' FILE' + (list.length === 1 ? '' : 'S');
    g.innerHTML = list.map(function (r) {
      var th = r.type === 'audio' ? '<div style="aspect-ratio:16/9;background:#1a1a1a;display:grid;place-items:center;font-weight:800;letter-spacing:.2em;font-size:.7rem;color:#8d8d8d">AUDIO</div>' : '<img src="' + (r.thumb || '') + '" alt="">';
      return '<div class="xcard" style="cursor:pointer" data-madd="' + r.id + '">' + th + '<span class="plus">+</span><div class="n">' + esc(r.name.slice(0, 40)) + '</div><div class="m">' + r.type.toUpperCase() + (r.type === 'image' ? '' : ' - ' + fmtDur(r.dur)) + ' - ' + (r.size / 1048576).toFixed(1) + ' MB <button data-mdel="' + r.id + '" style="float:right;color:#ff4d4d;font-weight:800">DELETE</button></div></div>';
    }).join('') || '<p class="hint" style="grid-column:1/3">Nothing here yet. Import a screen recording or photos to start.</p>';
  }
  function storageInfo() {
    var el = document.getElementById('xStore'); if (!el || !navigator.storage || !navigator.storage.estimate) return;
    navigator.storage.estimate().then(function (e) { el.textContent = (e.usage / 1048576).toFixed(0) + ' MB USED'; }).catch(function () {});
  }
  function removeMedia(id) {
    var used = S.items.some(function (i) { return i.media === id; });
    if (used && !confirm('This file is used in your video. Delete it anyway?')) return;
    dbDel(id).then(function () { LIB = LIB.filter(function (r) { return r.id !== id; }); delete BY[id]; if (M[id] && M[id].url) URL.revokeObjectURL(M[id].url); delete M[id]; paint(); ST.render(); storageInfo(); });
  }

  /* ---------- voiceover ---------- */
  function toggleRec() {
    if (recState) { recState.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { ST.toast('This browser cannot record audio'); return; }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (stream) {
      var chunks = [], start = U.round(S.t), mr = new MediaRecorder(stream), tStart = performance.now();
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); }); ST.pause(); recState = null;
        var blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }), dur = (performance.now() - tStart) / 1000;
        var r = { id: 'm' + U.uid(), name: 'Voiceover ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), type: 'audio', blob: blob, size: blob.size, dur: dur, w: 0, h: 0, thumb: '', added: Date.now() };
        dbPut(r).then(function () {
          LIB.unshift(r); BY[r.id] = r; buffer(r.id).then(function () {
            var it = { id: S.next++, kind: 'aud', media: r.id, track: 3, start: start, dur: dur, off: 0, vol: 1, vo: true }; S.items.push(it); S.sel = it.id; ST.refresh(); ST.toast('Voiceover added');
          });
          if (S.tab === 'media') ST.lib();
        });
      };
      recState = mr; mr.start(); ST.toast('Recording. Tap Stop recording when done.');
      var cb = document.getElementById('xRecPlay'); if (!cb || cb.checked) ST.play();
      if (S.tab === 'media') ST.lib();
    }).catch(function () { ST.toast('Allow the microphone to record'); });
  }

  /* ---------- drop files anywhere ---------- */
  window.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) e.preventDefault(); });
  window.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length && !e.defaultPrevented) { e.preventDefault(); importFiles(e.dataTransfer.files).then(function () { ST.setTab('media'); }); } });

  /* ---------- load the library when the page starts ---------- */
  dbAll().then(function (all) {
    LIB = (all || []).sort(function (a, b) { return b.added - a.added; }); LIB.forEach(function (r) { BY[r.id] = r; });
    S.items.forEach(function (i) { if (i.media && (i.kind === 'vid' || i.kind === 'aud')) buffer(i.media); });
    ST.drawTL(); ST.render(); if (S.tab === 'media') ST.lib();
  }).catch(function () {});
  function preloadAll() { S.items.forEach(function (i) { if (i.media && (i.kind === 'vid' || i.kind === 'aud')) buffer(i.media); }); }
  EXT.on('started', preloadAll); EXT.on('restored', preloadAll);
  EXT.mediaReady = function () { return LIB.length; };
  EXT.mediaList = function () { return LIB; };
  EXT.mediaRec = rec;
})();
