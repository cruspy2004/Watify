-- Rollback: 002_rollback_whatsapp_groups_table.sql
-- Description: Rollback WhatsApp groups table
-- Rollback for: 002_create_whatsapp_groups_table.sql

-- Remove trigger
DROP TRIGGER IF EXISTS update_whatsapp_groups_updated_at ON whatsapp_groups;

-- Remove indexes
DROP INDEX IF EXISTS idx_whatsapp_groups_group_id;
DROP INDEX IF EXISTS idx_whatsapp_groups_admin_user_id;
DROP INDEX IF EXISTS idx_whatsapp_groups_is_active;
DROP INDEX IF EXISTS idx_whatsapp_groups_created_by;
DROP INDEX IF EXISTS idx_whatsapp_groups_created_at;

-- Drop table
DROP TABLE IF EXISTS whatsapp_groups CASCADE; 