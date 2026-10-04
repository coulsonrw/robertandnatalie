// Navigation and small progressive enhancements. Everything works without this file.
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  var nav = document.querySelector('.site-nav');
  var toggle = nav && nav.querySelector('.nav-toggle');
  var menu = nav && nav.querySelector('.nav-menu');

  if (header) {
    var setHeaderHeight = function () {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    };
    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);
  }

  if (toggle && menu) {
    var text = toggle.querySelector('.nav-toggle-text');
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (text) text.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !header.contains(e.target)) setOpen(false);
    });
    var mq = window.matchMedia('(min-width: 768px)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { setOpen(false); });
  }

  // Keep keyboard focus in step with same-page anchor navigation.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id && document.getElementById(id);
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
})();

// Entry experience: sealed envelope → opened invitation → site with the invitation docked
// bottom-left, re-openable in a dialog. Skippable, keyboard operable, and static under
// reduced motion (PRD HOME-03). Without JavaScript the invitation simply sits at the top of the page.
(function () {
  'use strict';
  var card = document.getElementById('invitation-card');
  var entry = document.getElementById('entry');
  var site = document.getElementById('site');
  var keepsake = document.getElementById('keepsake');
  var dialog = document.getElementById('invitation-dialog');
  if (!card || !entry || !site || !keepsake || !dialog) return;

  var envelope = document.getElementById('envelope');
  var scene = document.getElementById('entry-scene');
  var openStage = document.getElementById('entry-open');
  var slots = {
    envelope: document.getElementById('envelope-slot'),
    open: document.getElementById('entry-card-slot'),
    keepsake: document.getElementById('keepsake-slot'),
    dialog: document.getElementById('dialog-slot'),
    inline: document.getElementById('invitation'),
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motion = function () { return !reduceMotion.matches; };
  var STORAGE_KEY = 'rn.entered';
  var state = 'inline';
  var busy = false;

  var SKIP_KEY = 'rn.skipIntro'; // set when a guest skips the opening animation; later openings this session are instant
  function storage(op, value, key) {
    try { return op === 'get' ? window.sessionStorage.getItem(key || STORAGE_KEY) : window.sessionStorage.setItem(key || STORAGE_KEY, value); } catch (e) { return null; }
  }

  function afterTransition(el, prop, ms, cb) {
    if (!motion()) { cb(); return; }
    var done = false;
    var finish = function () { if (done) return; done = true; el.removeEventListener('transitionend', onEnd); cb(); };
    var onEnd = function (e) { if (e.target === el && (!prop || e.propertyName === prop)) finish(); };
    el.addEventListener('transitionend', onEnd);
    setTimeout(finish, ms + 80);
  }

  // Move the card to a new parent, animating from its old screen position (FLIP).
  var flipToken = 0; // a newer move (or a skip) supersedes an unfinished one
  function flipMove(newParent, cb) {
    var token = ++flipToken;
    var first = card.getBoundingClientRect();
    var wasHidden = isHidden(card);
    newParent.appendChild(card);
    // No glide to or from a place the guest cannot see (the keepsake is parked out of view on phones).
    if (!motion() || first.width === 0 || wasHidden || isHidden(card)) { if (cb) cb(); return; }
    var last = card.getBoundingClientRect();
    var parentScale = newParent.offsetWidth ? newParent.getBoundingClientRect().width / newParent.offsetWidth : 1;
    var sx = first.width / last.width;
    var dx = (first.left - last.left) / parentScale;
    var dy = (first.top - last.top) / parentScale;
    document.body.classList.add('is-animating');
    card.classList.add('card-moving');
    card.style.transition = 'none';
    card.style.transformOrigin = 'top left';
    card.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + sx + ')';
    card.getBoundingClientRect();
    requestAnimationFrame(function () {
      card.style.transition = 'transform 0.75s cubic-bezier(0.2, 0.7, 0.2, 1)';
      card.style.transform = '';
      afterTransition(card, 'transform', 750, function () {
        if (token !== flipToken) return;
        card.style.transition = '';
        card.style.transform = '';
        card.style.transformOrigin = '';
        card.classList.remove('card-moving');
        document.body.classList.remove('is-animating');
        if (cb) cb();
      });
    });
  }

  function isHidden(el) { return getComputedStyle(el).visibility === 'hidden'; }
  function isShown(el) { return !!el && document.contains(el) && el.getClientRects().length > 0 && !isHidden(el); }

  // The keepsake floats in the left gutter (review P2 #6). Below 1256px the gutter is too narrow and the
  // stylesheet parks it out of view ("Invitation" is in the menu instead); above that it is sized to the
  // gutter so it never covers the text column: 110px wide from about 1300px, smaller just above 1256px.
  var contentRef = document.querySelector('#main .section .container');
  var keepsakeTarget = 110;
  function updateKeepsakeTarget() {
    var room = 110;
    if (contentRef && contentRef.getClientRects().length) {
      room = Math.floor(contentRef.getBoundingClientRect().left + (parseFloat(getComputedStyle(contentRef).paddingLeft) || 0) - 24);
    }
    keepsakeTarget = Math.max(64, Math.min(110, room));
    keepsake.classList.toggle('is-compact', keepsakeTarget < 100);
  }

  function sizeKeepsake() {
    updateKeepsakeTarget();
    var scale = slots.keepsake;
    var width = scale.offsetWidth;
    var height = card.offsetHeight;
    if (!width || !height) return;
    var k = Math.min(keepsakeTarget / width, (keepsakeTarget * 160 / 110) / height);
    scale.style.transform = 'scale(' + k + ')';
    keepsake.style.width = Math.round(width * k) + 'px';
    keepsake.style.height = Math.round(height * k) + 'px';
  }

  // Lay the card out at its page width inside the envelope, scaled so it sits behind the
  // pocket and rises to show its upper part when the flap opens.
  function sizeEnvelopeCard() {
    var lift = slots.envelope;
    var W = envelope.offsetWidth;
    var H = envelope.offsetHeight;
    if (!W || !lift.offsetWidth) return;
    var k = (0.58 * W) / lift.offsetWidth;
    lift.style.setProperty('--lift-scale', k.toFixed(4));
    lift.style.setProperty('--lift-rise', '-' + Math.round(1.1 * H) + 'px');
    lift.style.top = Math.round(0.7 * H + 0.6 * H) + 'px';
  }

  var skipLink = document.querySelector('.skip-link');
  var namesHeading = document.getElementById('invitation-title');
  function setState(next) {
    state = next;
    document.body.setAttribute('data-entry-state', next);
    var inEntry = next === 'closed' || next === 'open';
    // While the site is hidden, the global skip link enters the site instead of pointing at hidden content,
    // and the invitation heading is the page's level-one heading.
    if (skipLink) { if (inEntry) skipLink.setAttribute('data-action', 'enter'); else skipLink.removeAttribute('data-action'); }
    if (namesHeading) { namesHeading.setAttribute('role', 'heading'); namesHeading.setAttribute('aria-level', inEntry ? '1' : '2'); }
  }

  function dock(animate) {
    keepsake.hidden = false;
    card.setAttribute('aria-hidden', 'true');
    var finish = function () { sizeKeepsake(); };
    if (animate) { flipMove(slots.keepsake, finish); sizeKeepsake(); } else { slots.keepsake.appendChild(card); finish(); }
    setState('site');
  }

  function showSite() {
    site.hidden = false;
    site.removeAttribute('inert');
    document.body.classList.remove('is-entry');
    slots.inline.classList.add('is-empty');
  }

  function focusHero() {
    var h = document.getElementById('hero-title');
    if (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  function startClosed() {
    document.body.classList.add('is-entry');
    site.hidden = true;
    site.setAttribute('inert', '');
    slots.inline.classList.add('is-empty');
    slots.envelope.appendChild(card);
    entry.hidden = false;
    setState('closed');
    sizeEnvelopeCard();
  }

  // Opening sequence (about 1.6s). While it runs, a visible "Skip animation" button, Escape, or any tap or
  // click on the envelope jumps straight to the open invitation (review P2 #7). A skip is remembered for
  // the session (sessionStorage rn.skipIntro), so the envelope opens instantly from then on. Under
  // prefers-reduced-motion the envelope is never animated (the invitation is shown open on load).
  var skipAnim = document.getElementById('entry-skip-animation');
  var openRun = 0;
  function opening() { return document.body.classList.contains('is-opening'); }

  function finishOpen() {
    document.body.classList.remove('is-opening');
    if (skipAnim) skipAnim.hidden = true;
    scene.hidden = true;
    scene.classList.remove('is-fading');
    openStage.hidden = false;
    busy = false;
    setState('open');
    card.setAttribute('tabindex', '-1');
    card.focus({ preventScroll: true });
  }

  // Jump to the open invitation with nothing moving.
  function openNow() {
    openRun++;
    flipToken++;
    document.body.classList.add('is-skipping');
    card.style.transition = '';
    card.style.transform = '';
    card.style.transformOrigin = '';
    card.classList.remove('card-moving');
    document.body.classList.remove('is-animating');
    envelope.classList.add('is-open');
    document.getElementById('seal').setAttribute('aria-expanded', 'true');
    slots.open.appendChild(card);
    finishOpen();
    requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.remove('is-skipping'); }); });
  }

  function skipOpening() {
    if (!opening()) return;
    storage('set', '1', SKIP_KEY);
    openNow();
  }

  function openEnvelope() {
    if (busy || state !== 'closed') return;
    if (!motion() || storage('get', null, SKIP_KEY) === '1') { openNow(); return; }
    busy = true;
    var run = ++openRun;
    var sealHadFocus = document.activeElement === document.getElementById('seal');
    document.body.classList.add('is-opening');
    if (skipAnim) { skipAnim.hidden = false; if (sealHadFocus) skipAnim.focus({ preventScroll: true }); }
    envelope.classList.add('is-open');
    document.getElementById('seal').setAttribute('aria-expanded', 'true');
    afterTransition(slots.envelope, 'transform', 800, function () {
      if (run !== openRun) return;
      openStage.hidden = false;
      scene.classList.add('is-fading');
      flipMove(slots.open, function () {
        if (run !== openRun) return;
        finishOpen();
      });
    });
  }

  function enterSite() {
    if (busy) return;
    busy = true;
    storage('set', '1');
    showSite();
    keepsake.hidden = false;
    card.removeAttribute('tabindex');
    card.setAttribute('aria-hidden', 'true');
    flipMove(slots.keepsake, function () {
      entry.hidden = true;
      busy = false;
      setState('site');
      sizeKeepsake();
      window.scrollTo(0, 0);
      focusHero();
    });
    sizeKeepsake();
  }

  // The dialog doubles as the invitation viewer (review P2 #3): "Enlarge text" (or a tap on the card)
  // lays the card out at up to the artwork's native 1122px width, so its live text reads at about
  // 17-28px; the slot scrolls in both directions to pan. The artwork itself is never altered.
  var zoomBtn = dialog.querySelector('[data-action="zoom-invitation"]');
  var dialogReturn = 'site';
  var dialogOpener = null;

  function setZoom(on, point) {
    var before = card.getBoundingClientRect();
    var fx = point && before.width ? (point.x - before.left) / before.width : 0.5;
    var fy = point && before.height ? (point.y - before.top) / before.height : 0;
    dialog.classList.toggle('is-zoomed', on);
    if (zoomBtn) zoomBtn.textContent = on ? 'Fit to screen' : 'Enlarge text';
    var slot = slots.dialog;
    if (!on) { slot.scrollLeft = 0; return; }
    // Keep the tapped point (or the card's centre line) where it was on screen.
    var after = card.getBoundingClientRect();
    slot.scrollLeft += (after.left + fx * after.width) - (point ? point.x : window.innerWidth / 2);
    if (point) slot.scrollTop += (after.top + fy * after.height) - point.y;
  }

  function openDialog(zoom) {
    if (busy || (state !== 'site' && state !== 'open')) return;
    busy = true;
    dialogReturn = state;
    dialogOpener = document.activeElement;
    card.removeAttribute('aria-hidden');
    card.removeAttribute('tabindex');
    dialog.classList.toggle('is-zoomed', !!zoom);
    if (zoomBtn) zoomBtn.textContent = zoom ? 'Fit to screen' : 'Enlarge text';
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    flipMove(slots.dialog, function () {
      busy = false;
      setState('dialog');
      if (zoom) { slots.dialog.scrollLeft = (slots.dialog.scrollWidth - slots.dialog.clientWidth) / 2; }
      var close = dialog.querySelector('[data-action="close-invitation"]');
      if (close) close.focus();
    });
  }

  function closeDialog() {
    if (busy || state !== 'dialog') return;
    busy = true;
    var back = dialogReturn === 'open' ? slots.open : slots.keepsake;
    if (dialogReturn !== 'open') card.setAttribute('aria-hidden', 'true');
    flipMove(back, function () {
      if (dialog.open) dialog.close(); else dialog.removeAttribute('open');
      setZoom(false);
      busy = false;
      setState(dialogReturn);
      if (dialogReturn === 'open') card.setAttribute('tabindex', '-1');
      else sizeKeepsake();
      returnFocus(dialogOpener);
    });
  }

  // Focus goes back to whatever opened the dialog if it is still visible; otherwise to the keepsake.
  // Fallbacks: the keepsake, then (on phones, where it is parked) the menu button, then the hero heading.
  function returnFocus(el) {
    var candidates = state === 'open' ? [el, card] : [el, keepsake.querySelector('.keepsake-btn'), document.querySelector('.nav-toggle'), document.getElementById('hero-title')];
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c && c !== document.body && isShown(c)) {
        if (c.id === 'hero-title' && !c.hasAttribute('tabindex')) c.setAttribute('tabindex', '-1');
        c.focus();
        return;
      }
    }
  }

  // Decide the starting state: the sealed envelope for a fresh visit, the site for deep links,
  // the /celebration route, or a return within the same browser session.
  var params = new URLSearchParams(window.location.search);
  var hashTarget = window.location.hash && window.location.hash.length > 1 && document.getElementById(window.location.hash.slice(1));
  var start = 'closed';
  if (params.get('envelope') === '1') start = 'closed';
  else if (document.body.getAttribute('data-start') === 'site' || hashTarget || storage('get') === '1') start = 'site';

  if (start === 'site') {
    showSite();
    dock(false);
    if (window.location.hash === '#invitation') { setTimeout(function () { openDialog(false); }, 0); }
    else if (hashTarget) { hashTarget.scrollIntoView(); }
  } else if (!motion()) {
    // Reduced motion: skip the sealed envelope and show the invitation directly (equivalent static rendering).
    document.body.classList.add('is-entry');
    site.hidden = true;
    site.setAttribute('inert', '');
    slots.inline.classList.add('is-empty');
    envelope.classList.add('is-open');
    scene.hidden = true;
    openStage.hidden = false;
    slots.open.appendChild(card);
    entry.hidden = false;
    setState('open');
  } else {
    startClosed();
  }

  document.addEventListener('click', function (e) {
    if (opening()) {
      // Any click or tap during the opening skips it; "Skip to the wedding details" then carries on into the site.
      skipOpening();
      var go = e.target.closest('[data-action="enter"]');
      if (!go) { e.preventDefault(); return; }
    }
    var inv = e.target.closest('a[href="#invitation"], a[href$="#invitation"]');
    if (inv && state === 'site') { e.preventDefault(); openDialog(false); return; }
    var t = e.target.closest('[data-action], #seal, #invitation-card');
    if (!t) return;
    if (t.id === 'seal') { openEnvelope(); return; }
    if (t.id === 'invitation-card' && state === 'open') { openDialog(true); return; }
    if (t.id === 'invitation-card' && state === 'dialog') { if (!busy) setZoom(!dialog.classList.contains('is-zoomed'), { x: e.clientX, y: e.clientY }); return; }
    var action = t.getAttribute('data-action');
    if (action === 'enter') { if (t.tagName === 'A') e.preventDefault(); if (state === 'closed') { envelope.classList.add('is-open'); slots.open.appendChild(card); scene.hidden = true; openStage.hidden = false; setState('open'); } enterSite(); }
    else if (action === 'view-invitation') openDialog(false);
    else if (action === 'enlarge-invitation') openDialog(true);
    else if (action === 'zoom-invitation') { if (!busy) setZoom(!dialog.classList.contains('is-zoomed')); }
    else if (action === 'close-invitation') closeDialog();
  });
  document.addEventListener('keydown', function (e) {
    if (opening() && (e.key === 'Escape' || e.key === 'Esc')) { e.preventDefault(); skipOpening(); }
  });
  card.addEventListener('keydown', function (e) {
    if (state === 'open' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDialog(true); }
  });
  dialog.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(); });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) closeDialog(); });
  window.addEventListener('resize', function () { if (state === 'site') sizeKeepsake(); if (state === 'closed') sizeEnvelopeCard(); });
})();
