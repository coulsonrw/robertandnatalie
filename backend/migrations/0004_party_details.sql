-- 0004_party_details.sql
-- Party contact phone/address and a guest.origin so households can add extra guests on save.
-- Additive and backward compatible: existing rows keep NULL contacts and origin 'roster'.
-- Do not edit earlier migrations.

ALTER TABLE household ADD COLUMN contact_phone TEXT;
ALTER TABLE household ADD COLUMN mailing_address TEXT;
ALTER TABLE guest ADD COLUMN origin TEXT NOT NULL DEFAULT 'roster';
