-- Rollback: 005_rollback_campaigns_table.sql
-- Description: Rollback campaigns table
-- Rollback for: 005_create_campaigns_table.sql

-- Remove trigger
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;

-- Remove indexes for campaign_recipients
DROP INDEX IF EXISTS idx_campaign_recipients_campaign_id;
DROP INDEX IF EXISTS idx_campaign_recipients_subscriber_id;
DROP INDEX IF EXISTS idx_campaign_recipients_status;
DROP INDEX IF EXISTS idx_campaign_recipients_message_id;

-- Remove indexes for campaigns
DROP INDEX IF EXISTS idx_campaigns_status;
DROP INDEX IF EXISTS idx_campaigns_created_by;
DROP INDEX IF EXISTS idx_campaigns_scheduled_at;
DROP INDEX IF EXISTS idx_campaigns_created_at;

-- Drop tables (campaign_recipients first due to foreign key)
DROP TABLE IF EXISTS campaign_recipients CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE; 