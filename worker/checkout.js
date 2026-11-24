/* MasterChefHub Stripe checkout worker (Cloudflare Workers). Works in Stripe TEST mode and live mode: it follows whatever key you give it.
 * POST  {orderId, email, coupon, items:[{id,name,qty,unit}]}  ->  {url}  (clientSecret for the embedded card form on /secure)
 * GET   ?session_id=cs_...                                   ->  {paid:true|false}
 * The worker works out the delivery fee, tax and coupon itself, and checks every price, so the browser can not change them.
 * Secret: STRIPE_SECRET_KEY = a restricted key with  Checkout Sessions: Write  and  Coupons: Write  (read is fine too). */
const SITE = 'https://masterchefhub.com';
const FEE = 300, TAX_RATE = 0.07, COUPONS = { MCHVISITER439BEST: 25 };   /* keep in step with menu.js */
const PRICES = {"grilled-cheese":1199,"turkey-sandwich":1499,"blt":1599,"ham-cheese":1499,"club":1999,"chicken-sandwich":1899,"pbj":899,"philly-cheesesteak":1699,"tuna-melt":1399,"chicken-wrap":1499,"meatball-sub":1599,"cheeseburger":1999,"hamburger":1699,"hotdog":1099,"tacos":1999,"quesadilla":1599,"pizza-slice":1499,"nuggets":1599,"chicken-tenders":1599,"nachos":1499,"burrito":1599,"spaghetti-meat":1999,"mac-cheese":1699,"butter-noodles":1299,"alfredo":2399,"lasagna":2499,"carbonara":1999,"baked-ziti":1899,"pesto-pasta":1699,"eggs-toast":1299,"pancakes":1499,"breakfast-sandwich":1199,"omelette":1499,"bacon-eggs":1499,"fries":699,"salad":899,"onion-rings":999,"mashed-potatoes":899,"mozzarella-sticks":999,"waffle-fries":899,"choc-cake":999,"vanilla-cake":999,"brownies":899,"cookies":899,"cupcake":699,"cheesecake":999,"tiramisu":1099,"donuts":899,"cinnamon-roll":899,"lemonade":499,"iced-tea":499,"orange-juice":599,"milkshake":899,"hot-chocolate":699,"coffee":499,"soda":399,"water":299,"ribeye-dinner":4799,"burger-feast":4899,"sandwich-platter":4499,"taco-night":4199,"family-lasagna":4099,"spaghetti-tray":3599,"wings-24":3599,"pizza-party":3499,"whole-cake":4199,"dessert-box":3499,"fried-chicken-bucket":3999,"soda-2l":899,"soda-6":1299,"beer":799,"beer-6":1899,"smoothie":799,"iced-coffee":599};
const CORS = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
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
    try {
      if (req.method === 'GET') {
        const id = new URL(req.url).searchParams.get('session_id') || '';
        if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(id)) return json({ error: 'Bad session' }, 400);
        const s = await stripe(env, 'checkout/sessions/' + id);
        return json({ paid: s.payment_status === 'paid', orderId: s.client_reference_id || '' });
      }
      if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
      const b = await req.json();
      const items = Array.isArray(b.items) ? b.items.slice(0, 40) : [];
      if (!items.length || !/^[A-Za-z0-9]{10,40}$/.test(b.orderId || '')) return json({ error: 'Bad order' }, 400);
      const p = {};
      let n = 0, food = 0;
      for (const it of items) {
        const qty = Math.max(1, Math.min(20, Number(it.qty) | 0)), unit = Number(it.unit) | 0, base = PRICES[it.id];
        /* the price can not be lower than the menu price, and extras (fresh, toppings) are capped */
        if (!base || unit < base || unit > base + 4000) return json({ error: 'Price check failed for ' + String(it.id).slice(0, 40) }, 400);
        p['line_items[' + n + '][quantity]'] = String(qty);
        p['line_items[' + n + '][price_data][currency]'] = 'usd';
        p['line_items[' + n + '][price_data][unit_amount]'] = String(unit);
        p['line_items[' + n + '][price_data][product_data][name]'] = String(it.name || it.id).slice(0, 120);
        p['line_items[' + n + '][price_data][product_data][metadata][dish]'] = String(it.id);
        food += unit * qty; n++;
      }
      const code = String(b.coupon || '').toUpperCase();
      let off = 0;
      if (COUPONS[code]) {
        off = Math.round(food * COUPONS[code] / 100);
        const c = await stripe(env, 'coupons', { amount_off: String(off), currency: 'usd', duration: 'once', name: 'Coupon ' + code, max_redemptions: '1' });
        p['discounts[0][coupon]'] = c.id;
      }
      const tax = Math.round((food - off) * TAX_RATE);
      for (const [name, amt] of [['Delivery fee', FEE], ['Sales tax', tax]]) {
        if (!amt) continue;
        p['line_items[' + n + '][quantity]'] = '1';
        p['line_items[' + n + '][price_data][currency]'] = 'usd';
        p['line_items[' + n + '][price_data][unit_amount]'] = String(amt);
        p['line_items[' + n + '][price_data][product_data][name]'] = name;
        n++;
      }
      p.mode = 'payment';
      p.client_reference_id = b.orderId;
      p['metadata[orderId]'] = b.orderId;
      p['payment_intent_data[metadata][orderId]'] = b.orderId;
      p['payment_intent_data[description]'] = 'MasterChefHub order ' + b.orderId.slice(-6).toUpperCase();
      if (b.email) p.customer_email = String(b.email).slice(0, 200);
      /* embedded: the card form is shown inside masterchefhub.com/secure instead of on a Stripe page */
      p.ui_mode = 'embedded';
      p.return_url = SITE + '/order-success?session_id={CHECKOUT_SESSION_ID}';
      const s = await stripe(env, 'checkout/sessions', p);
      return json({ clientSecret: s.client_secret, id: s.id });
    } catch (e) {
      return json({ error: 'Checkout failed' }, 500);
    }
  }
};
