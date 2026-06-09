-- Migration: 008_create_messages_system.sql
-- Description: Create comprehensive messaging system tables
-- Created: 2025-06-28

-- Create or upgrade messages table to the schema used by backend/models/Message.js
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipient_type VARCHAR(20) CHECK (recipient_type IN ('individual', 'group', 'whatsapp_group')),
    recipient_id INTEGER, -- Can reference users.id, whatsapp_groups_extended.id, etc.
    recipient_phone VARCHAR(20), -- For individual messages
    content_type VARCHAR(20) CHECK (content_type IN ('text', 'link_preview', 'media_attachment')),
    message_content TEXT,
    link_url TEXT, -- For link preview messages
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    scheduled_at TIMESTAMP, -- For scheduled messages
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    failed_reason TEXT,
    metadata JSONB, -- For additional data like WhatsApp message IDs, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='recipient_type') THEN
        ALTER TABLE messages ADD COLUMN recipient_type VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='recipient_id') THEN
        ALTER TABLE messages ADD COLUMN recipient_id INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='recipient_phone') THEN
        ALTER TABLE messages ADD COLUMN recipient_phone VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='content_type') THEN
        ALTER TABLE messages ADD COLUMN content_type VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='message_content') THEN
        ALTER TABLE messages ADD COLUMN message_content TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='link_url') THEN
        ALTER TABLE messages ADD COLUMN link_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='failed_reason') THEN
        ALTER TABLE messages ADD COLUMN failed_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='metadata') THEN
        ALTER TABLE messages ADD COLUMN metadata JSONB;
    END IF;
END $$;

UPDATE messages
SET
    recipient_type = COALESCE(
        recipient_type,
        CASE
            WHEN group_id IS NOT NULL THEN 'group'
            WHEN subscriber_id IS NOT NULL THEN 'individual'
            ELSE 'individual'
        END
    ),
    recipient_id = COALESCE(recipient_id, group_id, subscriber_id),
    content_type = COALESCE(
        content_type,
        CASE
            WHEN message_type IN ('image', 'video', 'audio', 'document') THEN 'media_attachment'
            ELSE 'text'
        END
    ),
    message_content = COALESCE(message_content, content, 'Message')
WHERE
    recipient_type IS NULL
    OR recipient_id IS NULL
    OR content_type IS NULL
    OR message_content IS NULL;

ALTER TABLE messages
    ALTER COLUMN recipient_type SET DEFAULT 'individual',
    ALTER COLUMN content_type SET DEFAULT 'text';

ALTER TABLE messages
    ALTER COLUMN recipient_type SET NOT NULL,
    ALTER COLUMN content_type SET NOT NULL,
    ALTER COLUMN message_content SET NOT NULL;

-- Create message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- image/jpeg, video/mp4, application/pdf, etc.
    file_size BIGINT NOT NULL, -- Size in bytes
    mime_type VARCHAR(100),
    thumbnail_path VARCHAR(500), -- For images/videos
    duration INTEGER, -- For audio/video files in seconds
    is_primary BOOLEAN DEFAULT false, -- Primary attachment for the message
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create message recipients table (for group messages)
CREATE TABLE IF NOT EXISTS message_recipients (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'phone')),
    recipient_id INTEGER, -- References users.id for registered users
    recipient_phone VARCHAR(20), -- For non-registered recipients
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    failed_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create message templates table (for reusable messages)
CREATE TABLE IF NOT EXISTS message_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('text', 'link_preview', 'media_attachment')),
    template_content TEXT NOT NULL,
    variables JSONB, -- For template variables like {name}, {company}, etc.
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_type ON messages(recipient_type);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_phone ON messages(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_content_type ON messages(content_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_file_type ON message_attachments(file_type);

CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_phone ON message_recipients(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_message_recipients_status ON message_recipients(status);

CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_active ON message_templates(is_active);

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_recipients_updated_at ON message_recipients;
CREATE TRIGGER update_message_recipients_updated_at 
    BEFORE UPDATE ON message_recipients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_templates_updated_at ON message_templates;
CREATE TRIGGER update_message_templates_updated_at 
    BEFORE UPDATE ON message_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample message templates
INSERT INTO message_templates (user_id, name, content_type, template_content, variables)
SELECT u.id, template_name, template_content_type, template_body, template_variables::jsonb
FROM (
    VALUES
        ('Welcome Message', 'text', 'Welcome to {company_name}! We''re excited to have you on board.', '{"company_name": "Watify"}'),
        ('Appointment Reminder', 'text', 'Hi {customer_name}, this is a reminder about your appointment on {date} at {time}.', '{"customer_name": "", "date": "", "time": ""}'),
        ('Order Confirmation', 'text', 'Thank you for your order #{order_id}. Your total is ${amount}. We''ll notify you when it ships!', '{"order_id": "", "amount": ""}')
) AS templates(template_name, template_content_type, template_body, template_variables)
JOIN users u ON u.id = 1
WHERE NOT EXISTS (
    SELECT 1
    FROM message_templates mt
    WHERE mt.user_id = u.id AND mt.name = templates.template_name
);
