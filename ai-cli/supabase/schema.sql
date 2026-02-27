-- AI CLI Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API keys table (1 user = 1 key, unused keys only)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    key_value VARCHAR(255) UNIQUE NOT NULL,
    key_name VARCHAR(100) DEFAULT 'Default Key',
    is_active BOOLEAN DEFAULT true,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(255) DEFAULT 'New Chat',
    model VARCHAR(100) DEFAULT 'llama-3.3-70b-versatile',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    termux_command TEXT,
    termux_output TEXT,
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create termux commands log table
CREATE TABLE IF NOT EXISTS termux_command_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    command TEXT NOT NULL,
    output TEXT,
    exit_code INTEGER,
    execution_time_ms INTEGER,
    is_allowed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_value ON api_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_termux_logs_user_id ON termux_command_logs(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
    new_key TEXT;
BEGIN
    new_key := 'ak_' || encode(gen_random_bytes(32), 'hex');
    RETURN new_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to register new user with API key
CREATE OR REPLACE FUNCTION register_user_with_key(
    p_email VARCHAR(255),
    p_username VARCHAR(100),
    p_password_hash VARCHAR(255),
    p_full_name VARCHAR(255) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    new_api_key TEXT;
BEGIN
    -- Insert new user
    INSERT INTO users (email, username, password_hash, full_name)
    VALUES (p_email, p_username, p_password_hash, p_full_name)
    RETURNING id INTO new_user_id;
    
    -- Generate and assign API key
    new_api_key := generate_api_key();
    INSERT INTO api_keys (user_id, key_value)
    VALUES (new_user_id, new_api_key);
    
    RETURN json_build_object(
        'user_id', new_user_id,
        'api_key', new_api_key
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE termux_command_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY api_keys_select_own ON api_keys
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY chat_sessions_select_own ON chat_sessions
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY chat_messages_select_own ON chat_messages
    FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY termux_logs_select_own ON termux_command_logs
    FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Insert admin user (optional - change password hash)
-- Password: admin123 (hash this properly before using)
-- INSERT INTO users (email, username, password_hash, full_name, role)
-- VALUES ('admin@termuxgx.local', 'admin', '$2b$10$...', 'Administrator', 'admin');
