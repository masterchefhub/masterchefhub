/* MasterChefHub Stripe checkout worker (Cloudflare Workers).
 * Receives the cart from the site, checks every price against Stripe, and returns a Stripe Checkout link.
 * Secrets: STRIPE_SECRET_KEY (restricted key with Checkout Sessions write + Products read). */
const COUPONS = { MCHVISITER439BEST: 25 }; /* keep in step with menu.js */
const SITE = 'https://masterchefhub.com';
const CORS = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

async function stripe(env, path, body) {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body ? new URLSearchParams(body).toString() : undefined
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Stripe error');
  return j;
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
    try {
      const b = await req.json();
      const items = Array.isArray(b.items) ? b.items.slice(0, 40) : [];
      if (!items.length || !/^[A-Za-z0-9]{10,40}$/.test(b.orderId || '')) return json({ error: 'Bad order' }, 400);
      const p = new URLSearchParams();
      let n = 0;
      for (const it of items) {
        const qty = Math.max(1, Math.min(20, Number(it.qty) | 0));
        const prod = await stripe(env, 'products/' + encodeURIComponent(it.id) + '?expand[]=default_price');
        const base = prod.default_price && prod.default_price.unit_amount;
        const unit = Number(it.unit) | 0;
        /* never trust the browser: the price can not be lower than the Stripe price, and extras are capped */
        if (!base || unit < base || unit > base + 5000) return json({ error: 'Price check failed for ' + it.id }, 400);
        p.set(`line_items[${n}][quantity]`, String(qty));
        p.set(`line_items[${n}][price_data][currency]`, 'usd');
        p.set(`line_items[${n}][price_data][unit_amount]`, String(unit));
        p.set(`line_items[${n}][price_data][product]`, prod.id);
        n++;
      }
      const code = String(b.coupon || '').toUpperCase();
      if (COUPONS[code]) {
        const food = items.reduce((t, it) => t + (Number(it.unit) | 0) * Math.max(1, Math.min(20, Number(it.qty) | 0)), 0);
        const c = await stripe(env, 'coupons', { amount_off: String(Math.round(food * COUPONS[code] / 100)), currency: 'usd', duration: 'once', name: 'Coupon ' + code, max_redemptions: '1' });
        p.set('discounts[0][coupon]', c.id);
      }
      const fee = Math.max(0, Math.min(2000, Number(b.fee) | 0)), tax = Math.max(0, Math.min(50000, Number(b.tax) | 0)), tip = Math.max(0, Math.min(20000, Number(b.tip) | 0));
      for (const [name, amt] of [['Delivery fee', fee], ['Sales tax', tax], ['Driver tip', tip]]) {
        if (!amt) continue;
        p.set(`line_items[${n}][quantity]`, '1');
        p.set(`line_items[${n}][price_data][currency]`, 'usd');
        p.set(`line_items[${n}][price_data][unit_amount]`, String(amt));
        p.set(`line_items[${n}][price_data][product_data][name]`, name);
        n++;
      }
      p.set('mode', 'payment');
      p.set('client_reference_id', b.orderId);
      p.set('metadata[orderId]', b.orderId);
      if (b.email) p.set('customer_email', String(b.email).slice(0, 200));
      p.set('success_url', SITE + '/order-success?session_id={CHECKOUT_SESSION_ID}');
      p.set('cancel_url', SITE + '/cart?unpaid=1');
      const s = await stripe(env, 'checkout/sessions', Object.fromEntries(p));
      return json({ url: s.url });
    } catch (e) {
      return json({ error: 'Checkout failed' }, 500);
    }
  }
};
