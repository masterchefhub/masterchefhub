/* MasterChefHub "loading your payment" screen: a chef dribbling a basketball.
   MCHPay.show('Loading secure payment')  /  MCHPay.hide()   -- classic script, no imports. */
(function () {
  if (window.MCHPay) return;
  var css = '#mchpay{position:fixed;inset:0;z-index:2147483500;background:#0a0a0a;color:#fff;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-family:Inter,system-ui,-apple-system,sans-serif;text-align:center;padding:24px;opacity:0;transition:opacity .25s}' +
    '#mchpay.on{display:flex}#mchpay.vis{opacity:1}' +
    '#mchpay .gf{background:#fff;border:3px solid #fff;width:min(70vw,260px);height:min(70vw,260px);display:grid;place-items:center;margin-bottom:8px}#mchpay .gf img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}' +
    '#mchpay b{font-size:.78rem;letter-spacing:.28em;font-weight:800;margin-top:4px}' +
    '#mchpay small{color:#9a9a9a;font-size:.86rem;line-height:1.5;max-width:300px}' +
    '#mchpay .dots i{display:inline-block;width:5px;height:5px;background:#fff;margin:0 3px;animation:mchpd 1s infinite ease-in-out}' +
    '#mchpay .dots i:nth-child(2){animation-delay:.15s}#mchpay .dots i:nth-child(3){animation-delay:.3s}' +
    '@keyframes mchpd{0%,100%{opacity:.2;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}}' +
    '@keyframes mchball{0%,100%{transform:translateY(0);animation-timing-function:cubic-bezier(.5,0,1,.6)}50%{transform:translateY(58px);animation-timing-function:cubic-bezier(0,.4,.5,1)}}' +
    '@keyframes mchshadow{0%,100%{transform:scale(.45);opacity:.25}50%{transform:scale(1);opacity:.6}}' +
    '@keyframes mcharm{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-24deg)}}' +
    '@keyframes mchbob{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}' +
    '#mchpay .ball{animation:mchball .8s infinite}#mchpay .sh{transform-origin:128px 201px;animation:mchshadow .8s infinite}' +
    '#mchpay .arm{transform-origin:100px 102px;animation:mcharm .8s infinite}#mchpay .body{animation:mchbob .8s infinite}' +
    '@media(prefers-reduced-motion:reduce){#mchpay .ball,#mchpay .sh,#mchpay .arm,#mchpay .body,#mchpay .dots i{animation:none}}';
  var svg = '<svg viewBox="0 0 200 215" aria-hidden="true">' +
    '<line x1="20" y1="201" x2="180" y2="201" stroke="#333" stroke-width="2"/>' +
    '<ellipse class="sh" cx="128" cy="201" rx="16" ry="3" fill="#000" stroke="#444"/>' +
    '<g class="body" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M100 92v48M100 140l-15 50M100 140l18 50"/><path d="M100 102l-24 22"/>' +
      '<g class="arm"><path d="M100 102l28 26"/></g>' +
      '<circle cx="100" cy="72" r="15" fill="#0a0a0a" stroke-width="6"/>' +
      '<g fill="#fff" stroke="none"><circle cx="89" cy="50" r="8"/><circle cx="100" cy="45" r="10"/><circle cx="111" cy="50" r="8"/><rect x="86" y="50" width="28" height="9"/><rect x="86" y="61" width="28" height="5" rx="2"/></g>' +
    '</g>' +
    '<g class="ball"><circle cx="128" cy="134" r="14" fill="#ff6a1a" stroke="#0a0a0a" stroke-width="1.5"/><path d="M114 134h28M128 120v28M118 124q10 10 0 20M138 124q-10 10 0 20" fill="none" stroke="#0a0a0a" stroke-width="1.4"/></g>' +
    '</svg>';
  var GIFS = ['/img/loading/dribble-1.gif', '/img/loading/dribble-2.gif'], last = -1;
  GIFS.forEach(function (u) { var i = new Image(); i.src = u; });   /* warm the cache */
  function pick() { var n; do { n = Math.floor(Math.random() * GIFS.length); } while (GIFS.length > 1 && n === last); last = n; return GIFS[n]; }
  var el = null;
  function build() {
    if (el) return el;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('div'); el.id = 'mchpay'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<div class="gf"><img id="mchpayG" alt="" width="220" height="220"></div><b id="mchpayT">LOADING SECURE PAYMENT</b><span class="dots"><i></i><i></i><i></i></span><small id="mchpayS">Please do not close this page.</small>';
    document.body.appendChild(el); return el;
  }
  window.MCHPay = {
    show: function (title, sub) {
      var e = build();
      if (title) e.querySelector('#mchpayT').textContent = String(title).toUpperCase();
      if (sub != null) e.querySelector('#mchpayS').textContent = sub;
      e.querySelector('#mchpayG').src = pick();
      e.classList.add('on'); requestAnimationFrame(function () { e.classList.add('vis'); });
    },
    hide: function () { if (!el) return; el.classList.remove('vis'); setTimeout(function () { el.classList.remove('on'); }, 260); }
  };
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) window.MCHPay.hide(); });
})();
