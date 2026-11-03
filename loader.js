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
if (S.textSize === 'small') root.style.fontSize = '15px';
else if (S.textSize === 'large') root.style.fontSize = '17.5px';

/* how did we get here? */
var navType = 'navigate';
try { var nv = performance.getEntriesByType('navigation')[0]; if (nv && nv.type) navType = nv.type; } catch (e) {}
var internal = false;
try { internal = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
var fresh = navType === 'reload' || (navType === 'navigate' && !internal);

var CSS =
'.mld{position:fixed;inset:0;z-index:2147483000;background:#0a0a0a;color:#fff;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased;will-change:transform;transition:transform .75s cubic-bezier(.76,0,.24,1)}' +
'.mld.out{transform:translate3d(0,-100%,0)}' +
'html.mld-lock,html.mld-lock body{overflow:hidden!important}' +
'.mld *,.mld *::before,.mld *::after{box-sizing:border-box;margin:0;padding:0}' +
'.mld-line{position:absolute;left:0;top:0;height:2px;width:100%;background:#fff;transform-origin:left;transform:scaleX(0);will-change:transform}' +
'.mld-gridbg{position:absolute;inset:0;opacity:.5;background-image:linear-gradient(#161616 1px,transparent 1px),linear-gradient(90deg,#161616 1px,transparent 1px);background-size:64px 64px;-webkit-mask-image:radial-gradient(ellipse at center,#000 10%,transparent 70%);mask-image:radial-gradient(ellipse at center,#000 10%,transparent 70%)}' +
'.mld-center{position:absolute;left:50%;top:50%;transform:translate3d(-50%,-50%,0);display:flex;flex-direction:column;align-items:center;text-align:center;gap:18px;transition:opacity .35s,transform .5s cubic-bezier(.7,0,.3,1)}' +
'.mld.out .mld-center{opacity:0;transform:translate3d(-50%,-60%,0)}' +
'.mld-mark{position:relative;width:76px;height:76px;animation:mldMark .7s cubic-bezier(.2,.9,.3,1) both}' +
'@keyframes mldMark{from{opacity:0;transform:translate3d(0,14px,0) scale(.9)}to{opacity:1;transform:none}}' +
'.mld-mark svg{width:100%;height:100%;display:block}' +
'.mld-box{fill:#fff;fill-opacity:0;stroke:#fff;stroke-width:1.5;stroke-dasharray:1;stroke-dashoffset:1;animation:mldDraw .8s ease .1s forwards,mldFill .35s ease .75s forwards}' +
'@keyframes mldDraw{to{stroke-dashoffset:0}}@keyframes mldFill{to{fill-opacity:1;stroke-width:0}}' +
'.mld-hat{opacity:0;transform-origin:32px 40px;animation:mldHat .5s cubic-bezier(.2,.9,.3,1.4) .85s forwards}' +
'@keyframes mldHat{from{opacity:0;transform:translate3d(0,-10px,0) scale(.7)}to{opacity:1;transform:none}}' +
'.mld-word{font-weight:800;font-size:1.05rem;letter-spacing:.42em;text-indent:.42em;text-transform:uppercase;opacity:0;animation:mldUp .6s cubic-bezier(.2,.9,.3,1) .5s forwards}' +
'.mld-stat{display:flex;align-items:center;gap:10px;font-size:.78rem;color:#8d8d8d;font-weight:500;letter-spacing:.02em;height:18px;opacity:0;animation:mldUp .6s ease .7s forwards}' +
'.mld-stat i{width:7px;height:7px;border-radius:50%;background:#fff;animation:mldBlink 1s ease-in-out infinite}' +
'@keyframes mldBlink{50%{opacity:.25}}' +
'@keyframes mldUp{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}' +
'.mld-tip{transition:opacity .2s}.mld-tip.sw{opacity:0}' +
'.mld-foot{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:flex-end;padding:0 clamp(18px,4vw,44px) clamp(14px,3vw,34px);pointer-events:none}' +
'.mld-pct{font-weight:300;font-size:clamp(3.6rem,11vw,8.5rem);line-height:.9;letter-spacing:-.05em;font-variant-numeric:tabular-nums;color:#fff}' +
'.mld-pct small{font-size:.3em;letter-spacing:0;color:#6d6d6d;margin-left:4px;font-weight:500}' +
'.mld-url{font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:#6d6d6d;font-weight:600;padding-bottom:8px}' +
'.mch-reduce .mld *,.mch-reduce .mld *::before,.mch-reduce .mld *::after{animation-duration:.001ms!important;animation-delay:0s!important;transition-duration:.001ms!important}' +
'@media(prefers-reduced-motion:reduce){.mld *,.mld *::before,.mld *::after{animation-duration:.001ms!important;animation-delay:0s!important}}';

var TIPS = ['Starting the kitchen', 'Setting the table', 'Loading the menu', 'Warming the pans', 'Plating your page'];

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
  el.innerHTML =
    '<div class="mld-gridbg"></div><div class="mld-line"></div>' +
    '<div class="mld-center">' +
      '<div class="mld-mark"><svg viewBox="0 0 64 64">' +
        '<rect class="mld-box" x="1" y="1" width="62" height="62" rx="12" pathLength="1"/>' +
        '<g class="mld-hat" fill="#0a0a0a"><circle cx="20.5" cy="25" r="9.5"/><circle cx="32" cy="20" r="11.5"/><circle cx="43.5" cy="25" r="9.5"/><rect x="17" y="25" width="30" height="19"/><rect x="17" y="47" width="30" height="8" rx="2.5"/>' +
        '<path d="M26 33.5v9M38 33.5v9" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></g>' +
      '</svg></div>' +
      '<div class="mld-word">Master Chef Hub</div>' +
      '<div class="mld-stat"><i></i><span class="mld-tip">' + TIPS[0] + '</span></div>' +
    '</div>' +
    '<div class="mld-foot"><div class="mld-pct"><span class="mld-n">0</span><small>%</small></div><div class="mld-url">masterchefhub.com</div></div>';
  return el;
}

/* one run of the loading screen */
function Loader(minMs, loadedAlready) {
  var el = build();
  root.appendChild(el);
  root.classList.add('mld-lock');
  var t0 = Date.now(), p = 0, loaded = !!loadedAlready, done = false, tipI = 0, raf = 0;
  var line = el.querySelector('.mld-line'), num = el.querySelector('.mld-n'), tip = el.querySelector('.mld-tip');

  var tipTimer = setInterval(function () {
    if (done) return;
    tip.classList.add('sw');
    setTimeout(function () { tipI = Math.min(tipI + 1, TIPS.length - 2); tip.textContent = TIPS[tipI]; tip.classList.remove('sw'); }, 180);
  }, 700);

  function frame() {
    if (done) return;
    var t = Date.now() - t0;
    var target = loaded ? 100 : Math.min(90, 90 * (1 - Math.exp(-t / 1100)));
    if (loaded && t < minMs) target = Math.min(100, Math.max(target, 100 * t / minMs));
    p += (target - p) * 0.14;
    if (loaded && p > 99.3) p = 100;
    line.style.transform = 'scaleX(' + (p / 100).toFixed(4) + ')';
    num.textContent = Math.round(p);
    if (loaded && p >= 100 && t >= minMs) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }
  function finish() {
    if (done) return; done = true;
    clearInterval(tipTimer); cancelAnimationFrame(raf);
    line.style.transform = 'scaleX(1)'; num.textContent = '100'; tip.classList.remove('sw'); tip.textContent = 'Ready';
    setTimeout(function () { el.classList.add('out'); }, 180);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); root.classList.remove('mld-lock'); }, 1100);
  }
  raf = requestAnimationFrame(frame);
  return { markLoaded: function () { loaded = true; }, finish: finish, el: el };
}

/* ------------------------------------------------------------------ */
/* Simple loader used when moving between pages: just a progress bar and the word "Loading" */
var MCSS = '.mld2{position:fixed;inset:0;z-index:2147483000;background:#0a0a0a;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;opacity:0;transition:opacity .22s ease;-webkit-font-smoothing:antialiased}' +
'.mld2.on{opacity:1}' +
'.mld2 b{color:#fff;font-weight:600;font-size:.82rem;letter-spacing:.22em;text-transform:uppercase}' +
'.mld2 s{display:block;width:min(220px,60vw);height:3px;border-radius:3px;background:#262626;overflow:hidden}' +
'.mld2 s i{display:block;height:100%;width:0;background:#fff;border-radius:3px;transition:width .3s ease}' +
'html.mld2-lock,html.mld2-lock body{overflow:hidden!important}';
var mini = null;
function showMini() {
  if (mini) return mini;
  var st = document.createElement('style'); st.id = 'mld2css'; st.textContent = MCSS; (document.head || root).appendChild(st);
  var el = document.createElement('div'); el.className = 'mld2'; el.id = 'mchld2'; el.setAttribute('role', 'status');
  el.innerHTML = '<b>Loading</b><s><i></i></s>';
  root.appendChild(el); root.classList.add('mld2-lock');
  var bar = el.querySelector('i'), p = 8, t0 = Date.now(), timer = 0, fin = false;
  requestAnimationFrame(function () { el.classList.add('on'); bar.style.width = p + '%'; });
  timer = setInterval(function () { if (fin) return; p += (90 - p) * 0.12; bar.style.width = p.toFixed(1) + '%'; }, 120);
  mini = {
    finish: function () {
      if (fin) return; fin = true; clearInterval(timer);
      var wait = Math.max(0, 420 - (Date.now() - t0));
      setTimeout(function () {
        bar.style.width = '100%';
        setTimeout(function () { el.classList.remove('on'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); root.classList.remove('mld2-lock'); mini = null; }, 260); }, 180);
      }, wait);
    }
  };
  return mini;
}

var pageLoaded = document.readyState === 'complete';
var run = null;
var MAX_WAIT = 9000;

if (S.loader !== false) {
  if (fresh) {
    if (!pageLoaded) run = Loader(S.loaderFast ? 700 : 1600, false);
  } else if (!pageLoaded) {
    run = showMini();            /* arriving from another page of the site */
  }
  if (!pageLoaded) {
    window.addEventListener('load', function () { pageLoaded = true; if (run) run.markLoaded ? run.markLoaded() : run.finish(); });
    setTimeout(function () {
      if (pageLoaded) return;
      window.__mchSlow = true;
      try { window.dispatchEvent(new CustomEvent('mch:slowload')); } catch (e) {}
      pageLoaded = true; if (run) run.markLoaded ? run.markLoaded() : run.finish();   /* never trap the visitor */
    }, MAX_WAIT);
  }
  /* leaving: show the same simple loader as soon as a link to another page of the site is clicked */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || /^(mailto|tel|javascript):/i.test(a.getAttribute('href'))) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    setTimeout(function () { if (!e.defaultPrevented || true) showMini(); }, 60);
  }, false);
  window.addEventListener('pageshow', function (e) { if (e.persisted && mini) mini.finish(); });
}

window.MCHLoader = { mini: showMini };
})();