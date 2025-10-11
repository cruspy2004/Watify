-- SQL Script to Add Your User to Supabase
-- Copy and paste this into Supabase SQL Editor
-- Supabase URL: https://yjarmeecsensscrtiebh.supabase.co

-- Step 1: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Insert your user with hashed password
-- Email: haadheesheeraz2004@gmail.com
-- Password: admin@123 (already hashed with bcrypt)
INSERT INTO users (name, email, password, role, active) 
VALUES (
  'Haadhee Sheeraz',
  'haadheesheeraz2004@gmail.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVpLzMfxksK',
  'admin',
  true
)
ON CONFLICT (email) 
DO UPDATE SET 
  password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyVpLzMfxksK',
  name = 'Haadhee Sheeraz',
  role = 'admin',
  active = true,
  updated_at = NOW();

-- Step 3: Verify the user was created
SELECT id, name, email, role, active, created_at 
FROM users 
WHERE email = 'haadheesheeraz2004@gmail.com';
