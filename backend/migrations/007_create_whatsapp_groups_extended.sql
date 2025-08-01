-- Migration 007: Create extended WhatsApp groups and members tables
-- Created: 2024-01-XX
-- Description: Extended WhatsApp group management with members and import functionality

-- Create whatsapp_groups_extended table
CREATE TABLE IF NOT EXISTS whatsapp_groups_extended (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    description TEXT,
    profile_picture VARCHAR(255),
    member_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES whatsapp_groups_extended(id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    member_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'rejected')),
    joined_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, member_number)
);

-- Create member_import_logs table
CREATE TABLE IF NOT EXISTS member_import_logs (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES whatsapp_groups_extended(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    total_records INTEGER DEFAULT 0,
    successful_imports INTEGER DEFAULT 0,
    failed_imports INTEGER DEFAULT 0,
    import_errors TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);
CREATE INDEX IF NOT EXISTS idx_group_members_number ON group_members(member_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_status ON whatsapp_groups_extended(status);

-- Create trigger to update member_count automatically
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE whatsapp_groups_extended 
        SET member_count = (
            SELECT COUNT(*) 
            FROM group_members 
            WHERE group_id = NEW.group_id AND status = 'active'
        )
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE whatsapp_groups_extended 
        SET member_count = (
            SELECT COUNT(*) 
            FROM group_members 
            WHERE group_id = OLD.group_id AND status = 'active'
        )
        WHERE id = OLD.group_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE whatsapp_groups_extended 
        SET member_count = (
            SELECT COUNT(*) 
            FROM group_members 
            WHERE group_id = NEW.group_id AND status = 'active'
        )
        WHERE id = NEW.group_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_member_count ON group_members;
CREATE TRIGGER trigger_update_member_count
    AFTER INSERT OR UPDATE OR DELETE ON group_members
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Insert sample data
INSERT INTO whatsapp_groups_extended (group_name, description, member_count, status) VALUES
('Watify', 'Watify Test Group', 1, 'active'),
('NOC-DATA-CORE', 'NOC-DATA-CORE', 29, 'active'),
('NOC-DVB', 'NOC-DVB', 6, 'active'),
('NOC-HFC', 'NOC-HFC', 26, 'active'),
('NOC-IN', 'NOC-IN', 8, 'active'),
('NOC-VNOC', 'NOC-VNOC', 13, 'active'),
('NOC-VSAT', 'NOC-VSAT', 9, 'active');

-- Insert sample group members
INSERT INTO group_members (group_id, member_name, member_number, status, joined_at) VALUES
(1, 'Admin User', '+923001234567', 'active', CURRENT_TIMESTAMP),
(2, 'NOC Team Lead', '+923001234568', 'active', CURRENT_TIMESTAMP),
(2, 'Data Engineer 1', '+923001234569', 'active', CURRENT_TIMESTAMP),
(3, 'DVB Specialist', '+923001234570', 'active', CURRENT_TIMESTAMP),
(4, 'HFC Engineer', '+923001234571', 'active', CURRENT_TIMESTAMP),
(5, 'Network Admin', '+923001234572', 'active', CURRENT_TIMESTAMP),
(6, 'VNOC Operator', '+923001234573', 'active', CURRENT_TIMESTAMP),
(7, 'VSAT Technician', '+923001234574', 'active', CURRENT_TIMESTAMP);

COMMENT ON TABLE whatsapp_groups_extended IS 'Extended WhatsApp groups with comprehensive management features';
COMMENT ON TABLE group_members IS 'Members associated with WhatsApp groups';
COMMENT ON TABLE member_import_logs IS 'Logs for bulk member import operations'; 