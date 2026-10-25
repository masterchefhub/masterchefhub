/*! MasterChefHub loading screen
    Add inside <head> of every page, as early as possible:  <script src="/loader.js"></script>

    When it shows:
      - when someone visits the site (new tab, typed address, link from another website)
      - when the page is refreshed
      - when moving between pages ONLY if the next page is slow to load (lag / bad connection)
    It never appears for quick page-to-page moves.  Can be turned off in Settings. */
(function () {
'use strict';
if (window.MCHLoader) return;

var S = {};
try { S = JSON.parse(localStorage.getItem('mch_settings') || '{}') || {}; } catch (e) {}
var root = document.documentElement;

/* apply display preferences before the first paint */
if (S.reduceMotion) root.classList.add('mch-reduce');
if (S.textSize === 'small') root.style.fontSize = '15px';
else if (S.textSize === 'large') root.style.fontSize = '17.5px';

/* how did we get here? */
var navType = 'navigate';
try { var nv = performance.getEntriesByType('navigation')[0]; if (nv && nv.type) navType = nv.type; } catch (e) {}
var internal = false;
try { internal = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
var fresh = navType === 'reload' || (navType === 'navigate' && !internal);

var CSS =
'.mld{position:fixed;inset:0;z-index:2147483000;background:transparent;color:#fff;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased}' +
'html.mld-lock,html.mld-lock body{overflow:hidden!important}' +
'.mld *,.mld *::before,.mld *::after{box-sizing:border-box;margin:0;padding:0}' +
'.mld-panel{position:absolute;top:0;bottom:0;width:50.2%;background:#0a0a0a;transition:transform .8s cubic-bezier(.77,0,.18,1)}' +
'.mld-l{left:0}.mld-r{right:0}' +
'.mld.out .mld-l{transform:translateX(-101%);transition-delay:.3s}' +
'.mld.out .mld-r{transform:translateX(101%);transition-delay:.3s}' +
'.mld-bg{position:absolute;inset:0;transition:opacity .45s}' +
'.mld.out .mld-bg{opacity:0}' +
'.mld-grid{position:absolute;inset:-50%;background-image:linear-gradient(#1a1a1a 1px,transparent 1px),linear-gradient(90deg,#1a1a1a 1px,transparent 1px);background-size:56px 56px;transform:perspective(600px) rotateX(58deg) translateY(-8%);-webkit-mask-image:radial-gradient(circle at 50% 55%,#000 0,transparent 55%);mask-image:radial-gradient(circle at 50% 55%,#000 0,transparent 55%);animation:mldGrid 4s linear infinite}' +
'@keyframes mldGrid{to{background-position:0 56px}}' +
'.mld-glow{position:absolute;left:50%;top:44%;width:560px;height:560px;margin:-280px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.1),transparent 65%);animation:mldBreath 3.2s ease-in-out infinite}' +
'@keyframes mldBreath{0%,100%{transform:scale(.9);opacity:.6}50%{transform:scale(1.12);opacity:1}}' +
'.mld-p{position:absolute;bottom:-20px;border-radius:50%;background:#fff;opacity:0;animation:mldRiseP linear infinite}' +
'@keyframes mldRiseP{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:.5}100%{transform:translateY(-110vh) scale(1.2);opacity:0}}' +
'.mld-center{position:absolute;left:50%;top:50%;width:440px;margin-left:-220px;transform:translateY(-50%) scale(var(--k,1));display:flex;flex-direction:column;align-items:center;text-align:center;transition:opacity .4s,transform .6s cubic-bezier(.7,0,.3,1)}' +
'.mld.out .mld-center{opacity:0;transform:translateY(-54%) scale(calc(var(--k,1)*.92))}' +
/* stage */
'.mld-stage{position:relative;width:300px;height:290px}' +
'.mld-ring{position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-75px;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);opacity:0;animation:mldRing 3s ease-out infinite}' +
'.mld-ring:nth-child(2){animation-delay:1s}.mld-ring:nth-child(3){animation-delay:2s}' +
'@keyframes mldRing{0%{transform:scale(.7);opacity:.7}100%{transform:scale(2.1);opacity:0}}' +
'.mld-orbit{position:absolute;inset:0;animation:mldSpin 9s linear infinite}' +
'.mld-orbit.o2{inset:42px;animation-duration:6s;animation-direction:reverse}' +
'@keyframes mldSpin{to{transform:rotate(360deg)}}' +
'@keyframes mldSpinR{to{transform:rotate(-360deg)}}' +
'.mld-orbit b{position:absolute;left:50%;top:50%;width:42px;height:42px;margin:-21px;border-radius:50%;background:#111;border:1px solid #333;display:grid;place-items:center;color:#fff;transform:rotate(var(--a)) translateX(126px) rotate(calc(var(--a)*-1));opacity:0;animation:mldIn .6s ease forwards;animation-delay:var(--d)}' +
'.mld-orbit b svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;animation:mldSpinR 9s linear infinite}' +
'.mld-orbit.o2 b{width:12px;height:12px;margin:-6px;background:#fff;border:0;transform:rotate(var(--a)) translateX(88px)}' +
'@keyframes mldIn{from{opacity:0;scale:.2}to{opacity:1;scale:1}}' +
'.mld-mark{position:absolute;left:50%;top:50%;width:124px;height:124px;margin:-62px;animation:mldPop .9s cubic-bezier(.2,.9,.3,1.4) .5s both}' +
'@keyframes mldPop{0%{transform:scale(.3) rotate(-14deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}' +
'.mld-mark svg{width:100%;height:100%;overflow:visible;display:block}' +
'.mld-box{fill:#fff;fill-opacity:0;stroke:#fff;stroke-width:1.6;stroke-dasharray:1;stroke-dashoffset:1;animation:mldDraw 1s ease .1s forwards,mldFill .5s ease 1s forwards}' +
'@keyframes mldDraw{to{stroke-dashoffset:0}}' +
'@keyframes mldFill{to{fill-opacity:1;stroke-width:0}}' +
'.mld-hat{transform-origin:32px 40px;opacity:0;animation:mldHat .7s cubic-bezier(.2,.9,.3,1.5) 1.1s forwards,mldBounce 2.4s ease-in-out 2s infinite}' +
'@keyframes mldHat{0%{opacity:0;transform:translateY(-16px) scale(.5)}100%{opacity:1;transform:none}}' +
'@keyframes mldBounce{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-3px) rotate(-3deg)}60%{transform:translateY(0) rotate(2deg)}}' +
'.mld-steam{position:absolute;left:50%;top:50%;margin:-112px 0 0 -30px;width:60px;height:70px;pointer-events:none}' +
'.mld-steam i{position:absolute;bottom:0;width:6px;height:36px;border-radius:6px;background:linear-gradient(to top,rgba(255,255,255,.55),transparent);opacity:0;animation:mldSteam 2.4s ease-in-out infinite;filter:blur(1.5px)}' +
'.mld-steam i:nth-child(1){left:10px}.mld-steam i:nth-child(2){left:27px;animation-delay:.8s}.mld-steam i:nth-child(3){left:44px;animation-delay:1.6s}' +
'@keyframes mldSteam{0%{transform:translateY(0) scaleX(1);opacity:0}30%{opacity:.8}100%{transform:translateY(-34px) scaleX(2.2) skewX(14deg);opacity:0}}' +
/* word */
'.mld-word{display:flex;gap:6px;margin-top:6px;font-weight:800;font-size:4.1rem;line-height:1;letter-spacing:.02em;font-family:Inter,system-ui,sans-serif}' +
'.mld-word span{display:inline-block;opacity:0;transform:translateY(40px);filter:blur(10px);animation:mldRise .8s cubic-bezier(.2,.9,.3,1) forwards;background:linear-gradient(100deg,#fff 40%,#8a8a8a 50%,#fff 60%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}' +
'.mld-word span:nth-child(1){animation-delay:1.3s}.mld-word span:nth-child(2){animation-delay:1.45s}.mld-word span:nth-child(3){animation-delay:1.6s}' +
'@keyframes mldRise{to{opacity:1;transform:none;filter:none}}' +
'.mld-word.shine span{animation:mldRise .1s forwards,mldShine 2.4s linear infinite}' +
'@keyframes mldShine{0%{background-position:120% 0}100%{background-position:-120% 0}}' +
'.mld-sub{margin-top:10px;font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:#9a9a9a;opacity:0;animation:mldTrack 1.4s ease 1.8s forwards}' +
'@keyframes mldTrack{0%{letter-spacing:.1em;opacity:0}100%{letter-spacing:.5em;opacity:1}}' +
/* progress */
'.mld-bar{position:relative;width:260px;height:4px;border-radius:4px;background:#1f1f1f;margin-top:34px;overflow:hidden;opacity:0;animation:mldIn .5s ease 2s forwards}' +
'.mld-bar i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:4px;background:#fff;box-shadow:0 0 14px rgba(255,255,255,.7)}' +
'.mld-bar i::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(0,0,0,.45),transparent);animation:mldSweep 1.1s linear infinite}' +
'@keyframes mldSweep{from{transform:translateX(-100%)}to{transform:translateX(100%)}}' +
'.mld-meta{display:flex;justify-content:space-between;align-items:center;width:260px;margin-top:12px;font-size:.78rem;color:#8f8f8f;opacity:0;animation:mldIn .5s ease 2.1s forwards}' +
'.mld-tip{transition:opacity .25s,transform .25s}.mld-tip.sw{opacity:0;transform:translateY(5px)}' +
'.mld-pct{color:#fff;font-weight:700;font-variant-numeric:tabular-nums;min-width:38px;text-align:right}' +
/* reduced motion: keep end states, drop movement */
'.mch-reduce .mld *,.mch-reduce .mld *::before,.mch-reduce .mld *::after{animation-duration:.001ms!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:.001ms!important}' +
'@media(prefers-reduced-motion:reduce){.mld *,.mld *::before,.mld *::after{animation-duration:.001ms!important;animation-delay:0s!important;animation-iteration-count:1!important}}';

var ICONS = [
  'M6 3v7a2 2 0 0 0 2 2v9M10 3v7a2 2 0 0 1-2 2M8 3v9M18 21V3c-2.6 1.4-4 4.4-4 8.2V14h4',
  'M12 14v8M8 14c-2-4-1-9 4-12 5 3 6 8 4 12zM12 2v12M9.5 4.5c-.7 3.2-.5 6 .5 9.5M14.5 4.5c.7 3.2.5 6-.5 9.5',
  'M12 22c4 0 7-2.8 7-7 0-3-2-5-3.5-7-.5 1.5-1.5 2.5-2.5 3 0-3-1-6-4-8 .5 4-5 6-5 12 0 4.2 3 7 8 7z',
  'M5 20C5 10 10 4 20 4c0 10-5 16-14 16M5 20c2-5 5-8 9-10'
];
var TIPS = ['Sharpening the knives', 'Preheating the oven', 'Chopping the onions', 'Whisking the eggs', 'Seasoning to taste', 'Warming the pans', 'Plating your page'];

var styleDone = false;
function addStyle() {
  if (styleDone) return; styleDone = true;
  var s = document.createElement('style'); s.id = 'mld-style'; s.textContent = CSS;
  (document.head || root).appendChild(s);
}

function build() {
  addStyle();
  var el = document.createElement('div');
  el.className = 'mld'; el.id = 'mchld';
  el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); el.setAttribute('aria-label', 'Loading MasterChefHub');
  var orbit = ICONS.map(function (d, i) {
    return '<b style="--a:' + (i * 90) + 'deg;--d:' + (1.6 + i * 0.18) + 's"><svg viewBox="0 0 24 24"><path d="' + d + '"/></svg></b>';
  }).join('');
  var dots = [0, 72, 144, 216, 288].map(function (a, i) { return '<b style="--a:' + a + 'deg;--d:' + (1.9 + i * 0.1) + 's"></b>'; }).join('');
  var parts = '';
  for (var i = 0; i < 16; i++) {
    var sz = 2 + Math.random() * 4;
    parts += '<i class="mld-p" style="left:' + (Math.random() * 100).toFixed(1) + '%;width:' + sz.toFixed(1) + 'px;height:' + sz.toFixed(1) + 'px;animation-duration:' + (5 + Math.random() * 6).toFixed(1) + 's;animation-delay:-' + (Math.random() * 8).toFixed(1) + 's"></i>';
  }
  el.innerHTML =
    '<div class="mld-panel mld-l"></div><div class="mld-panel mld-r"></div>' +
    '<div class="mld-bg"><div class="mld-grid"></div><div class="mld-glow"></div>' + parts + '</div>' +
    '<div class="mld-center">' +
      '<div class="mld-stage">' +
        '<i class="mld-ring"></i><i class="mld-ring"></i><i class="mld-ring"></i>' +
        '<div class="mld-orbit">' + orbit + '</div>' +
        '<div class="mld-orbit o2">' + dots + '</div>' +
        '<div class="mld-steam"><i></i><i></i><i></i></div>' +
        '<div class="mld-mark"><svg viewBox="0 0 64 64">' +
          '<rect class="mld-box" x="1" y="1" width="62" height="62" rx="16" pathLength="1"/>' +
          '<g class="mld-hat" fill="#0a0a0a"><circle cx="20.5" cy="25" r="9.5"/><circle cx="32" cy="20" r="11.5"/><circle cx="43.5" cy="25" r="9.5"/><rect x="17" y="25" width="30" height="19"/><rect x="17" y="47" width="30" height="8" rx="2.5"/>' +
          '<path d="M26 33.5v9M38 33.5v9" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></g>' +
        '</svg></div>' +
      '</div>' +
      '<div class="mld-word"><span>M</span><span>C</span><span>H</span></div>' +
      '<div class="mld-sub">Master Chef Hub</div>' +
      '<div class="mld-bar"><i></i></div>' +
      '<div class="mld-meta"><span class="mld-tip">' + TIPS[0] + '...</span><b class="mld-pct">0%</b></div>' +
    '</div>';
  var k = Math.min(1, (window.innerHeight || 800) / 700, (window.innerWidth || 500) / 440);
  el.style.setProperty('--k', k.toFixed(3));
  return el;
}

/* one run of the loading screen */
function Loader(minMs, loadedAlready) {
  var el = build();
  root.appendChild(el);
  root.classList.add('mld-lock');
  var t0 = Date.now(), p = 0, loaded = !!loadedAlready, done = false, tipI = 0, raf = 0;
  var bar = el.querySelector('.mld-bar i'), pct = el.querySelector('.mld-pct'), tip = el.querySelector('.mld-tip'), word = el.querySelector('.mld-word');

  var tipTimer = setInterval(function () {
    if (done) return;
    tip.classList.add('sw');
    setTimeout(function () { tipI = (tipI + 1) % (TIPS.length - 1); tip.textContent = TIPS[tipI] + '...'; tip.classList.remove('sw'); }, 220);
  }, 1100);
  setTimeout(function () { word.classList.add('shine'); }, 2300);

  function frame() {
    if (done) return;
    var t = Date.now() - t0;
    var target = loaded ? 100 : Math.min(92, 92 * (1 - Math.exp(-t / 1700)));
    p += (target - p) * 0.1;
    if (loaded && p > 99.4) p = 100;
    bar.style.width = p.toFixed(1) + '%';
    pct.textContent = Math.round(p) + '%';
    if (loaded && p >= 100 && t >= minMs) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }
  function finish() {
    if (done) return; done = true;
    clearInterval(tipTimer); cancelAnimationFrame(raf);
    bar.style.width = '100%'; pct.textContent = '100%'; tip.classList.remove('sw'); tip.textContent = 'Ready!';
    setTimeout(function () { el.classList.add('out'); }, 260);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); root.classList.remove('mld-lock'); }, 1500);
  }
  raf = requestAnimationFrame(frame);
  return { markLoaded: function () { loaded = true; }, finish: finish, el: el };
}

/* ------------------------------------------------------------------ */
var pageLoaded = document.readyState === 'complete';
var run = null;
var MAX_WAIT = 9000;

if (S.loader !== false) {
  if (fresh) {
    if (!pageLoaded) run = Loader(S.loaderFast ? 1300 : 3000, false);
  } else {
    /* moving between pages: only show if the next page is slow */
    setTimeout(function () { if (!pageLoaded && !run) run = Loader(900, false); }, 450);
  }
  if (!pageLoaded) {
    window.addEventListener('load', function () { pageLoaded = true; if (run) run.markLoaded(); });
    setTimeout(function () {
      if (pageLoaded) return;
      window.__mchSlow = true;
      try { window.dispatchEvent(new CustomEvent('mch:slowload')); } catch (e) {}
      pageLoaded = true; if (run) run.markLoaded();   /* never trap the visitor */
    }, MAX_WAIT);
  }
}

window.MCHLoader = {
  /* used by Settings > Loading screen > Preview */
  preview: function () {
    if (document.getElementById('mchld')) return;
    var r = Loader(3200, false);
    setTimeout(function () { r.markLoaded(); }, 2600);
  }
};
})();
