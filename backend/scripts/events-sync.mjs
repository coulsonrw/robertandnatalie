#!/usr/bin/env node
// Prints SQL that upserts the event rows from ../content/site.config.json (DATA-01).
// Usage:
//   node scripts/events-sync.mjs > /tmp/events.sql
//   npx wrangler d1 execute rsvp --local  --file /tmp/events.sql
//   npx wrangler d1 execute rsvp --remote --file /tmp/events.sql
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eventsToSql } from '../src/events.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath = process.argv[2] || path.join(here, '..', '..', 'content', 'site.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
process.stdout.write(eventsToSql(config));
