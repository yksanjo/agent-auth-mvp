-- AgentAuth Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (simplified - could link to existing auth systems)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents (registered by developers)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  developer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  webhook_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permission Grants (user → agent)
CREATE TABLE IF NOT EXISTS permission_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  scopes JSONB NOT NULL DEFAULT '[]', -- ["calendar:read", "calendar:write"]
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  budget_limit DECIMAL(10,2),
  rate_limit_per_day INTEGER,
  total_calls_today INTEGER DEFAULT 0,
  total_cost_incurred DECIMAL(10,4) DEFAULT 0.00,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can't grant duplicate active permissions to same agent
  UNIQUE(user_id, agent_id) WHERE (NOT is_revoked AND expires_at > NOW())
);

-- Audit Log (all agent actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grant_id UUID REFERENCES permission_grants(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- "calendar.create", "file.read"
  resource_id VARCHAR(255), -- meeting-123, file-456
  success BOOLEAN NOT NULL,
  cost_incurred DECIMAL(10,4) DEFAULT 0.00,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token Blacklist (for instant revocation)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(100), -- "user_revoked", "expired", "compromised"
  blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_permission_grants_user_id ON permission_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_grants_agent_id ON permission_grants(agent_id);
CREATE INDEX IF NOT EXISTS idx_permission_grants_token_hash ON permission_grants(token_hash);
CREATE INDEX IF NOT EXISTS idx_permission_grants_expires_at ON permission_grants(expires_at);
CREATE INDEX IF NOT EXISTS idx_permission_grants_is_revoked ON permission_grants(is_revoked);

CREATE INDEX IF NOT EXISTS idx_audit_logs_grant_id ON audit_logs(grant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_token_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_blacklisted_at ON token_blacklist(blacklisted_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permission_grants_updated_at BEFORE UPDATE ON permission_grants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for active grants (simplifies queries)
CREATE OR REPLACE VIEW active_grants AS
SELECT 
  pg.*,
  u.email as user_email,
  u.name as user_name,
  a.name as agent_name,
  a.developer_id
FROM permission_grants pg
JOIN users u ON pg.user_id = u.id
JOIN agents a ON pg.agent_id = a.id
WHERE pg.is_revoked = FALSE 
  AND pg.expires_at > NOW();

-- Insert some test data (optional, for development)
INSERT INTO users (id, email, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'test@example.com', 'Test User'),
  ('22222222-2222-2222-2222-222222222222', 'developer@example.com', 'Agent Developer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO agents (id, name, description, developer_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Calendar Assistant', 'Helps schedule meetings', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'File Organizer', 'Organizes files and documents', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;