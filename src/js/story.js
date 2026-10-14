// Our Story: chapter markers, gold rail, and the Ch1–6 scroll-sketch → colour reveal.
// Modes (html data-draw="scrub|once", or ?draw=): scrub follows the scrollbar; once draws
// when seen and stays drawn. Sketch SVGs are fetched into .sketch[data-sketch] so the
// homepage HTML stays the colour still (the no-JS / reduced-motion resting state).
// Without JS, or with prefers-reduced-motion, every frame is the finished colour photo.
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var q = new URLSearchParams(location.search).get('draw');
  var mode = q === 'once' || q === 'scrub' ? q : (root.getAttribute('data-draw') || 'scrub');
  root.classList.add('draw-' + mode, 'reveal');
  var chapters = [].slice.call(document.querySelectorAll('.chapter'));
  var sketches = [].slice.call(document.querySelectorAll('.sketch:not(.is-empty)'));
  var timeline = document.querySelector('.timeline');

  if (!('IntersectionObserver' in window)) {
    chapters.forEach(function (c) { c.classList.add('is-seen', 'is-drawn'); });
    return;
  }

  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-seen'); seen.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -25% 0px' });
  chapters.forEach(function (c) { seen.observe(c); });

  if (reduce.matches) return;

  // Scroll-sketch → colour. The colour photo (and the line overlay leaving it) finishes
  // when the chapter title's top edge meets the bottom of the sticky nav. Nav height is
  // measured from the header, not a fixed pixel offset, so it holds on phones and desktops.
  // The fade keeps its previous length (photo 12% of the sketch's cover travel, lines 8%).
  var PHOTO_SPAN = 0.12;
  var INK_SPAN = 0.08;
  function layoutTop(el) {
    var y = 0;
    for (var node = el; node; node = node.offsetParent) y += node.offsetTop;
    return y;
  }
  function tuneColour(sketch) {
    var chapter = sketch.closest('.chapter');
    var title = chapter && chapter.querySelector('.chapter-head h2, .chapter-head h3');
    var photo = sketch.querySelector('.sketch-photo');
    if (!title || !photo) return;
    var header = document.querySelector('.site-header');
    var navBottom = header ? header.getBoundingClientRect().height : 0;
    var sr = sketch.getBoundingClientRect();
    var span = window.innerHeight + sr.height;
    if (!(span > 0)) return;
    // Layout tops, not getBoundingClientRect: the chapter text slides in with a
    // transform, and that transform is gone by the time the title reaches the nav.
    // One pixel early so percentage rounding cannot leave a sliver of the sketch
    // on the frame where the title's top meets the nav.
    var end = (window.innerHeight - navBottom - (layoutTop(sketch) - layoutTop(title)) - 1) / span;
    if (end < 0) end = 0;
    if (end > 1) end = 1;
    var photoStart = end - PHOTO_SPAN;
    if (photoStart < 0) photoStart = 0;
    var inkStart = end - INK_SPAN;
    if (inkStart < 0) inkStart = 0;
    if (end - photoStart < 0.0001) photoStart = Math.max(0, end - 0.0001);
    if (end - inkStart < 0.0001) inkStart = Math.max(0, end - 0.0001);
    sketch.style.setProperty('--colour-start', photoStart.toFixed(4));
    sketch.style.setProperty('--colour-end', end.toFixed(4));
    sketch.style.setProperty('--ink-start', inkStart.toFixed(4));
    function pct(n) { return (Math.floor(n * 10000) / 100).toFixed(2) + '%'; }
    var endPct = pct(end);
    photo.style.animationRange = 'cover ' + pct(photoStart) + ' cover ' + endPct;
    var svg = sketch.querySelector('.sketch-svg');
    if (svg) svg.style.animationRange = 'cover ' + pct(inkStart) + ' cover ' + endPct;
  }
  function tuneAll() { sketches.forEach(tuneColour); }
  tuneAll();
  // Title size changes when webfonts finish, and the nav height changes with the viewport.
  // Both move the scroll point where the title meets the nav, so measure again then.
  window.addEventListener('resize', tuneAll);
  window.addEventListener('load', function () { requestAnimationFrame(function () { requestAnimationFrame(tuneAll); }); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { requestAnimationFrame(function () { requestAnimationFrame(tuneAll); }); });
  }
  if (window.ResizeObserver) {
    var header = document.querySelector('.site-header');
    var ro = new ResizeObserver(function () { tuneAll(); });
    if (header) ro.observe(header);
    sketches.forEach(function (s) { ro.observe(s); });
    chapters.forEach(function (c) {
      var head = c.querySelector('.chapter-head');
      if (head) ro.observe(head);
    });
  }

  function startDraw() {
    var ready = sketches.filter(function (s) { return s.classList.contains('is-ready'); });
    if (mode === 'once') {
      var drawIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.closest('.chapter').classList.add('is-drawn');
            drawIO.unobserve(e.target);
          }
        });
      }, { threshold: 0.35 });
      ready.forEach(function (s) { drawIO.observe(s); });
      return;
    }
    var forceJs = new URLSearchParams(location.search).get('fallback') === '1';
    if (!forceJs && window.CSS && CSS.supports && CSS.supports('animation-timeline: view()')) return;
    root.classList.add('js-progress');
    var active = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) active.add(e.target);
        else { active.delete(e.target); update1(e.target); }
      });
      queue();
    }, { rootMargin: '25% 0px' });
    ready.forEach(function (s) { io.observe(s); });
    var ticking = false;
    function queue() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    function update1(el) {
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      el.style.setProperty('--p', p.toFixed(3));
    }
    function frame() {
      ticking = false;
      if (reduce.matches) return;
      active.forEach(update1);
      if (timeline) {
        var r = timeline.getBoundingClientRect(), vh = window.innerHeight;
        timeline.style.setProperty('--tp', Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height)).toFixed(3));
      }
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    queue();
  }

  function injectSketch(el, text) {
    var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    var svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return false;
    svg.setAttribute('class', 'sketch-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    el.appendChild(document.importNode(svg, true));
    tuneColour(el);
    el.classList.add('is-ready');
    return true;
  }

  var pending = sketches.filter(function (s) { return s.getAttribute('data-sketch'); });
  if (!pending.length) { startDraw(); return; }
  var left = pending.length;
  pending.forEach(function (el) {
    fetch(el.getAttribute('data-sketch'), { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('sketch');
      return r.text();
    }).then(function (text) { injectSketch(el, text); }).catch(function () { /* colour still remains */ }).then(function () {
      left -= 1;
      if (!left) startDraw();
    });
  });
})();
