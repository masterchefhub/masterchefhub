# Stripe checkout worker (orders)

Memberships already work with Stripe payment links. Orders have changing totals, so they need this small worker.
It is free on Cloudflare and takes about 5 minutes.

1. Make a free account at dash.cloudflare.com, then **Workers & Pages > Create > Create Worker > Deploy**, then **Edit code**.
2. Delete what is there, paste all of `checkout.js`, and press **Deploy**.
3. **Settings > Variables and secrets > Add**: type **Secret**, name `STRIPE_SECRET_KEY`, value = a Stripe **restricted key**.
   In Stripe (sandbox): Developers > API keys > Create restricted key. Give it **Checkout Sessions: Write** and **Coupons: Write**. Never paste a key into the website or into chat.
4. Copy the worker address (like `https://mch-checkout.yourname.workers.dev`) and put it in `CHECKOUT_URL` in `menu.js`.
5. When you go live, make a live-mode restricted key, replace the secret, and set `STRIPE_TEST = false` in `menu.js`.

If the dish prices in `menu.js` change, paste the new `checkout.js` again (the price table inside it is generated from the menu).
