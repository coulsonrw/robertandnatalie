// Runs the test suite inside the Workers runtime (workerd) with a local D1 database, using
// @cloudflare/vitest-pool-workers. Migrations are read here (Node) and applied in test/setup.js.
// The events fixture is read from ../content/site.config.json so tests share the site's single
// source of truth (DATA-01) and use only synthetic guests (DATA-03).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrations = await readD1Migrations(path.join(here, 'migrations'));
const siteConfig = JSON.parse(fs.readFileSync(path.join(here, '..', 'content', 'site.config.json'), 'utf8'));

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: migrations,
          TEST_SITE_CONFIG: JSON.stringify({ wedding: siteConfig.wedding, events: siteConfig.events }),
          ENVIRONMENT: 'test',
          ACCESS_DEV_BYPASS: 'true',
          OWNER_EMAILS: 'owner@example.invalid',
          COORDINATOR_EMAILS: 'coordinator@example.invalid',
          CREDENTIAL_PEPPER: 'test-pepper-not-for-production',
          SESSION_SECRET: 'test-session-secret-not-for-production',
          SITE_ORIGIN: 'https://robertandnatalie.wedding',
          MAIL_PROVIDER: 'stub',
          MAIL_MAX_ATTEMPTS: '3',
          MAIL_MAX_AGE_HOURS: '48',
          COORDINATOR_EMAIL: 'coordinator@example.invalid',
          RSVP_CUTOFF_AT: '',
        },
      },
    }),
  ],
  test: {
    include: ['test/**/*.test.js'],
    setupFiles: ['./test/setup.js'],
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
