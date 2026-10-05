// Our Story: chapter markers, gold rail, and the Ch2–6 scroll-sketch → colour reveal.
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
