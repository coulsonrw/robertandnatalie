// RSVP front end. Talks to a small server-side RSVP API (see docs/RSVP_API_CONTRACT.md) through an
// adapter, or to an in-page mock with synthetic guests when opened as /rsvp.html?preview=1.
// Static hosting cannot authorize households or store responses, so nothing here implies a backend
// exists: the live adapter is only used when the page configuration names an API base URL.
(function () {
  'use strict';
  var cfgEl = document.getElementById('rsvp-config');
  var appEl = document.getElementById('rsvp-app');
  var staticEl = document.getElementById('rsvp-static');
  if (!cfgEl || !appEl) return;
  var cfg = JSON.parse(cfgEl.textContent);
  var params = new URLSearchParams(window.location.search);
  var isPreview = params.get('preview') === '1' && cfg.allowPreview && cfg.preview;
  var mode = isPreview ? 'preview' : cfg.mode;
  if (mode !== 'live' && mode !== 'preview') return;
  if (mode === 'live' && !cfg.apiBaseUrl) return;

  // ---------- helpers ----------
  function el(tag, attrs) {
    var n = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) append(n, arguments[i]);
    return n;
  }
  function append(parent, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(parent, c); }); return; }
    parent.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
  }
  function icon(id, cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', cls || 'icon');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#' + id);
    s.appendChild(u);
    return s;
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  function key(g, e) { return g + '|' + e; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function RsvpError(code, message, extra) { this.code = code; this.message = message || code; this.extra = extra || null; }
  RsvpError.prototype = Object.create(Error.prototype);

  var MESSAGES = {
    invalid_code: 'We could not find an invitation with that code. Please check the code on your invitation and try again.',
    invalid_session: 'Your session has ended. Please enter your invitation code again; anything you had entered is kept on this page.',
    conflict: 'This household’s response was updated from another device. The latest answers are shown below; please review them before saving.',
    closed: cfg.closedText,
    rate_limited: 'Too many attempts. Please wait a few minutes and try again.',
    network: 'We could not reach the RSVP service. Nothing has been lost. Please check your connection and try again.',
    validation: 'Some of the answers could not be accepted. Please review them and try again.',
    server_error: 'Something went wrong on our side. Nothing has been lost. Please try again in a moment.'
  };

  // ---------- adapters ----------
  function mockAdapter(preview) {
    var households = JSON.parse(JSON.stringify(preview.households || []));
    var stores = {};
    var current = null;
    function storeFor(hh) {
      if (!stores[hh.id]) stores[hh.id] = {
        revision: 0,
        responses: hh.entitlements.map(function (e) { return { guestId: e.guestId, eventId: e.eventId, status: 'pending', meal: null }; }),
        plusOneNames: {}, contactEmail: hh.contactEmail || '', notes: '', reference: null, submittedAt: null, seen: {}
      };
      return stores[hh.id];
    }
    function snapshot() {
      var hh = current; var store = storeFor(hh);
      return {
        household: {
          id: hh.id, label: hh.label, contactEmail: store.contactEmail,
          guests: hh.guests.map(function (g) { return { id: g.id, kind: g.kind, hostGuestId: g.hostGuestId || null, name: g.kind === 'plus-one' ? (store.plusOneNames[g.id] || null) : g.name }; })
        },
        entitlements: hh.entitlements,
        responses: store.responses.map(function (r) { return { guestId: r.guestId, eventId: r.eventId, status: r.status, meal: r.meal || null }; }),
        notes: store.notes, revision: store.revision, reference: store.reference, submittedAt: store.submittedAt,
        emailQueued: false, rsvp: { open: true, cutoffAt: cfg.cutoffAt }
      };
    }
    return {
      kind: 'preview',
      openSession: function (code) {
        return wait(350).then(function () {
          var c = String(code || '').trim().toUpperCase();
          var hh = households.filter(function (h) { return String(h.code).toUpperCase() === c; })[0];
          if (!hh) throw new RsvpError('invalid_code');
          current = hh; return snapshot();
        });
      },
      getSession: function () { return Promise.resolve(current ? snapshot() : null); },
      saveResponse: function (p) {
        return wait(500).then(function () {
          if (!current) throw new RsvpError('invalid_session');
          var hh = current; var store = storeFor(hh);
          if (store.seen[p.requestId]) return store.seen[p.requestId];
          if (p.revision !== store.revision) throw new RsvpError('conflict', '', { latest: snapshot() });
          p.responses.forEach(function (r) {
            var ok = hh.entitlements.some(function (e) { return e.guestId === r.guestId && e.eventId === r.eventId; });
            if (!ok || ['attending', 'declining'].indexOf(r.status) === -1) throw new RsvpError('validation');
            if (r.meal != null && (!cfg.mealChoices || cfg.mealChoices.eventId !== r.eventId || cfg.mealChoices.options.indexOf(r.meal) === -1)) throw new RsvpError('validation');
          });
          store.responses = store.responses.map(function (r) {
            var n = p.responses.filter(function (x) { return x.guestId === r.guestId && x.eventId === r.eventId; })[0];
            return n ? { guestId: r.guestId, eventId: r.eventId, status: n.status, meal: n.status === 'attending' ? (n.meal || null) : null } : r;
          });
          store.plusOneNames = Object.assign({}, p.plusOneNames || {});
          store.contactEmail = p.contactEmail || '';
          store.notes = p.notes || '';
          store.revision += 1;
          store.reference = store.reference || ('PREVIEW-' + uuid().replace(/-/g, '').slice(0, 6).toUpperCase());
          store.submittedAt = new Date().toISOString();
          var snap = snapshot(); store.seen[p.requestId] = snap; return snap;
        });
      },
      endSession: function () { current = null; return Promise.resolve(); }
    };
  }

  function httpAdapter(base) {
    base = base.replace(/\/$/, '');
    var STATUS = { 400: 'validation', 401: 'invalid_session', 403: 'invalid_code', 404: 'invalid_code', 409: 'conflict', 423: 'closed', 429: 'rate_limited' };
    function call(method, path, body) {
      var opts = { method: method, credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' } };
      if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
      return fetch(base + path, opts).catch(function () { throw new RsvpError('network'); }).then(function (res) {
        return res.text().then(function (t) {
          var data = null; try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
          if (res.ok) return data;
          var code = (data && data.error && data.error.code) || STATUS[res.status] || 'server_error';
          throw new RsvpError(code, data && data.error && data.error.message, data);
        });
      });
    }
    return {
      kind: 'live',
      openSession: function (code) { return call('POST', '/session', { code: code }); },
      getSession: function () { return call('GET', '/session').catch(function (e) { if (e.code === 'invalid_session' || e.code === 'invalid_code') return null; throw e; }); },
      saveResponse: function (p) { return call('PUT', '/response', p); },
      endSession: function () { return call('DELETE', '/session').catch(function () { return null; }); }
    };
  }

  var adapter = mode === 'preview' ? mockAdapter(cfg.preview) : httpAdapter(cfg.apiBaseUrl);

  // Private household links carry their credential in the URL fragment (#t=…) or query (?t=…).
  // It is read once, removed from the address bar immediately so it is not kept in history or
  // leaked through referrers, and only exchanged for a session when the guest presses the button
  // (a link-preview fetch must never consume it — PRD SEC-02, IA-02).
  var linkToken = null;
  (function readLinkToken() {
    var hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    var t = hashParams.get('t') || params.get('t');
    if (!t) return;
    linkToken = t;
    hashParams.delete('t');
    params.delete('t');
    var clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + (hashParams.toString() ? '#' + hashParams.toString() : '');
    try { window.history.replaceState(null, '', clean); } catch (e) { /* ignore */ }
  })();
  var eventById = {};
  cfg.events.forEach(function (e) { eventById[e.id] = e; });

  // ---------- state ----------
  var state = {
    step: 'access', session: null, answers: {}, plusOneNames: {}, contactEmail: '', notes: '', meals: {},
    requestId: null, busy: false, notice: null, errors: {}, focusHeading: false
  };
  var mealCfg = cfg.mealChoices && cfg.mealChoices.eventId && cfg.mealChoices.options && cfg.mealChoices.options.length ? cfg.mealChoices : null;
  function mealAsked(gid) { return !!mealCfg && state.answers[key(gid, mealCfg.eventId)] === 'attending'; }

  function loadSession(session, keepLocal) {
    var sameHousehold = keepLocal && state.session && state.session.household.id === session.household.id;
    var local = sameHousehold ? state.answers : {};
    var localNames = sameHousehold ? state.plusOneNames : {};
    state.session = session;
    state.answers = {};
    var localMeals = sameHousehold ? state.meals : {};
    state.meals = {};
    session.responses.forEach(function (r) { state.answers[key(r.guestId, r.eventId)] = r.status === 'pending' ? null : r.status; if (r.meal && mealCfg && r.eventId === mealCfg.eventId) state.meals[r.guestId] = r.meal; });
    Object.keys(localMeals).forEach(function (k) { if (localMeals[k]) state.meals[k] = localMeals[k]; });
    Object.keys(local).forEach(function (k) { if (local[k]) state.answers[k] = local[k]; });
    state.plusOneNames = {};
    session.household.guests.forEach(function (g) { if (g.kind === 'plus-one' && g.name) state.plusOneNames[g.id] = g.name; });
    Object.keys(localNames).forEach(function (k) { if (localNames[k]) state.plusOneNames[k] = localNames[k]; });
    if (!sameHousehold || !state.contactEmail) state.contactEmail = session.household.contactEmail || '';
    if (!sameHousehold || !state.notes) state.notes = session.notes || '';
  }
  function guests() { return state.session.household.guests; }
  function entitlementsFor(gid) { return state.session.entitlements.filter(function (x) { return x.guestId === gid; }).map(function (x) { return x.eventId; }); }
  function hostName(g) { var h = guests().filter(function (x) { return x.id === g.hostGuestId; })[0]; return h ? h.name : 'your household'; }
  function guestLabel(g) { return g.kind === 'plus-one' ? (state.plusOneNames[g.id] || ('Guest of ' + hostName(g))) : g.name; }
  function attendingAny(gid) { return entitlementsFor(gid).some(function (eid) { return state.answers[key(gid, eid)] === 'attending'; }); }
  function anyoneAttending() { return guests().some(function (g) { return attendingAny(g.id); }); }
  function rsvpOpen() {
    var r = state.session && state.session.rsvp;
    if (!r) return true;
    if (r.open === false) return false;
    if (r.cutoffAt && Date.now() > Date.parse(r.cutoffAt)) return false;
    return true;
  }
  function eventListLabel(gid) { return entitlementsFor(gid).map(function (eid) { return eventById[eid] ? eventById[eid].label : eid; }).join(' and '); }

  // ---------- rendering ----------
  var STEPS = [['invitees', 'Your invitation'], ['attendance', 'Attendance'], ['details', 'Details'], ['review', 'Review'], ['confirmation', 'Done']];
  var statusRegion = el('div', { class: 'status-region', role: 'status', 'aria-live': 'polite' });

  function setNotice(kind, text) {
    statusRegion.innerHTML = '';
    if (!text) return;
    statusRegion.appendChild(el('div', { class: 'status is-' + kind }, icon(kind === 'success' ? 'i-check' : kind === 'error' ? 'i-alert' : 'i-info'), el('p', { text: text })));
  }

  function contactNode(prefix) {
    var c = cfg.contact;
    var p = el('p', { class: 'muted' });
    append(p, prefix || 'If anything is wrong, please contact ');
    if (!c || (!c.email && !c.phone)) { append(p, cfg.couple + ' directly.'); return p; }
    if (c.email) append(p, el('a', { href: 'mailto:' + c.email }, icon('i-mail'), ' ' + c.email));
    if (c.email && c.phone) append(p, ' or ');
    if (c.phone) append(p, el('a', { href: 'tel:' + c.phone }, icon('i-phone'), ' ' + (c.phoneDisplay || c.phone)));
    append(p, '.');
    return p;
  }

  function stepper(current) {
    var idx = STEPS.map(function (s) { return s[0]; }).indexOf(current);
    return el('ol', { class: 'stepper', 'aria-label': 'Progress' }, STEPS.map(function (s, i) {
      return el('li', { class: i < idx ? 'is-done' : null, 'aria-current': i === idx ? 'step' : null }, s[1]);
    }));
  }

  function heading(text) { return el('h2', { text: text, tabindex: '-1', id: 'rsvp-step-heading' }); }
  function stepSection(name, children) { return el('section', { class: 'rsvp-step', 'data-step': name, 'aria-labelledby': 'rsvp-step-heading' }, children); }
  function busyButton(label, attrs) {
    attrs = attrs || {};
    attrs['aria-disabled'] = state.busy ? 'true' : null;
    attrs.disabled = state.busy ? true : null;
    return el('button', attrs, state.busy && attrs['data-busy-label'] ? attrs['data-busy-label'] : label);
  }

  function renderAccess() {
    if (linkToken) {
      var linkForm = el('form', { novalidate: true, onsubmit: onLinkSubmit },
        el('p', { text: 'You followed a personal invitation link. Press the button to open your household’s invitation.' }),
        el('div', { class: 'form-actions' }, busyButton('Open my invitation', { class: 'btn btn-primary', type: 'submit', 'data-action': 'open-link', 'data-busy-label': 'Opening…' })),
        el('p', { class: 'hint' }, 'Not you? ', el('button', { class: 'text-button', type: 'button', onclick: function () { linkToken = null; render(); } }, 'Enter an invitation code instead'), '.')
      );
      return stepSection('access', [heading('Open your invitation'), linkForm, contactNode('Having trouble? Please contact ')]);
    }
    var form = el('form', { novalidate: true, onsubmit: onAccessSubmit });
    append(form, el('div', { class: 'field' },
      el('label', { for: 'code', text: 'Invitation code' }),
      el('input', { class: 'input', id: 'code', name: 'code', type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', required: true, 'aria-describedby': 'code-hint' + (state.errors.code ? ' code-error' : ''), 'aria-invalid': state.errors.code ? 'true' : null, value: state.codeValue || '' }),
      el('p', { class: 'hint', id: 'code-hint' }, mode === 'preview' ? 'This is a preview with synthetic guests. Codes: ' + (cfg.preview.households || []).map(function (h) { return h.code; }).join(', ') + '.' : 'Your code is printed with your invitation. If you followed a personal link, you may not need it.'),
      state.errors.code ? el('p', { class: 'error-text', id: 'code-error' }, icon('i-alert'), el('span', { text: state.errors.code })) : null
    ));
    append(form, el('div', { class: 'form-actions' }, busyButton('Find my invitation', { class: 'btn btn-primary', type: 'submit', 'data-busy-label': 'Checking…' })));
    return stepSection('access', [heading('Find your invitation'), form, contactNode('Lost your code? Please contact ')]);
  }

  function renderInvitees() {
    var list = el('ul', { class: 'guest-list' }, guests().map(function (g) {
      return el('li', {}, el('span', { text: g.kind === 'plus-one' ? 'Guest of ' + hostName(g) + (state.plusOneNames[g.id] ? ' (' + state.plusOneNames[g.id] + ')' : '') : g.name }), el('span', { class: 'muted', text: 'Invited to: ' + eventListLabel(g.id) }));
    }));
    var actions = el('div', { class: 'form-actions' },
      el('button', { class: 'btn btn-tertiary', type: 'button', 'data-action': 'not-mine', onclick: onNotMine }, 'This is not my invitation'),
      el('button', { class: 'btn btn-primary', type: 'button', 'data-action': 'continue', onclick: function () { go('attendance'); } }, 'These are correct — continue')
    );
    return stepSection('invitees', [stepper('invitees'), heading(state.session.household.label), el('p', { text: 'Please confirm the people included in this invitation.' }), list, contactNode('If a name is wrong or someone is missing, please contact '), actions]);
  }

  function choice(name, value, label, checked, describedBy) {
    var id = 'c-' + name.replace(/[^a-z0-9]/gi, '_') + '-' + value;
    return el('div', { class: 'choice' },
      el('input', { type: 'radio', id: id, name: name, value: value, checked: checked ? true : null, 'aria-describedby': describedBy, onchange: function () { onAnswer(name, value); } }),
      el('label', { for: id }, icon(value === 'attending' ? 'i-check' : 'i-minus'), label)
    );
  }

  function renderAttendance() {
    var form = el('form', { novalidate: true, onsubmit: function (e) { e.preventDefault(); onAttendanceContinue(); } });
    guests().forEach(function (g) {
      var block = el('div', { class: 'guest-block' }, el('h3', { text: guestLabel(g) }));
      entitlementsFor(g.id).forEach(function (eid) {
        var ev = eventById[eid] || { label: eid, name: '', when: '' };
        var k = key(g.id, eid);
        var errId = 'err-' + k.replace(/[^a-z0-9]/gi, '_');
        var hasErr = !!state.errors[k];
        var fs = el('fieldset', { class: 'event-row' + (hasErr ? ' is-invalid' : ''), 'data-key': k },
          el('legend', {}, ev.label + ' — ' + ev.name, el('span', { class: 'muted', text: ' · ' + ev.shortWhen })),
          el('div', { class: 'choice-group' },
            choice(k, 'attending', 'Attending', state.answers[k] === 'attending', hasErr ? errId : null),
            choice(k, 'declining', 'Declining', state.answers[k] === 'declining', hasErr ? errId : null)
          ),
          el('p', { class: 'error-text', id: errId, hidden: hasErr ? null : true }, icon('i-alert'), el('span', { text: state.errors[k] || '' }))
        );
        append(block, fs);
      });
      if (g.kind === 'plus-one') {
        var nameId = 'plusone-' + g.id;
        var errKey = 'name:' + g.id;
        append(block, el('div', { class: 'field', hidden: attendingAny(g.id) ? null : true },
          el('label', { for: nameId, text: 'Guest’s name' }),
          el('input', { class: 'input', id: nameId, type: 'text', autocomplete: 'off', maxlength: '80', value: state.plusOneNames[g.id] || '', 'aria-invalid': state.errors[errKey] ? 'true' : null, 'aria-describedby': state.errors[errKey] ? nameId + '-error' : null, oninput: function (e) { state.plusOneNames[g.id] = e.target.value; } }),
          state.errors[errKey] ? el('p', { class: 'error-text', id: nameId + '-error' }, icon('i-alert'), el('span', { text: state.errors[errKey] })) : null
        ));
      }
      append(form, block);
    });
    append(form, el('div', { class: 'form-actions' },
      el('button', { class: 'btn btn-tertiary', type: 'button', 'data-action': 'back', onclick: function () { go('invitees'); } }, 'Back'),
      el('button', { class: 'btn btn-primary', type: 'submit', 'data-action': 'continue' }, 'Continue')
    ));
    return stepSection('attendance', [stepper('attendance'), heading('Will you attend?'), el('p', { text: 'Please answer for each person and each event. Responses can differ between the ceremony and the reception.' }), form]);
  }

  function renderDetails() {
    var form = el('form', { novalidate: true, onsubmit: function (e) { e.preventDefault(); onDetailsContinue(); } });
    append(form, el('div', { class: 'field' },
      el('label', { for: 'contactEmail', text: 'Contact email' }),
      el('input', { class: 'input', id: 'contactEmail', type: 'email', autocomplete: 'email', inputmode: 'email', required: true, value: state.contactEmail, 'aria-invalid': state.errors.contactEmail ? 'true' : null, 'aria-describedby': 'email-hint' + (state.errors.contactEmail ? ' email-error' : ''), oninput: function (e) { state.contactEmail = e.target.value; } }),
      el('p', { class: 'hint', id: 'email-hint', text: 'Used to confirm your response and reach you if plans change. Not shared with anyone else.' }),
      state.errors.contactEmail ? el('p', { class: 'error-text', id: 'email-error' }, icon('i-alert'), el('span', { text: state.errors.contactEmail })) : null
    ));
    if (mealCfg) {
      var mealEvent = eventById[mealCfg.eventId] || { label: mealCfg.eventId };
      var mealGuests = guests().filter(function (g) { return mealAsked(g.id); });
      if (mealGuests.length) {
        var fs = el('fieldset', { class: 'meal-group' }, el('legend', { text: 'Meal choice for the ' + mealEvent.label.toLowerCase() }));
        mealGuests.forEach(function (g) {
          var id = 'meal-' + g.id; var errKey = 'meal:' + g.id;
          var select = el('select', { class: 'input', id: id, 'aria-invalid': state.errors[errKey] ? 'true' : null, 'aria-describedby': state.errors[errKey] ? id + '-error' : null, onchange: function (e) { state.meals[g.id] = e.target.value; } },
            el('option', { value: '', text: 'Choose…' }),
            mealCfg.options.map(function (o) { return el('option', { value: o, selected: state.meals[g.id] === o ? true : null, text: o }); }));
          append(fs, el('div', { class: 'field' }, el('label', { for: id, text: guestLabel(g) }), select,
            state.errors[errKey] ? el('p', { class: 'error-text', id: id + '-error' }, icon('i-alert'), el('span', { text: state.errors[errKey] })) : null));
        });
        append(form, fs);
      }
    }
    var count = el('p', { class: 'hint char-count', id: 'notes-count', text: (500 - state.notes.length) + ' characters left' });
    append(form, el('div', { class: 'field' },
      el('label', { for: 'notes', text: 'Anything we should know?' }),
      el('textarea', { class: 'input', id: 'notes', maxlength: '500', 'aria-describedby': 'notes-hint notes-count', oninput: function (e) { state.notes = e.target.value; count.textContent = (500 - state.notes.length) + ' characters left'; } }, state.notes),
      el('p', { class: 'hint', id: 'notes-hint', text: cfg.notesPurpose }),
      count
    ));
    append(form, el('div', { class: 'form-actions' },
      el('button', { class: 'btn btn-tertiary', type: 'button', 'data-action': 'back', onclick: function () { go('attendance'); } }, 'Back'),
      el('button', { class: 'btn btn-primary', type: 'submit', 'data-action': 'continue' }, 'Continue')
    ));
    return stepSection('details', [stepper('details'), heading('A few details'), form]);
  }

  function statusPill(status) {
    if (status === 'attending') return el('span', { class: 'status-pill' }, icon('i-check'), 'Attending');
    if (status === 'declining') return el('span', { class: 'status-pill' }, icon('i-minus'), 'Declining');
    return el('span', { class: 'status-pill muted' }, 'No answer');
  }

  function summaryTable() {
    var rows = [];
    guests().forEach(function (g) {
      entitlementsFor(g.id).forEach(function (eid) {
        var ev = eventById[eid] || { label: eid, name: '' };
        var mealCell = mealCfg && eid === mealCfg.eventId && state.answers[key(g.id, eid)] === 'attending' ? ' · ' + (state.meals[g.id] || 'meal not chosen') : '';
        rows.push(el('tr', {},
          el('td', { 'data-label': 'Guest', text: guestLabel(g) }),
          el('td', { 'data-label': 'Event', text: ev.label + (ev.name ? ' — ' + ev.name : '') }),
          el('td', { 'data-label': 'Response' }, statusPill(state.answers[key(g.id, eid)]), mealCell ? el('span', { class: 'muted', text: mealCell }) : null)
        ));
      });
    });
    return el('table', { class: 'review-table' }, el('thead', {}, el('tr', {}, el('th', { text: 'Guest' }), el('th', { text: 'Event' }), el('th', { text: 'Response' }))), el('tbody', {}, rows));
  }

  function renderReview() {
    var open = rsvpOpen();
    var details = el('dl', { class: 'review-details' });
    if (anyoneAttending()) {
      append(details, el('div', {}, el('dt', { text: 'Contact email' }), el('dd', { text: state.contactEmail || '—' })));
      append(details, el('div', {}, el('dt', { text: 'Notes' }), el('dd', { text: state.notes || 'None' })));
    }
    var actions = el('div', { class: 'form-actions' },
      el('div', { class: 'actions' },
        el('button', { class: 'btn btn-tertiary', type: 'button', 'data-action': 'edit-attendance', onclick: function () { go('attendance'); } }, 'Edit attendance'),
        anyoneAttending() ? el('button', { class: 'btn btn-tertiary', type: 'button', 'data-action': 'edit-details', onclick: function () { go('details'); } }, 'Edit details') : null
      ),
      open ? busyButton(state.session.reference ? 'Save changes' : 'Submit RSVP', { class: 'btn btn-primary', type: 'button', 'data-action': 'submit', 'data-busy-label': 'Saving…', onclick: onSubmit }) : null
    );
    return stepSection('review', [stepper('review'), heading('Review your response'), summaryTable(), details,
      open ? null : el('div', { class: 'status is-error' }, icon('i-alert'), el('p', { text: cfg.closedText })),
      open ? null : contactNode('To change your response, please contact '),
      actions]);
  }

  function renderConfirmation() {
    var s = state.session;
    var when = s.submittedAt ? new Date(s.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
    var parts = [stepper('confirmation'), heading('Thank you — your response is saved'),
      el('p', { class: 'reference' }, 'Reference ', el('strong', { text: s.reference || '—' })),
      el('p', { text: (when ? 'Saved ' + when + '. ' : '') + (s.emailQueued && state.contactEmail ? 'A confirmation will be emailed to ' + state.contactEmail + '.' : 'Please keep this reference for your records.') }),
      (!s.emailQueued && anyoneAttending()) ? el('div', { class: 'status', role: 'note' }, icon('i-info'), el('p', { text: 'A confirmation email is not available' + (mode === 'preview' ? ' in this preview' : ' right now') + '. Your response is saved under the reference above; if you would like a copy, please contact us.' })) : null,
      summaryTable()];
    if (rsvpOpen()) parts.push(el('p', { text: 'You can come back and change your response until responses close.' }));
    parts.push(el('div', { class: 'form-actions' },
      el('button', { class: 'btn btn-tertiary', type: 'button', 'data-action': 'sign-out', onclick: onSignOut }, 'Finish and sign out'),
      rsvpOpen() ? el('button', { class: 'btn btn-secondary', type: 'button', 'data-action': 'change', onclick: function () { go('attendance'); } }, 'Change my response') : null
    ));
    return stepSection('confirmation', parts);
  }

  function renderClosed() {
    return stepSection('closed', [heading('Responses have closed'), el('p', { text: cfg.closedText }), contactNode('Please contact ')]);
  }

  function render() {
    appEl.innerHTML = '';
    if (mode === 'preview') appEl.appendChild(el('p', { class: 'rsvp-banner', role: 'note', text: 'Preview with synthetic guests — nothing you enter is saved.' }));
    appEl.appendChild(statusRegion);
    var view = { access: renderAccess, invitees: renderInvitees, attendance: renderAttendance, details: renderDetails, review: renderReview, confirmation: renderConfirmation, closed: renderClosed }[state.step]();
    appEl.appendChild(view);
    appEl.hidden = false;
    if (staticEl) staticEl.hidden = true;
    if (state.focusHeading) {
      var h = document.getElementById('rsvp-step-heading');
      if (h) h.focus({ preventScroll: false });
      state.focusHeading = false;
    }
  }

  function go(step) {
    state.step = step;
    state.errors = {};
    state.focusHeading = true;
    render();
  }

  // ---------- handlers ----------
  function handleError(err) {
    var code = err && err.code ? err.code : 'server_error';
    if (code === 'conflict' && err.extra && err.extra.latest) {
      loadSession(err.extra.latest, false);
      state.requestId = null;
      go('review');
      setNotice('error', MESSAGES.conflict);
      return;
    }
    if (code === 'closed') { state.step = 'closed'; render(); setNotice('error', MESSAGES.closed); return; }
    if (code === 'invalid_session') { state.step = 'access'; render(); setNotice('error', MESSAGES.invalid_session); return; }
    setNotice('error', MESSAGES[code] || MESSAGES.server_error);
  }

  function onAccessSubmit(e) {
    e.preventDefault();
    if (state.busy) return;
    var input = document.getElementById('code');
    var code = (input.value || '').trim();
    state.codeValue = code;
    state.errors = {};
    if (!code) { state.errors.code = 'Please enter your invitation code.'; render(); input = document.getElementById('code'); input.focus(); return; }
    state.busy = true; render(); setNotice(null);
    adapter.openSession(code).then(function (session) {
      state.busy = false;
      loadSession(session, true);
      state.codeValue = '';
      if (!rsvpOpen() && !session.reference) { state.step = 'closed'; state.focusHeading = true; render(); return; }
      go(session.reference ? 'confirmation' : 'invitees');
    }).catch(function (err) {
      state.busy = false;
      if (err.code === 'invalid_code') { state.errors.code = MESSAGES.invalid_code; render(); document.getElementById('code').focus(); return; }
      render(); handleError(err);
    });
  }

  function onLinkSubmit(e) {
    e.preventDefault();
    if (state.busy || !linkToken) return;
    var token = linkToken;
    state.busy = true; render(); setNotice(null);
    adapter.openSession(token).then(function (session) {
      state.busy = false;
      linkToken = null;
      loadSession(session, true);
      if (!rsvpOpen() && !session.reference) { state.step = 'closed'; state.focusHeading = true; render(); return; }
      go(session.reference ? 'confirmation' : 'invitees');
    }).catch(function (err) {
      state.busy = false;
      if (err.code === 'invalid_code') { linkToken = null; state.errors.code = 'That invitation link is no longer valid. Please enter the code from your invitation, or contact us.'; render(); var c = document.getElementById('code'); if (c) c.focus(); return; }
      render(); handleError(err);
    });
  }

  function onNotMine() {
    adapter.endSession().then(function () {
      state.session = null; state.answers = {}; state.plusOneNames = {}; state.contactEmail = ''; state.notes = ''; state.meals = {};
      go('access');
      setNotice('info', 'You have been signed out of that invitation. Enter the code from your own invitation to continue.');
    });
  }

  function onSignOut() {
    adapter.endSession().then(function () {
      state.session = null; state.answers = {}; state.plusOneNames = {}; state.contactEmail = ''; state.notes = ''; state.meals = {};
      go('access');
      setNotice('success', 'Thank you. You have been signed out of this invitation.');
    });
  }

  function onAnswer(k, value) {
    state.answers[k] = value;
    var gid = k.split('|')[0];
    var nameField = document.getElementById('plusone-' + gid);
    if (nameField) nameField.parentNode.hidden = !attendingAny(gid);
    if (state.errors[k]) {
      delete state.errors[k];
      var fs = document.querySelector('fieldset[data-key="' + k + '"]');
      if (fs) { fs.classList.remove('is-invalid'); var msg = fs.querySelector('.error-text'); if (msg) msg.hidden = true; }
    }
  }

  function onAttendanceContinue() {
    state.errors = {};
    var firstInvalid = null;
    guests().forEach(function (g) {
      entitlementsFor(g.id).forEach(function (eid) {
        var k = key(g.id, eid);
        if (!state.answers[k]) { state.errors[k] = 'Please choose attending or declining for ' + guestLabel(g) + '.'; firstInvalid = firstInvalid || 'c-' + k.replace(/[^a-z0-9]/gi, '_') + '-attending'; }
      });
      if (g.kind === 'plus-one' && attendingAny(g.id)) {
        var name = (state.plusOneNames[g.id] || '').trim();
        if (name.length < 2) { state.errors['name:' + g.id] = 'Please enter the name of the guest who will attend.'; firstInvalid = firstInvalid || 'plusone-' + g.id; }
      }
    });
    if (firstInvalid) {
      render();
      setNotice('error', 'Please answer for every guest and event before continuing.');
      var f = document.getElementById(firstInvalid); if (f) f.focus();
      return;
    }
    setNotice(null);
    state.requestId = null;
    go(anyoneAttending() ? 'details' : 'review');
  }

  function onDetailsContinue() {
    state.errors = {};
    var email = (state.contactEmail || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      state.errors.contactEmail = 'Please enter a valid email address so we can confirm your response.';
      render(); document.getElementById('contactEmail').focus(); return;
    }
    state.contactEmail = email;
    state.notes = (state.notes || '').slice(0, 500);
    if (mealCfg) {
      var firstMeal = null;
      guests().forEach(function (g) { if (mealAsked(g.id) && !state.meals[g.id]) { state.errors['meal:' + g.id] = 'Please choose a meal for ' + guestLabel(g) + '.'; firstMeal = firstMeal || ('meal-' + g.id); } });
      if (firstMeal) { render(); setNotice('error', 'Please choose a meal for each guest attending.'); var m = document.getElementById(firstMeal); if (m) m.focus(); return; }
    }
    setNotice(null);
    go('review');
  }

  function onSubmit() {
    if (state.busy || !rsvpOpen()) return;
    if (!state.requestId) state.requestId = uuid();
    var payload = {
      requestId: state.requestId,
      revision: state.session.revision,
      responses: [],
      plusOneNames: {},
      contactEmail: anyoneAttending() ? state.contactEmail : (state.contactEmail || ''),
      notes: anyoneAttending() ? state.notes : ''
    };
    guests().forEach(function (g) {
      entitlementsFor(g.id).forEach(function (eid) {
        var row = { guestId: g.id, eventId: eid, status: state.answers[key(g.id, eid)] };
        if (mealCfg && eid === mealCfg.eventId && row.status === 'attending') row.meal = state.meals[g.id] || null;
        payload.responses.push(row);
      });
      if (g.kind === 'plus-one' && attendingAny(g.id)) payload.plusOneNames[g.id] = (state.plusOneNames[g.id] || '').trim();
    });
    state.busy = true; render(); setNotice('info', 'Saving your response…');
    adapter.saveResponse(payload).then(function (saved) {
      state.busy = false;
      state.requestId = null;
      loadSession(saved, false);
      go('confirmation');
      setNotice('success', 'Your response has been saved.');
    }).catch(function (err) {
      state.busy = false;
      render();
      handleError(err);
    });
  }

  // ---------- start ----------
  adapter.getSession().then(function (session) {
    if (session) {
      loadSession(session, false);
      state.step = session.reference ? 'confirmation' : (rsvpOpen() ? 'invitees' : 'closed');
    }
    render();
  }).catch(function (err) { render(); if (err && err.code === 'network') setNotice('error', MESSAGES.network); });
})();
