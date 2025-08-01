-- Rollback: 003_rollback_subscribers_table.sql
-- Description: Rollback subscribers table
-- Rollback for: 003_create_subscribers_table.sql

-- Remove trigger
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;

-- Remove indexes
DROP INDEX IF EXISTS idx_subscribers_phone_number;
DROP INDEX IF EXISTS idx_subscribers_whatsapp_id;
DROP INDEX IF EXISTS idx_subscribers_status;
DROP INDEX IF EXISTS idx_subscribers_email;
DROP INDEX IF EXISTS idx_subscribers_created_by;
DROP INDEX IF EXISTS idx_subscribers_created_at;
DROP INDEX IF EXISTS idx_subscribers_tags;

-- Drop table
DROP TABLE IF EXISTS subscribers CASCADE; 