/* MasterChefHub content engine: one controller for the Recipes, Food, Videos and Blog pages.
 * Everyone can read. Only the owner (see data.js) sees the Add / Delete buttons,
 * and the Firestore rules enforce that on the server too.
 */
import * as D from '/data.js';

const { esc, safeUrl, fmtDate } = D;
const $ = (s, r) => (r || document).querySelector(s);
const SV = (d, c) => '<svg class="ico ' + (c || 'sm') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
export const IC = {
  plus: SV('M12 5v14M5 12h14'),
  trash: SV('M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'),
  close: SV('M6 6l12 12M18 6 6 18', ''),
  play: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>',
  clock: SV('M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z'),
  hat: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 16a4 4 0 0 1-.6-7.95A5 5 0 0 1 16 7a4.5 4.5 0 0 1 1 8.9V20H7z"/><path d="M7 17h10"/></svg>',
  user: SV('M4 21a8 8 0 0 1 16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z')
};

export const h = {
  esc, img: safeUrl, date: fmtDate, catLabel: D.catLabel,
  lines: t => String(t || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean),
  bg: u => { u = safeUrl(u); return u ? ' style="background-image:url(\'' + u.replace(/'/g, '%27') + '\')"' : ''; }
};

/* ---------- modal ---------- */
let openCount = 0;
export function openModal(html, opts) {
  opts = opts || {};
  const wrap = document.createElement('div');
  wrap.className = 'cm' + (opts.wide ? ' wide' : '');
  wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
  wrap.innerHTML = '<div class="cm-bg"></div><div class="cm-box"><button type="button" class="cm-x" aria-label="Close">' + IC.close + '</button><div class="cm-in">' + html + '</div></div>';
  document.body.appendChild(wrap);
  document.documentElement.classList.add('cm-lock'); openCount++;
  let closed = false;
  function close() {
    if (closed) return; closed = true;
    document.removeEventListener('keydown', onKey);
    wrap.classList.add('out');
    setTimeout(() => { wrap.remove(); openCount--; if (!openCount) document.documentElement.classList.remove('cm-lock'); }, 200);
    if (opts.onClose) opts.onClose();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);
  wrap.querySelector('.cm-bg').addEventListener('click', close);
  wrap.querySelector('.cm-x').addEventListener('click', close);
  requestAnimationFrame(() => wrap.classList.add('in'));
  return { el: wrap, close };
}

/* ---------- form fields ---------- */
function fieldHTML(f) {
  const id = 'f_' + f.k, req = f.req ? ' <i class="rq">*</i>' : '';
  const hint = f.hint ? '<small class="hint">' + esc(f.hint) + '</small>' : '';
  const lab = '<label for="' + id + '">' + esc(f.label) + req + '</label>';
  let ctl = '';
  if (f.type === 'textarea') ctl = '<textarea id="' + id + '" rows="' + (f.rows || 4) + '" maxlength="' + (f.max || 4000) + '" placeholder="' + esc(f.ph || '') + '"></textarea>';
  else if (f.type === 'select') ctl = '<select id="' + id + '">' + (f.req ? '' : '<option value="">None</option>') + f.options.map(o => '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>').join('') + '</select>';
  else if (f.type === 'number') ctl = '<input id="' + id + '" type="number" inputmode="numeric" min="' + (f.min == null ? 0 : f.min) + '" max="' + (f.maxv || 100000) + '" placeholder="' + esc(f.ph || '') + '">';
  else if (f.type === 'media') {
    const accept = f.kind === 'video' ? 'video/*' : 'image/*';
    ctl = '<input id="' + id + '" type="url" inputmode="url" placeholder="' + esc(f.ph || 'Paste a link (https://...)') + '">' +
      '<div class="mor"><span>or</span><label class="filebtn"><input type="file" id="' + id + '_file" accept="' + accept + '"><b>Choose a file</b></label><em id="' + id + '_name"></em></div>' +
      '<div class="prog" id="' + id + '_prog" hidden><i></i></div>';
  } else ctl = '<input id="' + id + '" type="text" maxlength="' + (f.max || 160) + '" placeholder="' + esc(f.ph || '') + '" autocomplete="off">';
  return '<div class="fld" data-k="' + f.k + '">' + lab + ctl + hint + '<small class="ferr"></small></div>';
}

const VIDEO_OK = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
const STORAGE_OK = /firebasestorage|storage\.googleapis/i;

/* ---------- the page controller ---------- */
export async function mount(cfg) {
  const els = {
    list: $(cfg.list || '#list'), count: $('#count'), add: $('#add'),
    q: $('#q'), chips: $('#chips'), status: $('#status')
  };
  let items = [], owner = false, cat = 'all', term = '', loaded = false;
  const noun = cfg.noun, nouns = cfg.nouns || cfg.noun + 's';

  function status(type, html) {
    if (!els.status) return;
    els.status.className = 'cstat ' + (type || ''); els.status.innerHTML = html || ''; els.status.hidden = !html;
  }

  /* skeletons */
  els.list.innerHTML = Array(cfg.skeleton || 6).fill('<div class="ccard sk"><div class="cthumb"></div><div class="cbody"><i></i><i></i></div></div>').join('');

  /* who is here */
  try { const u = await D.whenUser(); owner = D.isOwner(u); if (u) D.cacheUser(u); } catch (e) { owner = false; }
  if (els.add) {
    els.add.hidden = !owner;
    els.add.addEventListener('click', openForm);
  }

  /* category chips */
  if (els.chips && cfg.cats) {
    els.chips.innerHTML = '<button type="button" class="opt act" data-c="all">All</button>' + D.CATS.map(c => '<button type="button" class="opt" data-c="' + c[0] + '">' + esc(c[1]) + '</button>').join('');
    els.chips.addEventListener('click', e => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      cat = b.dataset.c;
      els.chips.querySelectorAll('.opt').forEach(x => x.classList.toggle('act', x === b));
      render();
      try { const u = new URL(location.href); if (cat === 'all') u.searchParams.delete('category'); else u.searchParams.set('category', cat); history.replaceState(null, '', u); } catch (e2) { /* ignore */ }
    });
    const want = new URLSearchParams(location.search).get('category');
    if (want && D.CATS.some(c => c[0] === want)) { cat = want; els.chips.querySelectorAll('.opt').forEach(x => x.classList.toggle('act', x.dataset.c === want)); }
  }
  if (els.q) {
    const initial = new URLSearchParams(location.search).get('search');
    if (initial) { els.q.value = initial; term = initial.toLowerCase(); }
    els.q.addEventListener('input', () => { term = els.q.value.trim().toLowerCase(); render(); });
  }

  /* load */
  async function load() {
    try {
      items = await D.list(cfg.coll, { max: cfg.max || 120 });
      loaded = true; status('', '');
    } catch (err) {
      loaded = false; items = [];
      status('err', '<b>Could not load ' + esc(nouns) + '.</b> ' + esc(D.explain(err)) + ' <button type="button" class="lnk" id="retry">Try again</button>');
      const r = $('#retry'); if (r) r.addEventListener('click', () => { els.list.innerHTML = ''; load(); });
    }
    render();
    const id = new URLSearchParams(location.search).get('id');
    if (id && loaded) { const it = items.find(x => x.id === id); if (it) openDetail(it); }
  }

  function render() {
    if (els.count) els.count.textContent = loaded ? items.length + ' ' + (items.length === 1 ? noun : nouns) : '';
    if (!loaded) { els.list.innerHTML = ''; return; }
    const rows = items.filter(it => {
      if (cat !== 'all' && it.category !== cat) return false;
      if (!term) return true;
      return (cfg.searchKeys || ['title']).some(k => String(it[k] || '').toLowerCase().includes(term));
    });
    if (!items.length) {
      els.list.innerHTML = '<div class="empty"><div class="eic">' + (cfg.icon || IC.hat) + '</div><h3>' + esc(cfg.emptyTitle || ('No ' + nouns + ' yet')) + '</h3><p>' +
        esc(owner ? (cfg.emptyOwner || ('Add your first ' + noun + ' with the button above.')) : (cfg.emptyText || 'New ones are on the way. Check back soon.')) + '</p></div>';
      return;
    }
    if (!rows.length) { els.list.innerHTML = '<div class="empty"><h3>No matches</h3><p>Try a different search or category.</p></div>'; return; }
    els.list.innerHTML = rows.map(it =>
      '<article class="ccard' + (cfg.cardClass ? ' ' + cfg.cardClass : '') + '" data-id="' + esc(it.id) + '" tabindex="0" role="button" aria-label="' + esc(it.title || it.name || noun) + '">' +
      cfg.card(it, h) +
      (owner ? '<button type="button" class="cdel" data-del="' + esc(it.id) + '" aria-label="Delete">' + IC.trash + '</button>' : '') +
      '</article>').join('');
  }

  els.list.addEventListener('click', e => {
    const del = e.target.closest('[data-del]');
    if (del) { e.stopPropagation(); confirmDelete(del, del.dataset.del); return; }
    const card = e.target.closest('.ccard[data-id]'); if (!card) return;
    const it = items.find(x => x.id === card.dataset.id); if (it) openDetail(it);
  });
  els.list.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.ccard[data-id]'); if (!card || e.target.closest('[data-del]')) return;
    e.preventDefault(); const it = items.find(x => x.id === card.dataset.id); if (it) openDetail(it);
  });

  let armed = null;
  async function confirmDelete(btn, id, after) {
    if (armed !== btn) {
      armed = btn; btn.classList.add('arm'); btn.setAttribute('data-t', 'Click again to delete');
      setTimeout(() => { if (armed === btn) { armed = null; btn.classList.remove('arm'); btn.removeAttribute('data-t'); } }, 3000);
      return;
    }
    armed = null; btn.disabled = true;
    try {
      await D.remove(cfg.coll, id);
      items = items.filter(x => x.id !== id); render();
      D.say('success', 'Deleted', 'The ' + noun + ' was removed.');
      if (after) after();
    } catch (err) { btn.disabled = false; btn.classList.remove('arm'); D.say('error', 'Could not delete', D.explain(err)); }
  }

  /* detail */
  function openDetail(it) {
    try { const u = new URL(location.href); u.searchParams.set('id', it.id); history.replaceState(null, '', u); } catch (e) { /* ignore */ }
    const m = openModal('<div class="dm">' + cfg.detail(it, h) + (owner ? '<div class="dm-own"><button type="button" class="sbtn danger" data-mdel>' + IC.trash + 'Delete this ' + esc(noun) + '</button></div>' : '') + '</div>', {
      wide: true,
      onClose: () => { try { const u = new URL(location.href); u.searchParams.delete('id'); history.replaceState(null, '', u); } catch (e) { /* ignore */ } }
    });
    const md = m.el.querySelector('[data-mdel]');
    if (md) md.addEventListener('click', () => confirmDelete(md, it.id, () => m.close()));
  }

  /* add form (owner only) */
  function openForm() {
    if (!owner) return;
    const m = openModal('<form class="cform" novalidate><h2 class="serif">Add ' + esc(/^[aeiou]/i.test(noun) ? 'an' : 'a') + ' ' + esc(noun) + '</h2>' +
      cfg.fields.map(fieldHTML).join('') +
      '<div class="cmsg" role="alert" hidden></div>' +
      '<button class="sbtn fill" type="submit"><i class="spin"></i><span class="lbl">Publish ' + esc(noun) + '</span></button></form>', { wide: true });
    const form = m.el.querySelector('form'), msg = m.el.querySelector('.cmsg'), btn = form.querySelector('.sbtn.fill');
    cfg.fields.filter(f => f.type === 'media').forEach(f => {
      const fi = form.querySelector('#f_' + f.k + '_file'), nm = form.querySelector('#f_' + f.k + '_name');
      fi.addEventListener('change', () => { nm.textContent = fi.files[0] ? fi.files[0].name : ''; });
    });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      form.querySelectorAll('.fld').forEach(x => { x.classList.remove('bad'); x.querySelector('.ferr').textContent = ''; });
      msg.hidden = true;
      const data = {}; let bad = 0;
      const fail = (k, t) => { const x = form.querySelector('.fld[data-k="' + k + '"]'); x.classList.add('bad'); x.querySelector('.ferr').textContent = t; bad++; };
      const files = {};
      for (const f of cfg.fields) {
        const id = '#f_' + f.k, el = form.querySelector(id);
        let v = el.value.trim();
        if (f.type === 'media') {
          const file = form.querySelector(id + '_file').files[0];
          if (file) { files[f.k] = file; v = ''; if (f.kind === 'video' && !/^video\//.test(file.type)) fail(f.k, 'Please choose a video file.'); if (f.kind !== 'video' && !/^image\//.test(file.type)) fail(f.k, 'Please choose an image file.'); }
          else if (v) {
            if (!safeUrl(v)) fail(f.k, 'Enter a link that starts with https://');
            else if (f.kind === 'video' && !VIDEO_OK.test(v) && !STORAGE_OK.test(v)) fail(f.k, 'Use a direct link to a video file (ending in .mp4, .webm or .mov).');
          }
          if (f.req && !v && !file) fail(f.k, 'Add a link or choose a file.');
        } else if (f.req && !v) fail(f.k, 'This is required.');
        if (f.type === 'number' && v) { const n = Number(v); if (!isFinite(n) || n < 0) fail(f.k, 'Enter a valid number.'); else v = n; }
        if (v !== '' && !(f.type === 'media' && files[f.k])) data[f.k] = v;
      }
      if (bad) { msg.hidden = false; msg.textContent = 'Please fix the highlighted fields.'; const b = form.querySelector('.fld.bad input,.fld.bad textarea,.fld.bad select'); if (b) b.focus(); return; }
      btn.classList.add('loading'); btn.disabled = true;
      try {
        for (const k of Object.keys(files)) {
          const f = cfg.fields.find(x => x.k === k), prog = form.querySelector('#f_' + k + '_prog');
          prog.hidden = false;
          data[k] = await D.upload(f.kind === 'video' ? 'videos' : 'images', files[k], p => { prog.firstElementChild.style.width = Math.round(p * 100) + '%'; });
        }
        if (cfg.transform) cfg.transform(data);
        const id = await D.add(cfg.coll, data);
        items.unshift(Object.assign({ id, createdAt: new Date() }, data));
        render(); m.close();
        D.say('success', 'Published', 'Your ' + noun + ' is live.');
      } catch (err) {
        msg.hidden = false; msg.textContent = D.explain(err);
        D.say('error', 'Could not publish', D.explain(err));
        btn.classList.remove('loading'); btn.disabled = false;
      }
    });
    setTimeout(() => { const f = form.querySelector('input,textarea,select'); if (f) f.focus(); }, 80);
  }

  await load();
  return { reload: load, isOwner: () => owner };
}

/* =====================================================================
   CONTENT TYPES: what each page shows and what the owner can add
   ===================================================================== */
const thumb = (it, h, tag) => '<div class="cthumb"' + h.bg(it.image) + '>' + (h.img(it.image) ? '' : '<span class="ph">' + IC.hat + '</span>') +
  (tag ? '<span class="ctag">' + h.esc(tag) + '</span>' : '') + '</div>';
const minutes = m => { m = Number(m); if (!m) return ''; return m >= 60 ? (Math.floor(m / 60) + ' hr' + (m % 60 ? ' ' + (m % 60) + ' min' : '')) : m + ' min'; };
const pill = (t, ico) => t ? '<span class="pill2">' + (ico || '') + h.esc(t) + '</span>' : '';
const catOpt = D.CATS;
const DIFF = [['Easy', 'Easy'], ['Medium', 'Medium'], ['Hard', 'Hard']];

export const TYPES = {
  recipes: {
    coll: 'recipes', noun: 'recipe', nouns: 'recipes', cats: true,
    searchKeys: ['title', 'description', 'ingredients', 'category'],
    emptyTitle: 'No recipes yet', emptyText: 'New recipes are on the way. Check back soon.',
    fields: [
      { k: 'title', label: 'Recipe name', type: 'text', req: true, max: 120 },
      { k: 'category', label: 'Category', type: 'select', options: catOpt, req: true },
      { k: 'time', label: 'Total time (minutes)', type: 'number', ph: '30', maxv: 2880 },
      { k: 'difficulty', label: 'Difficulty', type: 'select', options: DIFF },
      { k: 'servings', label: 'Servings', type: 'number', ph: '4', maxv: 200 },
      { k: 'description', label: 'Short description', type: 'textarea', rows: 3, max: 600, req: true },
      { k: 'image', label: 'Photo', type: 'media', kind: 'image', hint: 'Paste an image link or choose a file.' },
      { k: 'ingredients', label: 'Ingredients', type: 'textarea', rows: 6, max: 4000, req: true, hint: 'One ingredient per line.' },
      { k: 'steps', label: 'Steps', type: 'textarea', rows: 7, max: 8000, req: true, hint: 'One step per line.' }
    ],
    card: (it, h) => thumb(it, h, h.catLabel(it.category)) + '<div class="cbody"><h3>' + h.esc(it.title) + '</h3>' +
      (it.description ? '<p>' + h.esc(it.description) + '</p>' : '') +
      '<div class="cmeta">' + (it.time ? '<span>' + IC.clock + minutes(it.time) + '</span>' : '') + (it.difficulty ? '<span>' + h.esc(it.difficulty) + '</span>' : '') + '</div></div>',
    detail: (it, h) => (h.img(it.image) ? '<div class="dimg"' + h.bg(it.image) + '></div>' : '') +
      '<h2>' + h.esc(it.title) + '</h2><div class="dmeta">' + pill(h.catLabel(it.category)) + pill(minutes(it.time), IC.clock) + pill(it.difficulty) + pill(it.servings ? 'Serves ' + it.servings : '') + '</div>' +
      (it.description ? '<p class="lead2">' + h.esc(it.description) + '</p>' : '') +
      '<h4>Ingredients</h4><ul class="ing">' + h.lines(it.ingredients).map(l => '<li>' + h.esc(l) + '</li>').join('') + '</ul>' +
      '<h4>Steps</h4><ol class="steps">' + h.lines(it.steps).map(l => '<li><span>' + h.esc(l) + '</span></li>').join('') + '</ol>'
  },
  foods: {
    coll: 'foods', noun: 'dish', nouns: 'dishes', cats: true,
    searchKeys: ['title', 'description', 'category'],
    emptyTitle: 'No dishes yet', emptyText: 'Our food gallery is coming soon. Check back soon.',
    fields: [
      { k: 'title', label: 'Dish name', type: 'text', req: true, max: 120 },
      { k: 'category', label: 'Category', type: 'select', options: catOpt, req: true },
      { k: 'description', label: 'Description', type: 'textarea', rows: 4, max: 1200, req: true },
      { k: 'image', label: 'Photo', type: 'media', kind: 'image', hint: 'Paste an image link or choose a file.' }
    ],
    card: (it, h) => thumb(it, h, h.catLabel(it.category)) + '<div class="cbody"><h3>' + h.esc(it.title) + '</h3>' + (it.description ? '<p>' + h.esc(it.description) + '</p>' : '') + '</div>',
    detail: (it, h) => (h.img(it.image) ? '<div class="dimg"' + h.bg(it.image) + '></div>' : '') +
      '<h2>' + h.esc(it.title) + '</h2><div class="dmeta">' + pill(h.catLabel(it.category)) + '</div>' + (it.description ? '<p class="dbody">' + h.esc(it.description) + '</p>' : '')
  },
  videos: {
    coll: 'videos', noun: 'video', nouns: 'videos', cats: true, cardClass: 'vcard', list: '#list',
    searchKeys: ['title', 'description', 'category'],
    emptyTitle: 'No videos yet', emptyText: 'Video lessons are coming soon. Check back soon.', emptyOwner: 'Upload your first video with the button above.',
    fields: [
      { k: 'title', label: 'Video title', type: 'text', req: true, max: 120 },
      { k: 'category', label: 'Category', type: 'select', options: catOpt },
      { k: 'description', label: 'Description', type: 'textarea', rows: 3, max: 1200 },
      { k: 'video', label: 'Video', type: 'media', kind: 'video', req: true, ph: 'Link to a video file (.mp4, .webm)', hint: 'Choose a file to upload, or paste a direct link to an .mp4 file.' },
      { k: 'image', label: 'Thumbnail (optional)', type: 'media', kind: 'image' }
    ],
    card: (it, h) => '<div class="cthumb"' + h.bg(it.image) + '>' + (h.img(it.image) ? '' : '<span class="ph">' + IC.hat + '</span>') +
      '<span class="vplay"><b>' + IC.play + '</b></span>' + (it.category ? '<span class="ctag">' + h.esc(h.catLabel(it.category)) + '</span>' : '') + '</div>' +
      '<div class="cbody"><h3>' + h.esc(it.title) + '</h3><div class="cmeta"><span>' + h.esc(h.date(it.createdAt)) + '</span></div></div>',
    detail: (it, h) => (h.img(it.video) ? '<video controls autoplay playsinline preload="metadata" src="' + h.img(it.video).replace(/"/g, '%22') + '"' + (h.img(it.image) ? ' poster="' + h.img(it.image).replace(/"/g, '%22') + '"' : '') + '></video>' : '<p class="lead2">This video link is not valid.</p>') +
      '<h2>' + h.esc(it.title) + '</h2><div class="dmeta">' + pill(h.catLabel(it.category)) + pill(h.date(it.createdAt)) + '</div>' +
      (it.description ? '<p class="dbody">' + h.esc(it.description) + '</p>' : '')
  },
  posts: {
    coll: 'posts', noun: 'post', nouns: 'posts', cats: true,
    searchKeys: ['title', 'excerpt', 'body'],
    emptyTitle: 'No posts yet', emptyText: 'Our first articles are coming soon. Check back soon.',
    fields: [
      { k: 'title', label: 'Title', type: 'text', req: true, max: 140 },
      { k: 'category', label: 'Category', type: 'select', options: catOpt },
      { k: 'excerpt', label: 'Short summary', type: 'textarea', rows: 2, max: 240, req: true },
      { k: 'image', label: 'Cover image', type: 'media', kind: 'image' },
      { k: 'body', label: 'Article', type: 'textarea', rows: 10, max: 20000, req: true }
    ],
    card: (it, h) => thumb(it, h, h.catLabel(it.category)) + '<div class="cbody"><h3>' + h.esc(it.title) + '</h3>' + (it.excerpt ? '<p>' + h.esc(it.excerpt) + '</p>' : '') +
      '<div class="cmeta"><span>' + h.esc(h.date(it.createdAt)) + '</span></div></div>',
    detail: (it, h) => (h.img(it.image) ? '<div class="dimg"' + h.bg(it.image) + '></div>' : '') +
      '<h2>' + h.esc(it.title) + '</h2><div class="dmeta">' + pill(h.catLabel(it.category)) + pill(h.date(it.createdAt)) + '</div><p class="dbody">' + h.esc(it.body || '') + '</p>'
  }
};
