-- Rollback: 004_rollback_messages_table.sql
-- Description: Rollback messages table
-- Rollback for: 004_create_messages_table.sql

-- Remove trigger
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;

-- Remove indexes
DROP INDEX IF EXISTS idx_messages_message_id;
DROP INDEX IF EXISTS idx_messages_subscriber_id;
DROP INDEX IF EXISTS idx_messages_group_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_messages_direction;
DROP INDEX IF EXISTS idx_messages_status;
DROP INDEX IF EXISTS idx_messages_message_type;
DROP INDEX IF EXISTS idx_messages_scheduled_at;
DROP INDEX IF EXISTS idx_messages_created_at;

-- Drop table
DROP TABLE IF EXISTS messages CASCADE; 