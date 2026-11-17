/* MasterChefHub stock: the owner sets how many of each dish are left (owner page).
 * No stock document = not tracked = always available. Stock 0 = sold out. */
import * as D from '/data.js';
const KEY = 'mch_stock', TTL = 45000;
let map = null;
function read() { try { const o = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (o && Date.now() - o.t < TTL) return o.m; } catch (e) {} return null; }
function stale() { try { const o = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return o && o.m; } catch (e) { return null; } }
export function peek() { return map || stale() || {}; }
export async function load(force) {
  if (!force) { const c = read(); if (c) return (map = c); }
  try {
    const rows = await D.listAll('stock', 300);
    const m = {}; rows.forEach(r => { if (typeof r.qty === 'number') m[r.id] = r.qty; });
    map = m; try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), m })); } catch (e) {}
    return m;
  } catch (e) { return (map = stale() || {}); }
}
export function forget() { try { sessionStorage.removeItem(KEY); } catch (e) {} map = null; }
/* how many are left: Infinity when not tracked */
export const left = id => { const m = map || stale() || {}; return typeof m[id] === 'number' ? Math.max(0, m[id]) : Infinity; };
export const soldOut = id => left(id) <= 0;
