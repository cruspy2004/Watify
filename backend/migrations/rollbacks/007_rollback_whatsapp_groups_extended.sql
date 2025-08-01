-- Rollback Migration 007: Drop extended WhatsApp groups and members tables
-- Created: 2024-01-XX
-- Description: Rollback extended WhatsApp group management tables

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_member_count ON group_members;

-- Drop functions
DROP FUNCTION IF EXISTS update_group_member_count();

-- Drop indexes
DROP INDEX IF EXISTS idx_group_members_group_id;
DROP INDEX IF EXISTS idx_group_members_status;
DROP INDEX IF EXISTS idx_group_members_number;
DROP INDEX IF EXISTS idx_whatsapp_groups_status;

-- Drop tables in reverse order (due to foreign key constraints)
DROP TABLE IF EXISTS member_import_logs CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS whatsapp_groups_extended CASCADE;

-- Drop any sequences if they exist
DROP SEQUENCE IF EXISTS whatsapp_groups_extended_id_seq CASCADE;
DROP SEQUENCE IF EXISTS group_members_id_seq CASCADE;
DROP SEQUENCE IF EXISTS member_import_logs_id_seq CASCADE; 