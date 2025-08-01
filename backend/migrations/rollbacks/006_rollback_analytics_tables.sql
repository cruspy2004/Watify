-- Rollback analytics and statistics tables
-- Rollback for: 006_create_analytics_tables

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_daily_statistics ON messages;

-- Drop functions
DROP FUNCTION IF EXISTS update_daily_statistics();
DROP FUNCTION IF EXISTS get_current_month_stats();

-- Drop indexes
DROP INDEX IF EXISTS idx_daily_statistics_date;
DROP INDEX IF EXISTS idx_monthly_statistics_year_month;
DROP INDEX IF EXISTS idx_call_logs_subscriber_id;
DROP INDEX IF EXISTS idx_call_logs_created_at;
DROP INDEX IF EXISTS idx_auto_responses_subscriber_id;
DROP INDEX IF EXISTS idx_auto_responses_triggered_at;
DROP INDEX IF EXISTS idx_activity_logs_user_id;
DROP INDEX IF EXISTS idx_activity_logs_created_at;
DROP INDEX IF EXISTS idx_activity_logs_entity;

-- Drop tables in reverse order (considering foreign key dependencies)
DROP TABLE IF EXISTS dashboard_widgets CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS auto_responses CASCADE;
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS monthly_statistics CASCADE;
DROP TABLE IF EXISTS daily_statistics CASCADE; 