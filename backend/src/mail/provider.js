// Narrow mail-provider adapter (PRD §11 "transactional email provider behind a narrow adapter").
//
// Interface: provider.send({ from, to, subject, text }) -> Promise<{ messageId: string }>.
// Throwing (or rejecting) means "not accepted"; the outbox will retry until MAIL_MAX_ATTEMPTS or
// MAIL_MAX_AGE_HOURS, then abandon and alert the coordinator. Acceptance by a provider is not
// proof of inbox delivery (RSVP-07).
//
// Providers included:
//   stub     - accepts everything, delivers nothing. For tests and local development only.
//   webhook  - POSTs {from,to,subject,text} as JSON to MAIL_WEBHOOK_URL with
//              Authorization: Bearer MAIL_WEBHOOK_TOKEN. Use it to plug in the owners' chosen
//              transactional provider through a tiny relay, or replace it with a direct adapter
//              written against that provider's current API documentation (not supplied here).

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
        body: JSON.stringify({ from: message.from, to: message.to, subject: message.subject, text: message.text }),
      });
      if (!res.ok) throw new Error(`mail relay responded ${res.status}`);
      let id = null;
      try { id = (await res.json()).id || null; } catch { /* body optional */ }
      return { messageId: id || `webhook-${Date.now()}` };
    },
  };
}

export function providerFor(cfg, override) {
  if (override) return override;
  switch (cfg.mail.provider) {
    case 'stub': return stubProvider();
    case 'webhook': return webhookProvider(cfg);
    default: throw new Error(`Unknown MAIL_PROVIDER "${cfg.mail.provider}"`);
  }
}
