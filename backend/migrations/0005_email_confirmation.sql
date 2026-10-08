-- 0005_email_confirmation.sql
-- Opt-in for RSVP confirmation email, plus optional HTML bodies on the outbox.
-- Additive and backward compatible: existing households stay opted out (0);
-- existing outbox rows keep NULL body_html. Do not edit earlier migrations.

ALTER TABLE household ADD COLUMN email_confirmation_opt_in INTEGER NOT NULL DEFAULT 0
  CHECK (email_confirmation_opt_in IN (0, 1));

ALTER TABLE mail_outbox ADD COLUMN body_html TEXT;
