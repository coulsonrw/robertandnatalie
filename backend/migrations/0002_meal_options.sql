-- Meal choices (RSVP-03, DATA-02): the configured option list for an event, derived from
-- content/site.config.json → rsvp.mealChoices by scripts/events-sync.mjs or PUT /admin/events.
-- NULL means meals are not collected for that event. A JSON array of strings otherwise.
ALTER TABLE event ADD COLUMN meal_options_json TEXT;
