-- Migration: 002_create_whatsapp_groups_table.sql
-- Description: Create WhatsApp groups table for group management
-- Created: 2025-06-28

-- Create whatsapp_groups table
CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    group_id VARCHAR(255) UNIQUE NOT NULL, -- WhatsApp group ID
    invite_link TEXT,
    admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 0,
    max_members INTEGER DEFAULT 256,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_group_id ON whatsapp_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_admin_user_id ON whatsapp_groups(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_is_active ON whatsapp_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_created_by ON whatsapp_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_created_at ON whatsapp_groups(created_at);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_whatsapp_groups_updated_at 
    BEFORE UPDATE ON whatsapp_groups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 