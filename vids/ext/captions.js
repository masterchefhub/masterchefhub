/* Captions: paste lines or a subtitle (.srt) file and get a text layer for each line */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S, U = window.__U;
  var $ = function (s) { return document.querySelector(s); };
  var STYLES = {
    bar: { size: 46, pos: 7, box: true, boxop: .75, pad: 16, bold: false, tin: 'fade', tout: 'fade' },
    bold: { font: 'impact', size: 90, pos: 7, outline: 6, shadow: 6, tin: 'pop', upper: true },
    clean: { size: 52, pos: 7, shadow: 14, bold: true, tin: 'fade', tout: 'fade' },
    center: { size: 100, pos: 4, reveal: 'words', rev: .8, tin: 'fade', tout: 'fade' }
  };
  var draft = { text: '', per: 2.5, style: 'bar' };

  function ts(s) { var m = /(\d+):(\d+):(\d+)[,.](\d+)/.exec(s); return m ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000 : 0; }
  function parseSrt(txt) {
    var out = [];
    txt.replace(/\r/g, '').split(/\n\s*\n/).forEach(function (b) {
      var l = b.split('\n').filter(Boolean), i = l.findIndex(function (x) { return x.indexOf('-->') >= 0; }); if (i < 0) return;
      var p = l[i].split('-->'); out.push({ a: ts(p[0]), b: ts(p[1]), t: l.slice(i + 1).join('\n') });
    });
    return out;
  }
  function make(list) {
    var base = U.round(S.t), st = STYLES[draft.style] || STYLES.bar;
    list.forEach(function (x) {
      var it = { id: S.next++, kind: 'text', track: 4, start: U.round(base + x.a), dur: Math.max(.5, U.round(x.b - x.a)), op: 1, sc: 1, dx: 0, dy: 0, rot: 0, text: x.t };
      Object.keys(st).forEach(function (k) { it[k] = st[k]; }); S.items.push(it);
    });
    ST.refresh(); ST.toast(list.length + ' caption' + (list.length === 1 ? '' : 's') + ' added');
  }
  function fromText() {
    var txt = draft.text.trim(); if (!txt) { ST.toast('Type or paste some words first'); return; }
    if (txt.indexOf('-->') >= 0) { make(parseSrt(txt)); return; }
    var lines = txt.split('\n').map(function (s) { return s.trim(); }).filter(Boolean), t = 0, out = [];
    lines.forEach(function (l) { var d = Math.max(1.2, Math.min(6, draft.per || l.split(' ').length * .38)); out.push({ a: t, b: t + d, t: l }); t += d; });
    make(out);
  }
  EXT.tab('caps', 'CAPS', {
    render: function (lib) {
      lib.innerHTML = '<p class="xnote">Type one caption per line. Each line becomes a text layer, one after the other, starting at the red line. Or paste a subtitle (.srt) text.</p>' +
        '<div class="fl"><textarea id="xCapT" rows="7" placeholder="Fresh food, chef made&#10;Delivered around Long Island&#10;Order at masterchefhub.com">' + U.round(0) + '</textarea></div>' +
        '<div class="g2"><div class="fl"><label>Seconds per line</label><input type="number" id="xCapP" min="1" max="8" step="0.1" value="' + draft.per + '"></div>' +
        '<div class="fl"><label>Style</label><select id="xCapS"><option value="bar">Bar</option><option value="bold">Bold outline</option><option value="clean">Clean shadow</option><option value="center">Center words</option></select></div></div>' +
        '<button class="b f" style="width:100%;margin-bottom:8px" id="xCapGo">Make captions</button>' +
        '<input type="file" id="xCapF" accept=".srt,.txt,text/plain" hidden><button class="b" style="width:100%" id="xCapFile">Open an .srt file</button>';
      var ta = $('#xCapT'); ta.value = draft.text; $('#xCapS').value = draft.style;
      ta.oninput = function () { draft.text = ta.value; }; $('#xCapP').oninput = function (e) { draft.per = +e.target.value; }; $('#xCapS').onchange = function (e) { draft.style = e.target.value; };
      $('#xCapGo').onclick = fromText; $('#xCapFile').onclick = function () { $('#xCapF').click(); };
      $('#xCapF').onchange = function (e) { var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { draft.text = r.result; ta.value = r.result; }; r.readAsText(f); e.target.value = ''; };
    }
  });
})();
