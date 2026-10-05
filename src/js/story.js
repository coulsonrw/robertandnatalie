// Our Story timeline: fills chapter markers as they enter view and grows the
// gold rail. Without JS, or with prefers-reduced-motion, chapters render fully
// visible (CSS default). No inline style attributes — CSSOM custom properties
// are allowed under style-src 'self'.
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var chapters = [].slice.call(document.querySelectorAll('.chapter'));
  var timeline = document.querySelector('.timeline');
  if (!chapters.length) return;
  root.classList.add('reveal');

  if (!('IntersectionObserver' in window)) {
    chapters.forEach(function (c) { c.classList.add('is-seen'); });
    return;
  }

  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-seen'); seen.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -25% 0px' });
  chapters.forEach(function (c) { seen.observe(c); });

  if (!timeline || reduce.matches) return;

  var ticking = false;
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  function frame() {
    ticking = false;
    var r = timeline.getBoundingClientRect(), vh = window.innerHeight;
    timeline.style.setProperty('--tp', Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height)).toFixed(3));
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  queue();
})();
