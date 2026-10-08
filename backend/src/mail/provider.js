// Narrow mail-provider adapter (PRD §11 "transactional email provider behind a narrow adapter").
//
// Interface: provider.send({ from, to, subject, text, html? }) -> Promise<{ messageId: string }>.
// Throwing (or rejecting) means "not accepted"; the outbox will retry until MAIL_MAX_ATTEMPTS or
// MAIL_MAX_AGE_HOURS, then abandon and alert the coordinator. Acceptance by a provider is not
// proof of inbox delivery (RSVP-07).
//
// Providers:
//   stub       - accepts everything, delivers nothing. Tests and local development.
//   cloudflare - Cloudflare Email Sending via the send_email binding (`env.EMAIL.send()`).
//                Primary production provider once Workers Paid and the sending domain are on.
//                https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
//   webhook    - POSTs {from,to,subject,text,html} as JSON to MAIL_WEBHOOK_URL with a bearer token.

export function parseFromAddress(from) {
  const raw = String(from || '').trim();
  const m = raw.match(/^(.*)<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ''), email: m[2].trim() };
  return { email: raw };
}

export function stubProvider() {
  const sent = [];
  return {
    name: 'stub',
    sent,
    async send(message) {
      sent.push(message);
      return { messageId: `stub-${sent.length}` };
    },
  };
}

export function webhookProvider(cfg) {
  if (!cfg.mail.webhookUrl || !cfg.mail.webhookToken) {
    throw new Error('MAIL_WEBHOOK_URL and MAIL_WEBHOOK_TOKEN are required for the webhook provider');
  }
  return {
    name: 'webhook',
    async send(message) {
      const res = await fetch(cfg.mail.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.mail.webhookToken}` },
        body: JSON.stringify({
          from: message.from, to: message.to, subject: message.subject, text: message.text, html: message.html || null,
        }),
      });
      if (!res.ok) throw new Error(`mail relay responded ${res.status}`);
      let id = null;
      try { id = (await res.json()).id || null; } catch { /* body optional */ }
      return { messageId: id || `webhook-${Date.now()}` };
    },
  };
}

export function cloudflareProvider(env) {
  return {
    name: 'cloudflare',
    async send(message) {
      if (!env || !env.EMAIL || typeof env.EMAIL.send !== 'function') {
        throw new Error('EMAIL send_email binding is not configured');
      }
      const from = parseFromAddress(message.from);
      if (!from.email) throw new Error('MAIL_FROM is missing');
      const result = await env.EMAIL.send({
        to: message.to,
        from: from.name ? { email: from.email, name: from.name } : from.email,
        subject: message.subject,
        text: message.text,
        html: message.html || undefined,
      });
      return { messageId: (result && (result.messageId || result.id)) || `cf-${Date.now()}` };
    },
  };
}

export function providerFor(cfg, override, env) {
  if (override) return override;
  switch (cfg.mail.provider) {
    case 'stub': return stubProvider();
    case 'webhook': return webhookProvider(cfg);
    case 'cloudflare': return cloudflareProvider(env);
    default: throw new Error(`Unknown MAIL_PROVIDER "${cfg.mail.provider}"`);
  }
}
