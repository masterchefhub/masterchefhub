/* Timeline row controls: tap a row name to hide or mute everything on it. Also a quick start guide. */
(function () {
  'use strict';
  var ST = window.__ST, EXT = window.__EXT, S = ST.S, U = window.__U;
  var ORDER = [4, 1, 0, 2, 3, 5];
  function off() { S.meta = S.meta || {}; S.meta.off = S.meta.off || {}; return S.meta.off; }
  function paint() {
    var labels = document.querySelectorAll('.tll div'); var o = (S.meta && S.meta.off) || {};
    ORDER.forEach(function (tr, i) {
      var el = labels[i + 1]; if (!el) return; el.dataset.tr = tr; el.style.cursor = 'pointer'; el.title = 'Tap to ' + (o[tr] ? 'turn on' : EXT.isAudTrack(tr) ? 'mute' : 'hide') + ' this row';
      el.style.opacity = o[tr] ? .35 : 1; el.style.textDecoration = o[tr] ? 'line-through' : 'none';
    });
  }
  document.querySelector('.tll').addEventListener('click', function (e) {
    var d = e.target.closest('[data-tr]'); if (!d) return; var tr = +d.dataset.tr; off()[tr] = !off()[tr]; paint(); ST.render(); ST.save();
    ST.toast((EXT.isAudTrack(tr) ? 'Row muted' : 'Row hidden') + (off()[tr] ? '' : ' off'));
  });
  EXT.on('timeline', paint); EXT.on('restored', paint);
  EXT.homeParts.unshift(function () {
    if (S.items.length > 2) return '';
    return U.sec('QUICK START',
      '<ol class="hint" style="padding-left:18px;display:grid;gap:6px"><li>Open the <b>MEDIA</b> tab and import your screen recordings, photos or music.</li><li>Tap a file to put it on the timeline.</li>' +
      '<li>Add a <b>FRAME</b> for a Mac window or phone, and the animated pointer.</li><li>Add <b>TEXT</b>, <b>SHAPES</b> and <b>FX</b>. Tap any layer to change it.</li><li>Pick sounds in <b>SOUNDS</b>. Set the beat in the panel here.</li><li>Press <b>Export video</b>.</li></ol>');
  });
})();
