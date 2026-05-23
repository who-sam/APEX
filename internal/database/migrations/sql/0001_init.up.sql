-- 0001_init.up.sql
--
-- Baseline migration. Intentionally a no-op: the existing schema is currently
-- materialized by GORM AutoMigrate in internal/database/database.go.
--
-- This file marks version 1 so that subsequent migrations (0002+) can layer
-- explicit schema changes on top of the AutoMigrated baseline. New schema
-- changes MUST be added as a new numbered file in this directory rather than
-- via GORM tags. See ORM_RULES.md (Migrations section).
SELECT 1;
