-- Migration: 000_create_migrations_table.sql
-- Description: Create migrations tracking table
-- Created: 2025-06-28

-- Create migrations table for tracking applied migrations
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    migration_file VARCHAR(255) NOT NULL,
    batch INTEGER NOT NULL DEFAULT 1,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_migrations_migration_name ON migrations(migration_name);
CREATE INDEX IF NOT EXISTS idx_migrations_batch ON migrations(batch); 