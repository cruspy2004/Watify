-- Migration: 003_create_subscribers_table.sql
-- Description: Create subscribers table for contact management
-- Created: 2025-06-28

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    whatsapp_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked', 'opted_out')),
    tags TEXT[], -- Array of tags for categorization
    notes TEXT,
    last_message_sent TIMESTAMP,
    last_message_received TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    opt_in_date TIMESTAMP,
    opt_out_date TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscribers_phone_number ON subscribers(phone_number);
CREATE INDEX IF NOT EXISTS idx_subscribers_whatsapp_id ON subscribers(whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_by ON subscribers(created_by);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at);
CREATE INDEX IF NOT EXISTS idx_subscribers_tags ON subscribers USING GIN(tags);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_subscribers_updated_at 
    BEFORE UPDATE ON subscribers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 