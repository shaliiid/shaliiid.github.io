/* ============================================================
   Shalini Daniel — Portfolio interactions
   Loading screen + custom cursor + scroll-spy for the side rail
   ============================================================ */

(function initLoader(){
  var loader = document.querySelector('.loader');
  if (!loader) return;

  document.body.classList.add('loader-active');
  var start = Date.now();
  var minVisible = 500;   // keep it on screen at least this long, feels intentional not flickery
  var hardCap = 1800;     // never block longer than this even if 'load' is slow
  var done = false;

  function hide(){
    if (done) return;
    done = true;
    var wait = Math.max(0, minVisible - (Date.now() - start));
    setTimeout(function(){
      loader.classList.add('is-hidden');
      document.body.classList.remove('loader-active');
      setTimeout(function(){
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 550);
    }, wait);
  }

  if (document.readyState === 'complete') {
    hide();
  } else {
    window.addEventListener('load', hide);
    setTimeout(hide, hardCap);
  }
})();

(function initCustomCursor(){
  // Skip on touch devices — only enable for precise pointers (mouse/trackpad)
  if (!window.matchMedia('(any-pointer: fine)').matches) return;

  var dot = document.createElement('div');
  dot.className = 'custom-cursor';
  var label = document.createElement('div');
  label.className = 'custom-cursor-label';
  label.textContent = 'SD';

  document.body.appendChild(dot);
  document.body.appendChild(label);
  document.body.classList.add('has-custom-cursor');

  var mouseX = 0, mouseY = 0;
  var labelX = 0, labelY = 0;
  var hasMoved = false;

  window.addEventListener('mousemove', function(e){
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px)';
    if (!hasMoved) {
      hasMoved = true;
      dot.classList.add('is-visible');
      labelX = mouseX;
      labelY = mouseY;
    }
  });

  function raf(){
    labelX += (mouseX - labelX) * 0.16;
    labelY += (mouseY - labelY) * 0.16;
    label.style.transform = 'translate(' + (labelX + 16) + 'px,' + (labelY + 16) + 'px)';
    requestAnimationFrame(raf);
  }
  raf();

  function bindHoverTargets(){
    var targets = document.querySelectorAll('a, button, .project-card, .related-card, .img-box');
    targets.forEach(function(el){
      el.addEventListener('mouseenter', function(){
        dot.classList.add('is-active');
        if (el.closest('.project-card') || el.closest('.related-card')) {
          label.textContent = 'View';
          label.classList.add('is-visible');
        }
      });
      el.addEventListener('mouseleave', function(){
        dot.classList.remove('is-active');
        label.classList.remove('is-visible');
        label.textContent = 'SD';
      });
    });
  }
  bindHoverTargets();
})();

(function initScrollSpy(){
  var links = document.querySelectorAll('.side-rail a');
  if (!links.length) return;

  var sections = [];
  links.forEach(function(link){
    var target = document.querySelector(link.getAttribute('href'));
    if (target) sections.push({ link: link, el: target });
  });
  if (!sections.length) return;

  var observer = new IntersectionObserver(function(entries){
    var visibleEls = entries.filter(function(e){ return e.isIntersecting; }).map(function(e){ return e.target; });
    if (!visibleEls.length) return;

    // Pick whichever visible section comes first in top-to-bottom document order,
    // so the highlighted link is always deterministic even if several intersect at once.
    var chosen = null;
    for (var i = 0; i < sections.length; i++) {
      if (visibleEls.indexOf(sections[i].el) !== -1) { chosen = sections[i]; break; }
    }
    if (chosen) {
      links.forEach(function(l){ l.classList.remove('active'); });
      chosen.link.classList.add('active');
    }
  }, { rootMargin: '-35% 0px -50% 0px', threshold: 0 });

  sections.forEach(function(s){ observer.observe(s.el); });
})();

(function initThemeToggle(){
  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', function(){
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      try { localStorage.setItem('theme', 'light'); } catch (e) {}
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      try { localStorage.setItem('theme', 'dark'); } catch (e) {}
    }
  });
})();

(function initLocalClock(){
  var el = document.getElementById('localTime');
  if (!el) return;

  var TZ = 'America/New_York';

  function tick(){
    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: TZ });
    var tz = '';
    try {
      var part = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'short' }).formatToParts(now).find(function(p){ return p.type === 'timeZoneName'; });
      if (part) tz = part.value;
    } catch (e) {}
    el.textContent = 'My local time  ' + timeStr + (tz ? ' ' + tz : '');
  }
  tick();
  setInterval(tick, 1000);
})();

(function initHeroParallax(){
  var hero = document.querySelector('.hero');
  if (!hero) return;
  // No pointer-type guard here on purpose: this only ever does anything in
  // response to an actual 'mousemove' event, which simply won't fire on
  // touch devices — so there's nothing to gate, and one less thing that can
  // silently disable the effect if a browser misreports its pointer type.

  // Convert HSL to an rgba() string in JS so the CSS only ever needs a single
  // plain color value — some browsers don't reliably repaint gradients when a
  // custom property is nested inside hsl() which is itself nested inside
  // radial-gradient(), so we resolve the color fully before handing it to CSS.
  function hslToRgba(h, s, l, a){
    s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60)      { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  hero.addEventListener('mousemove', function(e){
    var rect = hero.getBoundingClientRect();
    var mx = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    var my = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    hero.style.setProperty('--mx', mx + '%');
    hero.style.setProperty('--my', my + '%');

    // Sweep the spotlight hue across a pleasant range as the cursor moves,
    // so hovering different spots visibly shifts the glow's color.
    var hue = Math.round(160 + (mx / 100) * 200 - (my / 100) * 60);
    hue = ((hue % 360) + 360) % 360;
    hero.style.setProperty('--spotlight-color', hslToRgba(hue, 85, 60, 0.65));
  });

  hero.addEventListener('mouseenter', function(){ hero.classList.add('is-active'); });
  hero.addEventListener('mouseleave', function(){ hero.classList.remove('is-active'); });
})();
