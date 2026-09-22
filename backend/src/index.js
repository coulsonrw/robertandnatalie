// Worker entry point: routes guest endpoints (docs/RSVP_API_CONTRACT.md), the public banner
// endpoint, and /admin; the scheduled handler runs the mail outbox and the retention rule.

import { readConfig } from './config.js';
import { HttpError, json, errorResponse, corsHeaders, preflight, assertSameSite, readJson, applySecurityHeaders } from './http.js';
import { requestLog } from './log.js';
import { postSession, getSession, deleteSession } from './session.js';
import { putResponse } from './response.js';
import { handleAdmin } from './admin/index.js';
import { currentContent } from './admin/content.js';
import { processOutbox } from './mail/outbox.js';
import { applyRetention } from './retention.js';

async function route(request, env, cfg, url) {
  const method = request.method.toUpperCase();
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/health' && method === 'GET') return json(200, { ok: true, environment: cfg.environment });

  if (path === '/session') {
    assertSameSite(request, cfg.siteOrigin);
    if (method === 'POST') return await postSession(request, env, cfg, await readJson(request));
    if (method === 'GET') return await getSession(request, env, cfg);
    if (method === 'DELETE') return await deleteSession(request, env, cfg);
    throw new HttpError(405, 'method_not_allowed', 'Method not allowed.');
  }

  if (path === '/response') {
    assertSameSite(request, cfg.siteOrigin);
    if (method === 'PUT') return await putResponse(request, env, cfg, await readJson(request));
    throw new HttpError(405, 'method_not_allowed', 'Method not allowed.');
  }

  // Public, cacheable for one minute: the urgent-logistics banner (ADMIN-04, OPS-02). Contains no
  // guest data.
  if (path === '/content/urgent-banner' && method === 'GET') {
    const current = await currentContent(env.DB, 'urgent-banner');
    return json(200, { key: current.key, version: current.version, body: current.body, updatedAt: current.updatedAt }, { 'Cache-Control': 'public, max-age=60' });
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    assertSameSite(request, cfg.siteOrigin);
    // `return await` so a synchronous throw inside the handler is attached to before workerd
    // can report it as an unhandled rejection.
    return await handleAdmin(request, env, cfg, url);
  }

  throw new HttpError(404, 'not_found', 'Not found.');
}

export default {
  async fetch(request, env, ctx) {
    const startedAt = Date.now();
    let cfg;
    try {
      cfg = readConfig(env);
    } catch (err) {
      requestLog(request, 500, startedAt, { error: err.message });
      return errorResponse(err);
    }
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return preflight(request, cfg.siteOrigin);

    let response;
    let logExtra = null;
    try {
      response = await route(request, env, cfg, url);
    } catch (err) {
      if (!(err instanceof HttpError)) logExtra = { error: err && err.message ? err.message : String(err) };
      else logExtra = { code: err.code };
      response = errorResponse(err);
    }
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders(request, cfg.siteOrigin))) headers.set(k, v);
    if (!headers.has('Cache-Control')) applySecurityHeaders(headers);
    response = new Response(response.body, { status: response.status, headers });
    requestLog(request, response.status, startedAt, logExtra);
    return response;
  },

  async scheduled(controller, env, ctx) {
    const cfg = readConfig(env);
    const mail = await processOutbox(env, cfg);
    const retention = await applyRetention(env, cfg);
    // Rate-limit counters are only read for the current window; drop windows that ended more than
    // two window lengths ago so the table does not grow without bound.
    const staleBefore = new Date(Date.now() - 2 * cfg.rateLimit.windowSeconds * 1000).toISOString();
    await env.DB.prepare('DELETE FROM rate_limit WHERE window_start < ?').bind(staleBefore).run();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ t: new Date().toISOString(), cron: controller.cron, mail, retention: { applied: retention.applied, dueAt: retention.dueAt } }));
    return { mail, retention };
  },
};
