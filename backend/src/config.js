// Reads plain configuration and secrets from the Worker environment. Everything has a safe
// default except the two secrets, which are required in production.

function int(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function readSheetsConfig(env) {
  let email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  let privateKey = env.GOOGLE_PRIVATE_KEY || '';
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON || '';
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      email = parsed.client_email || email;
      privateKey = parsed.private_key || privateKey;
    } catch {
      // Keep the split fields if the JSON secret is malformed; sheetsConfigured() then stays false.
    }
  }
  return {
    spreadsheetId: env.GOOGLE_SHEETS_ID || '',
    sourceTab: env.GOOGLE_SHEETS_SOURCE_TAB || '',
    answersTab: env.GOOGLE_SHEETS_ANSWERS_TAB || 'RSVP Answers',
    serviceAccountEmail: email,
    privateKey: typeof privateKey === 'string' ? privateKey.replace(/\\n/g, '\n') : '',
  };
}

function list(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function readConfig(env) {
  const environment = env.ENVIRONMENT || 'development';
  const cfg = {
    environment,
    isProduction: environment === 'production',
    siteOrigin: (env.SITE_ORIGIN || 'https://robertandnatalie.wedding').replace(/\/$/, ''),
    siteRsvpUrl: env.SITE_RSVP_URL || 'https://robertandnatalie.wedding/rsvp.html',
    coupleDisplayName: env.COUPLE_DISPLAY_NAME || 'Robert and Natalie',
    weddingDate: env.WEDDING_DATE || '2026-12-19',
    eventTimezone: env.EVENT_TIMEZONE || 'America/Chicago',
    weddingDestination: env.WEDDING_DESTINATION || 'Point Clear, Alabama',
    rsvpCutoffAt: env.RSVP_CUTOFF_AT || null,
    retentionDaysAfterWedding: int(env.RETENTION_DAYS_AFTER_WEDDING, 90),
    sessionTtlMs: int(env.SESSION_TTL_HOURS, 24) * 3600 * 1000,
    rateLimit: {
      windowSeconds: int(env.RATE_LIMIT_WINDOW_SECONDS, 900),
      perIp: int(env.RATE_LIMIT_PER_IP, 20),
      perCode: int(env.RATE_LIMIT_PER_CODE, 10),
      perDirectory: int(env.RATE_LIMIT_PER_DIRECTORY, 60),
    },
    mail: {
      provider: env.MAIL_PROVIDER || 'stub',
      from: env.MAIL_FROM || '',
      maxAttempts: int(env.MAIL_MAX_ATTEMPTS, 8),
      maxAgeMs: int(env.MAIL_MAX_AGE_HOURS, 48) * 3600 * 1000,
      coordinatorEmail: env.COORDINATOR_EMAIL || '',
      webhookUrl: env.MAIL_WEBHOOK_URL || '',
      webhookToken: env.MAIL_WEBHOOK_TOKEN || '',
    },
    access: {
      teamDomain: env.ACCESS_TEAM_DOMAIN || '',
      aud: env.ACCESS_AUD || '',
      ownerEmails: list(env.OWNER_EMAILS),
      coordinatorEmails: list(env.COORDINATOR_EMAILS),
      devBypass: environment !== 'production' && String(env.ACCESS_DEV_BYPASS) === 'true',
    },
    secrets: {
      credentialPepper: env.CREDENTIAL_PEPPER || '',
      sessionSecret: env.SESSION_SECRET || '',
    },
    opsBootstrapToken: env.OPS_BOOTSTRAP_TOKEN || '',
    sheets: readSheetsConfig(env),
  };
  if (cfg.isProduction && (!cfg.secrets.credentialPepper || !cfg.secrets.sessionSecret)) {
    throw new Error('CREDENTIAL_PEPPER and SESSION_SECRET must be set in production');
  }
  if (!cfg.secrets.credentialPepper) cfg.secrets.credentialPepper = 'dev-only-credential-pepper';
  if (!cfg.secrets.sessionSecret) cfg.secrets.sessionSecret = 'dev-only-session-secret';
  return cfg;
}
