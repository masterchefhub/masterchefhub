/* MasterChefHub shared data layer (Firebase).
 * Loaded by pages with:  const D = await import('/data.js');
 * Needs /firebase-config.js with your real keys.
 */
const FBV = '10.14.1';
const BASE = 'https://www.gstatic.com/firebasejs/' + FBV + '/';

/* The owner. Only this Google account (with a verified email) can add or delete content.
 * The Firestore/Storage rules enforce the same thing on the server. */
export const OWNER = 'chrisw81114@gmail.com';

/* Shared food categories: [id, label] */
export const CATS = [
  ['breakfast', 'Breakfast'],
  ['lunch', 'Lunch'],
  ['dinner', 'Dinner'],
  ['desserts', 'Desserts'],
  ['vegan', 'Vegan'],
  ['grill', 'Grill'],
  ['snacks', 'Snacks'],
  ['drinks', 'Drinks']
];
export const catLabel = id => { const c = CATS.find(x => x[0] === id); return c ? c[1] : ''; };

export const state = { error: null };
let boot = null;

export function init() {
  if (boot) return boot;
  boot = (async () => {
    try {
      let cfg;
      try { cfg = (await import('/firebase-config.js')).firebaseConfig; }
      catch (e) { state.error = 'not-configured'; return null; }
      if (!cfg || !cfg.apiKey || !cfg.projectId || !cfg.appId || /PASTE_|YOUR_/.test(cfg.apiKey + cfg.projectId + cfg.appId)) {
        state.error = 'not-configured'; return null;
      }
      const [App, A, F] = await Promise.all([
        import(BASE + 'firebase-app.js'),
        import(BASE + 'firebase-auth.js'),
        import(BASE + 'firebase-firestore.js')
      ]);
      const app = App.initializeApp(cfg);
      const auth = A.getAuth(app);
      let db = null; try { db = F.getFirestore(app); } catch (e) { db = null; }
      return { app, auth, db, A, F };
    } catch (e) {
      state.error = 'load-failed';
      if (window.console) console.warn('[data] could not load Firebase', e);
      return null;
    }
  })();
  return boot;
}

async function need() {
  const c = await init();
  if (!c) { const e = new Error(state.error || 'not-configured'); e.code = 'mch/' + (state.error || 'not-configured'); throw e; }
  if (!c.db) { const e = new Error('no-db'); e.code = 'mch/no-db'; throw e; }
  return c;
}

/* ---------- who is signed in ---------- */
export async function whenUser() {
  const c = await init();
  if (!c) return null;
  if (c.auth.authStateReady) { await c.auth.authStateReady(); return c.auth.currentUser; }
  return new Promise(r => { const un = c.auth.onAuthStateChanged(u => { un(); r(u); }); });
}
export const emailOf = u => ((u && u.email) || '').toLowerCase();
export const isOwner = u => !!u && emailOf(u) === OWNER.toLowerCase() && u.emailVerified === true;
export function hasPassword(u) { return !!u && !!u.providerData && u.providerData.some(p => p.providerId === 'password'); }

/* the small copy of the user kept in the browser (sidebar chip, redirects) */
export function cacheUser(u) {
  try {
    if (!u) { localStorage.removeItem('mch_user'); return; }
    const pid = u.providerData && u.providerData[0] ? u.providerData[0].providerId : 'password';
    localStorage.setItem('mch_user', JSON.stringify({
      uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '',
      provider: pid, hasPw: hasPassword(u), owner: isOwner(u)
    }));
  } catch (e) { /* storage blocked: fine */ }
}

/* ---------- content (Firestore) ---------- */
export async function list(coll, opts) {
  const max = (opts && opts.max) || 100;
  const c = await need();
  const q = c.F.query(c.F.collection(c.db, coll), c.F.orderBy('createdAt', 'desc'), c.F.limit(max));
  const s = await c.F.getDocs(q);
  return s.docs.map(d => Object.assign({ id: d.id }, d.data()));
}
export async function get(coll, id) {
  const c = await need();
  const s = await c.F.getDoc(c.F.doc(c.db, coll, id));
  return s.exists() ? Object.assign({ id: s.id }, s.data()) : null;
}
export async function count(coll) {
  const c = await need();
  if (c.F.getCountFromServer) {
    const s = await c.F.getCountFromServer(c.F.collection(c.db, coll));
    return s.data().count;
  }
  const s = await c.F.getDocs(c.F.collection(c.db, coll));
  return s.size;
}
export async function countWhere(coll, field, value) {
  const c = await need();
  const q = c.F.query(c.F.collection(c.db, coll), c.F.where(field, '==', value));
  if (c.F.getCountFromServer) { const s = await c.F.getCountFromServer(q); return s.data().count; }
  const s = await c.F.getDocs(q); return s.size;
}
export async function add(coll, data) {
  const c = await need();
  const u = c.auth.currentUser;
  const ref = await c.F.addDoc(c.F.collection(c.db, coll), Object.assign({}, data, { createdAt: c.F.serverTimestamp(), by: emailOf(u) }));
  return ref.id;
}
export async function remove(coll, id) {
  const c = await need();
  await c.F.deleteDoc(c.F.doc(c.db, coll, id));
}
export async function setDoc(coll, id, data, merge) {
  const c = await need();
  await c.F.setDoc(c.F.doc(c.db, coll, id), data, { merge: merge !== false });
}

/* ---------- file upload (Firebase Storage; needs the Blaze plan) ---------- */
export async function upload(folder, file, onProgress) {
  const c = await init();
  if (!c) { const e = new Error('not-configured'); e.code = 'mch/not-configured'; throw e; }
  const S = await import(BASE + 'firebase-storage.js');
  const st = S.getStorage(c.app);
  const clean = String(file.name || 'file').replace(/[^\w.\-]+/g, '_').slice(-80);
  const r = S.ref(st, folder + '/' + Date.now() + '-' + clean);
  const task = S.uploadBytesResumable(r, file, { contentType: file.type || undefined });
  return new Promise((res, rej) => {
    task.on('state_changed',
      s => { if (onProgress && s.totalBytes) onProgress(s.bytesTransferred / s.totalBytes); },
      rej,
      async () => { try { res(await S.getDownloadURL(task.snapshot.ref)); } catch (e) { rej(e); } });
  });
}

/* ---------- helpers ---------- */
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const safeUrl = u => { u = String(u || '').trim(); return /^(https?:\/\/|\/)[^\s"'<>]+$/i.test(u) ? u : ''; };
export function fmtDate(ts) {
  try {
    const d = ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
    return d && !isNaN(d) ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  } catch (e) { return ''; }
}
export function explain(err) {
  const c = (err && err.code) || '';
  if (c === 'mch/not-configured') return 'Firebase is not connected yet. Add your keys to firebase-config.js.';
  if (c === 'mch/load-failed' || c === 'mch/no-db') return 'Could not reach the database. Check your connection and that Firestore is turned on.';
  if (c === 'permission-denied' || c === 'storage/unauthorized') return 'The database rules are blocking this. Publish the Firestore rules from the setup guide.';
  if (c === 'unavailable' || c === 'network-request-failed') return 'You seem to be offline. Please try again.';
  if (c === 'not-found' || c === 'failed-precondition') return 'Turn on Firestore Database in your Firebase project, then reload.';
  if (c === 'storage/unknown' || c === 'storage/bucket-not-found' || c === 'storage/project-not-found') return 'File upload needs Firebase Storage. Turn it on (Blaze plan) or paste a link instead.';
  if (c === 'storage/quota-exceeded') return 'Your Firebase Storage quota is full.';
  if (c === 'storage/canceled') return 'The upload was cancelled.';
  return 'Something went wrong. Please try again.';
}
export function say(type, title, message) {
  try { if (window.MCH && MCH.notify) return MCH.notify({ type, title, message }); } catch (e) { /* ignore */ }
}
