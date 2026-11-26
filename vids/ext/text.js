/* Text layers: titles, subtitles, lower thirds, quotes and counters */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S, U = window.__U, W = ST.W, H = ST.H;
  var esc = ST.esc, cl = ST.cl;

  var FONTS = {
    sans: { n: 'Clean sans', f: 'Inter,Helvetica,Arial,sans-serif' },
    serif: { n: 'Elegant serif', f: '"Instrument Serif",Georgia,serif' },
    mono: { n: 'Typewriter', f: '"Courier New",monospace' },
    round: { n: 'Soft round', f: '"Trebuchet MS","Arial Rounded MT Bold",sans-serif' },
    impact: { n: 'Heavy poster', f: 'Impact,"Arial Black",sans-serif' },
    script: { n: 'Script', f: '"Brush Script MT","Snell Roundhand",cursive' }
  };
  var REVEAL = [['none', 'All at once'], ['letters', 'Typewriter'], ['words', 'Word by word'], ['lines', 'Line by line'], ['rise', 'Letters rise']];

  var DEF = { text: 'Your text', font: 'sans', size: 90, bold: true, italic: false, col: '#ffffff', align: 1, pos: 4, maxw: 1000, lh: 1.15, ls: 0, upper: false,
    box: false, boxcol: '#000000', boxop: .85, pad: 24, outline: 0, outcol: '#000000', shadow: 0, accent: false, acccol: '#ffffff', reveal: 'none', rev: 1, cnt0: 0, cnt1: 0, cntp: '', cnts: '' };

  function val(it, k) { return it[k] == null ? DEF[k] : it[k]; }

  function wrap(c, txt, maxw) {
    var out = [];
    String(txt).split('\n').forEach(function (para) {
      var words = para.split(' '), line = '';
      words.forEach(function (w) {
        var test = line ? line + ' ' + w : w;
        if (c.measureText(test).width > maxw && line) { out.push(line); line = w; } else line = test;
      });
      out.push(line);
    });
    return out;
  }

  function shown(it, lt) {
    var txt = String(val(it, 'text'));
    if (val(it, 'cnt1') !== val(it, 'cnt0') || txt.indexOf('{n}') >= 0) {
      var p = ST.cl(lt / Math.max(.2, val(it, 'rev') + .4)), e = 1 - Math.pow(1 - p, 3), n = Math.round(val(it, 'cnt0') + (val(it, 'cnt1') - val(it, 'cnt0')) * e);
      txt = txt.replace(/\{n\}/g, String(n));
    }
    return (val(it, 'cntp') || '') + txt + (val(it, 'cnts') || '');
  }

  function drawText(c, it, t, lt) {
    var size = val(it, 'size'), fam = FONTS[val(it, 'font')] || FONTS.sans, wgt = val(it, 'bold') ? '800' : '500';
    var txt = shown(it, lt); if (val(it, 'upper')) txt = txt.toUpperCase();
    c.font = (val(it, 'italic') ? 'italic ' : '') + wgt + ' ' + size + 'px ' + fam.f;
    if ('letterSpacing' in c) c.letterSpacing = val(it, 'ls') + 'px';
    var lines = wrap(c, txt, val(it, 'maxw')), lh = size * val(it, 'lh'), bw = 0;
    lines.forEach(function (l) { bw = Math.max(bw, c.measureText(l).width); });
    var th = lines.length * lh, pad = val(it, 'box') ? val(it, 'pad') : 0, aw = bw + pad * 2, ah = th + pad * 2;
    var pos = val(it, 'pos'), mx = 60, col = pos % 3, row = Math.floor(pos / 3);
    var x = col === 0 ? mx : col === 1 ? (W - aw) / 2 : W - mx - aw, y = row === 0 ? mx : row === 1 ? (H - ah) / 2 : H - mx - ah;
    if (val(it, 'box')) { c.save(); c.globalAlpha *= val(it, 'boxop'); c.fillStyle = val(it, 'boxcol'); c.fillRect(x, y, aw, ah); c.restore(); }
    if (val(it, 'accent')) { c.fillStyle = val(it, 'acccol'); c.fillRect(x - 18, y + pad * .4, 8, ah - pad * .8); }
    c.textBaseline = 'middle';
    var al = val(it, 'align'), rv = val(it, 'reveal'), total = txt.replace(/\s/g, '').length, seen = 0, rt = Math.max(.1, val(it, 'rev'));
    var wordsAll = txt.split(/\s+/).length, wcount = 0;
    lines.forEach(function (l, li) {
      var lw = c.measureText(l).width, lx = al === 0 ? x + pad : al === 1 ? x + pad + (bw - lw) / 2 : x + pad + bw - lw, ly = y + pad + li * lh + lh / 2;
      var prog = cl(lt / rt);
      if (rv === 'none') { paint(c, it, l, lx, ly, 1, 0); return; }
      if (rv === 'lines') { var lp = cl(prog * lines.length - li); paint(c, it, l, lx, ly + (1 - lp) * 30, lp, 0); return; }
      if (rv === 'words') {
        var ws = l.split(' '), cx = lx;
        ws.forEach(function (w) { var wp = cl(prog * wordsAll - wcount); wcount++; paint(c, it, w, cx, ly + (1 - wp) * 24, wp, 0); cx += c.measureText(w + ' ').width; });
        return;
      }
      var cx2 = lx;
      for (var i = 0; i < l.length; i++) {
        var ch = l[i], cw = c.measureText(ch).width;
        if (ch !== ' ') { var idx = seen++, cp = cl(prog * total - idx * (rv === 'rise' ? .6 : 1)); if (rv === 'letters') { if (cp > 0) paint(c, it, ch, cx2, ly, 1, 0); } else paint(c, it, ch, cx2, ly + (1 - cp) * 40, cp, 0); }
        cx2 += cw;
      }
    });
    if ('letterSpacing' in c) c.letterSpacing = '0px';
  }
  function paint(c, it, s, x, y, a, extra) {
    if (a <= 0) return;
    c.save(); c.globalAlpha *= a; c.textAlign = 'left';
    var sh = val(it, 'shadow'); if (sh) { c.shadowColor = 'rgba(0,0,0,.65)'; c.shadowBlur = sh * 2; c.shadowOffsetY = sh * .6; }
    var ow = val(it, 'outline'); if (ow) { c.lineJoin = 'round'; c.lineWidth = ow * 2; c.strokeStyle = val(it, 'outcol'); c.strokeText(s, x, y); }
    c.fillStyle = val(it, 'col'); c.fillText(s, x, y); c.restore();
  }

  EXT.register('text', {
    label: 'Text', cls: 't', nolook: false,
    name: function (it) { var t = String(it.text || 'Text').replace(/\n/g, ' '); return 'T  ' + t.slice(0, 18); },
    draw: drawText,
    inspector: function (it) {
      var h = U.sec('TEXT', U.text(it, 'text', 'What it says (new lines allowed)', DEF.text, true) + U.select(it, 'font', 'Font', Object.keys(FONTS).map(function (k) { return [k, FONTS[k].n]; }), 'sans') +
        U.range(it, 'size', 'Size', 16, 260, 2, 90, 'px') + '<div class="g2">' + U.check(it, 'bold', 'Bold', true) + U.check(it, 'italic', 'Italic', false) + '</div>' + U.check(it, 'upper', 'ALL CAPITAL LETTERS', false) +
        U.color(it, 'col', 'Text color', '#ffffff') + U.select(it, 'align', 'Align', [[0, 'Left'], [1, 'Center'], [2, 'Right']], 1));
      h += U.sec('PLACE ON SCREEN', U.grid3(it, 'pos', 4) + U.range(it, 'maxw', 'Line width', 200, 1200, 20, 1000, 'px') + U.range(it, 'lh', 'Line spacing', .8, 2, .05, 1.15, '') + U.range(it, 'ls', 'Letter spacing', -4, 30, .5, 0, 'px'));
      h += U.sec('STYLE', U.check(it, 'box', 'Box behind the text', false) + (it.box ? U.color(it, 'boxcol', 'Box color', '#000000') + U.range(it, 'boxop', 'Box strength', .1, 1, .05, .85, '') + U.range(it, 'pad', 'Box space', 0, 80, 2, 24, 'px') : '') +
        U.check(it, 'accent', 'Accent bar on the left', false) + (it.accent ? U.color(it, 'acccol', 'Bar color', '#ffffff') : '') + U.range(it, 'outline', 'Outline', 0, 12, .5, 0, 'px') + (it.outline ? U.color(it, 'outcol', 'Outline color', '#000000') : '') + U.range(it, 'shadow', 'Shadow', 0, 30, 1, 0, ''));
      h += U.sec('ANIMATION', U.select(it, 'reveal', 'Show the text', REVEAL, 'none') + (it.reveal && it.reveal !== 'none' ? U.range(it, 'rev', 'Takes', .2, 4, .1, 1, 's') : ''));
      h += U.sec('COUNTER', '<p class="xnote">Type {n} in the text to count up, for example {n}+ dishes.</p><div class="g2">' + U.num(it, 'cnt0', 'Count from', -9999, 99999, 1, 0) + U.num(it, 'cnt1', 'Count to', -9999, 99999, 1, 0) + '</div>' + U.range(it, 'rev', 'Count time', .2, 4, .1, 1, 's'));
      return h;
    }
  });

  /* ---------- presets ---------- */
  var PRE = [
    { n: 'Big title', d: 'Large centered title', o: { text: 'MASTERCHEFHUB', size: 130, pos: 4, reveal: 'rise', rev: 1.2, tin: 'fade' } },
    { n: 'Serif title', d: 'Elegant and calm', o: { text: 'Fresh food, chef made', font: 'serif', bold: false, size: 110, pos: 4, tin: 'fade', tout: 'fade' } },
    { n: 'Subtitle', d: 'White words on a dark bar', o: { text: 'Say something here', size: 46, pos: 7, box: true, boxop: .75, pad: 16, bold: false, tin: 'fade', tout: 'fade' } },
    { n: 'Lower third', d: 'Name and role, bottom left', o: { text: 'CHRIS W.\nHead chef', size: 52, pos: 6, align: 0, accent: true, maxw: 700, tin: 'slideL', tout: 'slideL' } },
    { n: 'Section label', d: 'Small caps label at the top', o: { text: 'STEP ONE', size: 40, pos: 0, align: 0, box: true, boxcol: '#ffffff', col: '#000000', pad: 14, ls: 4, tin: 'slideD' } },
    { n: 'Stat counter', d: 'Number counts up', o: { text: '{n}+ dishes', size: 150, pos: 4, cnt0: 0, cnt1: 74, rev: 1.5, tin: 'zoomIn' } },
    { n: 'Quote', d: 'Serif quote with bar', o: { text: 'Good food should be simple.', font: 'serif', size: 84, pos: 4, align: 0, accent: true, maxw: 900, tin: 'fade', tout: 'fade', bold: false } },
    { n: 'Caption', d: 'Bold caption with outline', o: { text: 'ORDER ONLINE', font: 'impact', size: 120, pos: 7, outline: 6, shadow: 8, tin: 'pop' } },
    { n: 'Call to action', d: 'White button style text', o: { text: 'Order at masterchefhub.com', size: 54, pos: 7, box: true, boxcol: '#ffffff', col: '#000000', pad: 22, bold: true, tin: 'slideU', tout: 'fade' } },
    { n: 'Typewriter', d: 'Letters type out', o: { text: 'Cooked fresh. Delivered to you.', font: 'mono', size: 64, pos: 4, reveal: 'letters', rev: 2 } },
    { n: 'Script note', d: 'Handwritten feel', o: { text: 'with love from our kitchen', font: 'script', size: 100, bold: false, pos: 7, tin: 'fade' } },
    { n: 'Price tag', d: 'Dish and price', o: { text: 'Cheeseburger  $14.99', size: 64, pos: 8, align: 2, box: true, boxcol: '#ffffff', col: '#000000', pad: 18, tin: 'slideR', tout: 'slideR' } }
  ];
  function addText(o) {
    var it = { id: S.next++, kind: 'text', track: 4, start: U.round(S.t), dur: 4, op: 1, sc: 1, dx: 0, dy: 0, rot: 0 };
    Object.keys(o).forEach(function (k) { it[k] = o[k]; }); S.items.push(it); S.sel = it.id; ST.refresh(); ST.toast('Text added at the red line');
  }
  EXT.addText = addText;
  function thumb(cvs, o) {
    var c = cvs.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, cvs.width, cvs.height); c.scale(cvs.width / W, cvs.height / H);
    var it = { text: o.text, kind: 'text' }; Object.keys(o).forEach(function (k) { it[k] = o[k]; }); it.reveal = 'none'; if (it.cnt1) it.cnt0 = it.cnt1;
    c.save(); try { drawText(c, it, 1, 9); } catch (e) {} c.restore();
  }
  EXT.tab('text', 'TEXT', {
    render: function (lib) {
      lib.innerHTML = '<button class="b f" style="width:100%;margin-bottom:10px" id="xTxtNew">+ Add plain text</button><div class="xgrid" id="xTxtG">' +
        PRE.map(function (p, i) { return '<button class="xcard" data-pre="' + i + '"><canvas width="320" height="180"></canvas><span class="plus">+</span><div class="n">' + esc(p.n) + '</div><div class="m">' + esc(p.d).toUpperCase() + '</div></button>'; }).join('') + '</div>';
      $$('#xTxtG canvas').forEach(function (cv, i) { thumb(cv, PRE[i].o); });
      lib.onclick = function (e) {
        if (e.target.id === 'xTxtNew') { addText({}); return; }
        var b = e.target.closest('[data-pre]'); if (b) addText(U.clone(PRE[+b.dataset.pre].o));
      };
    }
  });
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
})();
