-- 0003_hotel_stay.sql
-- Household-level Grand Hotel stay answer collected with the RSVP (yes / no / undecided).
-- Additive; existing households keep NULL until they respond.

ALTER TABLE household_response ADD COLUMN hotel_stay TEXT
  CHECK (hotel_stay IS NULL OR hotel_stay IN ('yes', 'no', 'undecided'));
