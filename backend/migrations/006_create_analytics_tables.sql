-- Create analytics and statistics tables for dashboard
-- Migration: 006_create_analytics_tables

-- Daily statistics table for tracking daily message counts
CREATE TABLE daily_statistics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    
    -- Outgoing message counts by type
    outgoing_text_count INTEGER DEFAULT 0,
    outgoing_video_count INTEGER DEFAULT 0,
    outgoing_image_count INTEGER DEFAULT 0,
    outgoing_document_count INTEGER DEFAULT 0,
    outgoing_audio_count INTEGER DEFAULT 0,
    outgoing_total_count INTEGER DEFAULT 0,
    
    -- Incoming message counts
    incoming_message_count INTEGER DEFAULT 0,
    incoming_auto_response_count INTEGER DEFAULT 0,
    incoming_audio_call_count INTEGER DEFAULT 0,
    incoming_video_call_count INTEGER DEFAULT 0,
    incoming_total_count INTEGER DEFAULT 0,
    
    -- Error counts
    limit_exceeded_count INTEGER DEFAULT 0,
    no_whatsapp_account_count INTEGER DEFAULT 0,
    invalid_numbers_count INTEGER DEFAULT 0,
    
    -- Subscriber statistics
    new_subscribers_count INTEGER DEFAULT 0,
    active_subscribers_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Monthly statistics table for tracking monthly aggregates
CREATE TABLE monthly_statistics (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    
    -- Monthly message counts by type
    text_count INTEGER DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    document_count INTEGER DEFAULT 0,
    audio_count INTEGER DEFAULT 0,
    auto_response_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    
    -- Monthly subscriber metrics
    total_subscribers INTEGER DEFAULT 0,
    new_subscribers INTEGER DEFAULT 0,
    active_subscribers INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(year, month)
);

-- Call logs table for tracking audio/video calls
CREATE TABLE call_logs (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE CASCADE,
    call_type VARCHAR(20) NOT NULL CHECK (call_type IN ('audio', 'video')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    duration INTEGER DEFAULT 0, -- in seconds
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'missed', 'rejected', 'failed')),
    call_start_time TIMESTAMP,
    call_end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Auto responses table for tracking automated responses
CREATE TABLE auto_responses (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE CASCADE,
    trigger_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    response_message_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    trigger_keyword VARCHAR(255),
    response_template TEXT NOT NULL,
    triggered_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs table for tracking user activity over time
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_description TEXT,
    entity_type VARCHAR(50), -- 'message', 'subscriber', 'campaign', etc.
    entity_id INTEGER,
    metadata JSONB, -- Additional data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard widgets table for customizable dashboard
CREATE TABLE dashboard_widgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL,
    widget_config JSONB NOT NULL,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_daily_statistics_date ON daily_statistics(date);
CREATE INDEX idx_monthly_statistics_year_month ON monthly_statistics(year, month);
CREATE INDEX idx_call_logs_subscriber_id ON call_logs(subscriber_id);
CREATE INDEX idx_call_logs_created_at ON call_logs(created_at);
CREATE INDEX idx_auto_responses_subscriber_id ON auto_responses(subscriber_id);
CREATE INDEX idx_auto_responses_triggered_at ON auto_responses(triggered_at);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Function to update daily statistics
CREATE OR REPLACE FUNCTION update_daily_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_statistics (date, outgoing_total_count)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date) DO UPDATE SET
        outgoing_total_count = daily_statistics.outgoing_total_count + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update daily statistics when messages are inserted
CREATE TRIGGER trigger_update_daily_statistics
    AFTER INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.direction = 'outbound')
    EXECUTE FUNCTION update_daily_statistics();

-- Function to get current month statistics
CREATE OR REPLACE FUNCTION get_current_month_stats()
RETURNS TABLE(
    text_count INTEGER,
    video_count INTEGER,
    image_count INTEGER,
    document_count INTEGER,
    audio_count INTEGER,
    auto_response_count INTEGER,
    total_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN message_type = 'text' THEN 1 ELSE 0 END), 0)::INTEGER,
        COALESCE(SUM(CASE WHEN message_type = 'video' THEN 1 ELSE 0 END), 0)::INTEGER,
        COALESCE(SUM(CASE WHEN message_type = 'image' THEN 1 ELSE 0 END), 0)::INTEGER,
        COALESCE(SUM(CASE WHEN message_type = 'document' THEN 1 ELSE 0 END), 0)::INTEGER,
        COALESCE(SUM(CASE WHEN message_type = 'audio' THEN 1 ELSE 0 END), 0)::INTEGER,
        COALESCE((SELECT COUNT(*) FROM auto_responses WHERE EXTRACT(MONTH FROM triggered_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM triggered_at) = EXTRACT(YEAR FROM CURRENT_DATE)), 0)::INTEGER,
        COALESCE(COUNT(*), 0)::INTEGER
    FROM messages 
    WHERE direction = 'outbound' 
    AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql; 