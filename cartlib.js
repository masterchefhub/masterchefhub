/* MasterChefHub: the cart (shared by the Food and Cart pages).
 * A cart line = { k, id, q, fresh, sel: { groupId: [choice names] }, note } */
import { MENU, freshExtra } from '/menu.js';
export const KEY = 'mch_cart2';
export const items = new Map(MENU.map(m => [m.id, Object.assign({}, m, { c: Math.round(m.price * 100) })]));
export const money = c => '$' + (c / 100).toFixed(2);
const cents = d => Math.round(d * 100);

/* price of one unit of a line, in cents */
export function unit(line) {
  const m = items.get(line.id); if (!m) return 0;
  let c = m.c;
  if (line.fresh && m.canFresh) c += cents(freshExtra(m.price));
  m.groups.forEach(g => (line.sel[g.id] || []).forEach(n => { const ch = g.choices.find(x => x[0] === n); if (ch) c += cents(ch[1]); }));
  return c;
}
export const lineTotal = line => unit(line) * line.q;
export const sub = lines => lines.reduce((t, l) => t + lineTotal(l), 0);
export const count = lines => lines.reduce((t, l) => t + l.q, 0);
export const hasAlcohol = lines => lines.some(l => { const m = items.get(l.id); return m && m.alcohol; });

/* readable list of what was chosen, for the cart and for the order */
export function describe(line) {
  const m = items.get(line.id), out = [];
  if (m && m.canFresh) out.push(line.fresh ? 'Fresh and homemade' : 'Basic');
  if (m) m.groups.forEach(g => { const s = line.sel[g.id] || []; if (s.length) out.push(s.join(', ')); });
  if (line.note) out.push('Note: ' + line.note);
  return out;
}
export const sigOf = l => [l.id, l.fresh ? 1 : 0, Object.keys(l.sel).sort().map(g => g + ':' + l.sel[g].slice().sort().join('|')).join(';'), l.note || ''].join('#');

export function load() {
  let raw = [];
  try { raw = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
  if (!Array.isArray(raw)) raw = [];
  return raw.filter(l => l && items.has(l.id) && l.q > 0).map(l => ({ k: String(l.k || Math.random().toString(36).slice(2)), id: l.id, q: Math.min(20, l.q | 0), fresh: !!l.fresh, sel: l.sel && typeof l.sel === 'object' ? l.sel : {}, note: String(l.note || '').slice(0, 120) }));
}
export function save(lines) {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) {}
  try { window.dispatchEvent(new Event('mch:cart')); } catch (e) {}
}
/* add a line (merges with an identical one) */
export function add(lines, line) {
  const s = sigOf(line), hit = lines.find(l => sigOf(l) === s);
  if (hit) hit.q = Math.min(20, hit.q + line.q); else lines.push(line);
  save(lines);
}
