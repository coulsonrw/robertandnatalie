-- 0001_init.sql
-- Reference schema for the Robert and Natalie RSVP API (Cloudflare D1 / SQLite).
-- Implements PRD v1.1 Section 10 "Minimum persistent entities" and the invariants in DATA-02.
--
-- Conventions
--   * All timestamp columns are ISO 8601 strings in UTC ("YYYY-MM-DDTHH:MM:SS.sssZ").
--     The event timezone is stored separately on event.timezone (DATA-02), and the venue-local
--     start is kept verbatim in event.starts_at_local so it can be displayed without conversion.
--   * IDs are immutable opaque text (ADMIN-02). Names are never used as keys.
--   * Free text that guests volunteer (dietary / access notes) lives ONLY in
--     restricted_guest_needs (SEC-05). It is never copied into audit_event, mail_outbox
--     or the general export.
--   * Credentials are stored as HMAC-SHA-256 digests only (SEC-02). Sessions are keyed by the
--     digest of the cookie value.
--
-- Foreign keys must be enabled by the runtime; D1 enables them by default (see README).

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Household: an explicitly grouped invitation (RSVP-01). No implicit grouping by surname.
-- ---------------------------------------------------------------------------
CREATE TABLE household (
  id             TEXT PRIMARY KEY,
  label          TEXT NOT NULL,
  contact_email  TEXT,
  state          TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'revoked')),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Guest: a named invitee or a pre-authorized plus-one slot (RSVP-02).
-- plus_one_name is filled only when the slot is used; it is guest-supplied data and is
-- cleared by the retention job.
-- ---------------------------------------------------------------------------
CREATE TABLE guest (
  id             TEXT PRIMARY KEY,
  household_id   TEXT NOT NULL REFERENCES household(id) ON DELETE RESTRICT,
  kind           TEXT NOT NULL CHECK (kind IN ('named', 'plus-one')),
  display_name   TEXT,                       -- approved name for kind = 'named'; NULL for plus-one slots
  host_guest_id  TEXT REFERENCES guest(id) ON DELETE RESTRICT,  -- required for plus-one slots
  plus_one_name  TEXT,                       -- set by the household when the slot is used
  sort_order     INTEGER NOT NULL DEFAULT 0,
  state          TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'revoked')),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  CHECK ((kind = 'named' AND display_name IS NOT NULL AND host_guest_id IS NULL)
      OR (kind = 'plus-one' AND display_name IS NULL AND host_guest_id IS NOT NULL))
);
CREATE INDEX guest_household_idx ON guest(household_id);

-- ---------------------------------------------------------------------------
-- Event: driven from content/site.config.json (DATA-01). Never hand-edit start times here;
-- run `npm run events:sync` (see README) so the site and the API agree.
-- ---------------------------------------------------------------------------
CREATE TABLE event (
  id                   TEXT PRIMARY KEY,           -- matches events[].id in site.config.json
  label                TEXT NOT NULL,              -- "Ceremony"
  name                 TEXT NOT NULL,              -- "Saint Francis Chapel"
  venue_name           TEXT NOT NULL,
  starts_at_utc        TEXT NOT NULL,              -- UTC instant
  starts_at_local      TEXT NOT NULL,              -- the configured value with its offset, verbatim
  ends_at_utc          TEXT,                       -- NULL until approved (no invented duration)
  timezone             TEXT NOT NULL,              -- IANA zone, e.g. America/Chicago
  directions_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (directions_confirmed IN (0, 1)),
  approval_state       TEXT NOT NULL DEFAULT 'pending',
  sort_order           INTEGER NOT NULL DEFAULT 0,
  updated_at           TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Invitation entitlement: guest + event, unique pair. Defines what a guest may answer.
-- ---------------------------------------------------------------------------
CREATE TABLE invitation_entitlement (
  id          TEXT PRIMARY KEY,
  guest_id    TEXT NOT NULL REFERENCES guest(id) ON DELETE RESTRICT,
  event_id    TEXT NOT NULL REFERENCES event(id) ON DELETE RESTRICT,
  created_at  TEXT NOT NULL,
  revoked_at  TEXT,
  UNIQUE (guest_id, event_id)
);
CREATE INDEX entitlement_event_idx ON invitation_entitlement(event_id);

-- ---------------------------------------------------------------------------
-- Household response state: the household-level revision, reference and submission record
-- used for optimistic concurrency (RSVP-05). One row per household, created on import.
-- ---------------------------------------------------------------------------
CREATE TABLE household_response (
  household_id        TEXT PRIMARY KEY REFERENCES household(id) ON DELETE CASCADE,
  revision            INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  reference           TEXT UNIQUE,                -- set on first committed save
  first_submitted_at  TEXT,
  last_submitted_at   TEXT,
  last_origin         TEXT CHECK (last_origin IS NULL OR last_origin IN ('guest', 'owner-correction', 'coordinator-phone', 'coordinator-email', 'import')),
  last_email_queued   INTEGER NOT NULL DEFAULT 0 CHECK (last_email_queued IN (0, 1))
);

-- Revision guard: exactly one writer may commit a given (household, revision). Inserting the
-- next revision number inside the save batch turns a lost-update race into a constraint
-- failure, which the worker reports as 409 conflict with the latest snapshot.
CREATE TABLE household_revision (
  household_id  TEXT NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  revision      INTEGER NOT NULL,
  committed_at  TEXT NOT NULL,
  origin        TEXT NOT NULL,
  PRIMARY KEY (household_id, revision)
);

-- ---------------------------------------------------------------------------
-- Response: one current record per entitlement (UNIQUE entitlement_id). Allowed status values
-- are enforced by CHECK; "maybe" does not exist (RSVP-04).
-- ---------------------------------------------------------------------------
CREATE TABLE response (
  id              TEXT PRIMARY KEY,
  entitlement_id  TEXT NOT NULL UNIQUE REFERENCES invitation_entitlement(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attending', 'declining')),
  meal_value      TEXT,                          -- configured meal choice; NULL until meals are configured
  revision        INTEGER NOT NULL DEFAULT 0,    -- household revision at which this row last changed
  submitted_at    TEXT,
  origin          TEXT CHECK (origin IS NULL OR origin IN ('guest', 'owner-correction', 'coordinator-phone', 'coordinator-email', 'import')),
  updated_at      TEXT NOT NULL
);

-- Prior values kept so an owner correction never silently overwrites a guest's answer (RSVP-04).
-- Holds statuses only; never free text.
CREATE TABLE response_history (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  entitlement_id  TEXT NOT NULL REFERENCES invitation_entitlement(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status      TEXT NOT NULL,
  revision        INTEGER NOT NULL,
  origin          TEXT NOT NULL,
  actor           TEXT NOT NULL,                 -- 'guest' or an admin identity
  changed_at      TEXT NOT NULL
);
CREATE INDEX response_history_entitlement_idx ON response_history(entitlement_id);

-- ---------------------------------------------------------------------------
-- Restricted guest needs (SEC-05): planning notes, separated from general reporting.
-- guest_id NULL means the note is for the household as a whole (the contract's `notes`).
-- ---------------------------------------------------------------------------
CREATE TABLE restricted_guest_needs (
  id                 TEXT PRIMARY KEY,
  household_id       TEXT NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  guest_id           TEXT REFERENCES guest(id) ON DELETE CASCADE,
  note               TEXT NOT NULL,
  allowed_recipients TEXT NOT NULL DEFAULT 'owners,coordinator,caterer',  -- named recipient roles
  retention_until    TEXT NOT NULL,              -- UTC; the retention job deletes at/after this instant
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE UNIQUE INDEX restricted_needs_scope_idx ON restricted_guest_needs(household_id, COALESCE(guest_id, ''));

-- ---------------------------------------------------------------------------
-- Access credential: link tokens (>= 128 bits) and fallback codes. Digest only (SEC-02).
-- ---------------------------------------------------------------------------
CREATE TABLE access_credential (
  id            TEXT PRIMARY KEY,
  household_id  TEXT NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('link', 'code')),
  digest        TEXT NOT NULL UNIQUE,            -- HMAC-SHA-256(pepper, normalized credential), hex
  label         TEXT,                            -- e.g. "printed with invitation"; never the credential
  issued_by     TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  expires_at    TEXT,
  revoked_at    TEXT,
  last_used_at  TEXT
);
CREATE INDEX credential_household_idx ON access_credential(household_id);

-- ---------------------------------------------------------------------------
-- Session: server-side state keyed by the digest of the cookie value.
-- ---------------------------------------------------------------------------
CREATE TABLE session (
  id             TEXT PRIMARY KEY,               -- digest of the session token
  household_id   TEXT NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  credential_id  TEXT REFERENCES access_credential(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL,
  expires_at     TEXT NOT NULL,
  last_seen_at   TEXT NOT NULL,
  revoked_at     TEXT
);
CREATE INDEX session_household_idx ON session(household_id);

-- ---------------------------------------------------------------------------
-- Rate limiting for POST /session, per IP and per code digest (SEC-02/03).
-- ---------------------------------------------------------------------------
CREATE TABLE rate_limit (
  bucket        TEXT NOT NULL,                   -- 'ip:<hash>' or 'code:<digest prefix>'
  window_start  TEXT NOT NULL,
  count         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);

-- ---------------------------------------------------------------------------
-- Content versions (ADMIN-04, OPS-02): urgent-logistics banner and other small structured
-- content. Every change is a new version; rollback creates a new version from an old body.
-- ---------------------------------------------------------------------------
CREATE TABLE content_version (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key         TEXT NOT NULL,                     -- e.g. 'urgent-banner'
  version     INTEGER NOT NULL,
  body_json   TEXT NOT NULL,
  editor      TEXT NOT NULL,
  note        TEXT,
  is_current  INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
  created_at  TEXT NOT NULL,
  UNIQUE (key, version)
);
CREATE UNIQUE INDEX content_current_idx ON content_version(key) WHERE is_current = 1;

-- ---------------------------------------------------------------------------
-- Idempotency records (RSVP-05): the committed result for a (household, requestId).
-- ---------------------------------------------------------------------------
CREATE TABLE idempotency_record (
  household_id   TEXT NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  request_id     TEXT NOT NULL,
  status_code    INTEGER NOT NULL,
  response_json  TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  PRIMARY KEY (household_id, request_id)
);

-- ---------------------------------------------------------------------------
-- Mail outbox (RSVP-07, ARCH-03): queued in the same transaction as the response. A background
-- worker sends with retries, a maximum age and coordinator alerting. Bodies never contain
-- restricted notes.
-- ---------------------------------------------------------------------------
CREATE TABLE mail_outbox (
  id               TEXT PRIMARY KEY,
  household_id     TEXT REFERENCES household(id) ON DELETE SET NULL,
  kind             TEXT NOT NULL CHECK (kind IN ('confirmation', 'coordinator-alert')),
  to_email         TEXT NOT NULL,
  subject          TEXT NOT NULL,
  body_text        TEXT NOT NULL,
  dedupe_key       TEXT NOT NULL UNIQUE,         -- e.g. confirmation:<household>:<revision>
  state            TEXT NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'sent', 'abandoned')),
  attempts         INTEGER NOT NULL DEFAULT 0,
  next_attempt_at  TEXT NOT NULL,
  last_error       TEXT,
  provider_message_id TEXT,
  created_at       TEXT NOT NULL,
  sent_at          TEXT
);
CREATE INDEX mail_outbox_due_idx ON mail_outbox(state, next_attempt_at);

-- Coordinator alerts (ARCH-03): persistent delivery failures and other conditions that need a
-- human. Shown in the admin API; also emailed when COORDINATOR_EMAIL is configured.
CREATE TABLE coordinator_alert (
  id               TEXT PRIMARY KEY,
  kind             TEXT NOT NULL,                -- 'mail-abandoned', 'retention-applied', ...
  subject          TEXT NOT NULL,
  details_json     TEXT NOT NULL,                -- ids and counts only, no free text
  created_at       TEXT NOT NULL,
  acknowledged_at  TEXT,
  acknowledged_by  TEXT
);

-- ---------------------------------------------------------------------------
-- Import batches (ADMIN-02): a preview is stored, then committed by id so what was reviewed is
-- exactly what is applied.
-- ---------------------------------------------------------------------------
CREATE TABLE import_batch (
  id            TEXT PRIMARY KEY,
  csv_digest    TEXT NOT NULL,
  plan_json     TEXT NOT NULL,
  summary_json  TEXT NOT NULL,
  created_by    TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  committed_at  TEXT,
  committed_by  TEXT
);

-- ---------------------------------------------------------------------------
-- Audit events (DATA-02, SEC-05): actor, action, target and changed field NAMES. Never
-- credentials, emails or free text.
-- ---------------------------------------------------------------------------
CREATE TABLE audit_event (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  at            TEXT NOT NULL,
  actor_kind    TEXT NOT NULL CHECK (actor_kind IN ('guest', 'owner', 'coordinator', 'system')),
  actor_id      TEXT NOT NULL,                   -- household id for guests; admin email for staff
  action        TEXT NOT NULL,
  household_id  TEXT,
  target_type   TEXT,
  target_id     TEXT,
  fields_json   TEXT NOT NULL DEFAULT '[]',      -- changed field names
  details_json  TEXT NOT NULL DEFAULT '{}',      -- structured, non-sensitive details
  request_id    TEXT
);
CREATE INDEX audit_household_idx ON audit_event(household_id, at);
CREATE INDEX audit_action_idx ON audit_event(action, at);
