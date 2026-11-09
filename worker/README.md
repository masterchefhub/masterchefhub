# Stripe checkout worker

1. Create a free Cloudflare account, then Workers & Pages > Create > Hello World, and paste `checkout.js`.
2. Settings > Variables and secrets: add `STRIPE_SECRET_KEY` (a restricted key: Checkout Sessions write, Products read).
3. Copy the worker address (like `https://mch-checkout.yourname.workers.dev`) into `CHECKOUT_URL` in `menu.js`.
4. Stripe Dashboard > Settings > Payment methods: turn on cards, Apple Pay and Google Pay.
