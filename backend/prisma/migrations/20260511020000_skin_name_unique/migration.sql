-- ADR-001: Skin records have been deduplicated. Enforce going forward.
CREATE UNIQUE INDEX IF NOT EXISTS "Skin_name_key" ON "Skin"("name");
