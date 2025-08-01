-- Rollback: 001_rollback_users_table.sql
-- Description: Rollback users table enhancements
-- Rollback for: 001_create_users_table.sql

-- Remove indexes added by migration
DROP INDEX IF EXISTS idx_users_email_verification_token;
DROP INDEX IF EXISTS idx_users_password_reset_token;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_created_at;

-- Remove trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Remove function (only if no other tables use it)
-- Note: We'll keep the function as other tables might use it

-- Remove constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Remove added columns (in reverse order of addition)
ALTER TABLE users DROP COLUMN IF EXISTS locked_until;
ALTER TABLE users DROP COLUMN IF EXISTS login_attempts;
ALTER TABLE users DROP COLUMN IF EXISTS last_login;
ALTER TABLE users DROP COLUMN IF EXISTS password_reset_expires;
ALTER TABLE users DROP COLUMN IF EXISTS password_reset_token;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_token;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;

-- Note: We keep the basic users table structure as it existed before 