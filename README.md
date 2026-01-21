# AgentAuth MVP - OAuth for AI Agents

## 🚀 The Problem
Agents can't safely act on behalf of users across services. There's no standardized way to:
- Delegate authority to agents (agent can book meeting but not wire money)
- Set granular permissions (time-limited, scope-limited)
- Maintain audit trails (who authorized what, when)
- Revoke access instantly (oh shit, stop that agent NOW)

## 🎯 MVP Solution
**AgentAuth** - OAuth but for AI agents. A simple API that lets users grant limited permissions to agents.

### Core MVP Features:
1. **Permission Scopes** - Define what agents can/can't do
2. **Time-limited Tokens** - Auto-expiring permissions
3. **Audit Logging** - Track all agent actions
4. **Revocation API** - Instantly stop rogue agents
5. **Simple Dashboard** - View/revoke agent permissions

## 📦 Tech Stack (Simple & Fast)

### Backend:
- **Node.js/Express** - Simple API
- **PostgreSQL/Supabase** - Already using in other projects
- **JWT tokens** - For permission delegation
- **Redis** (optional) - For token blacklisting

### Frontend:
- **Next.js 15** - You know this well
- **Tailwind CSS** - Fast styling
- **Vercel** - Instant deployment

## 🏗️ Architecture

```
User → AgentAuth Dashboard → Grant Permissions → Get Token
     ↓
Agent uses Token → Call Service API → Service validates with AgentAuth
     ↓
AgentAuth logs action → User can audit/revoke
```

## 📋 MVP Scope (Week 1)

### Day 1-2: Core API
- [ ] Permission scope definitions
- [ ] Token generation (JWT with scopes + expiry)
- [ ] Token validation endpoint
- [ ] Basic audit logging

### Day 3-4: Dashboard
- [ ] User can view granted permissions
- [ ] User can revoke tokens
- [ ] Simple audit log view
- [ ] Token generation UI

### Day 5-6: Integration Examples
- [ ] Example: Calendar booking agent
- [ ] Example: File access agent
- [ ] Example: Payment agent (limited scope)

### Day 7: Launch & Documentation
- [ ] API documentation
- [ ] Quick start guide
- [ ] GitHub repository
- [ ] Example deployment

## 🔐 Permission Scopes (MVP Examples)

```json
{
  "agent_id": "calendar-bot-001",
  "user_id": "user-123",
  "scopes": [
    "calendar:read",
    "calendar:write:meetings",
    "calendar:delete:meetings"
  ],
  "expires_at": "2025-02-20T12:00:00Z",
  "budget_limit": 50.00,
  "rate_limit": "100/day"
}
```

### Scope Categories:
1. **Read-only** (`service:read`)
2. **Write-limited** (`service:write:resource`)
3. **Budget-limited** (`max_amount: $X`)
4. **Time-limited** (`expires_in: 24h`)
5. **Rate-limited** (`calls_per_day: 100`)

## 🗄️ Database Schema

```sql
-- Users (simplified - could link to existing auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agents (registered by developers)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  developer_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Permission Grants (user → agent)
CREATE TABLE permission_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES agents(id),
  scopes JSONB NOT NULL, -- ["calendar:read", "calendar:write"]
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  budget_limit DECIMAL(10,2),
  rate_limit_per_day INTEGER,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log (all agent actions)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID REFERENCES permission_grants(id),
  action VARCHAR(100) NOT NULL, -- "calendar.create", "file.read"
  resource_id VARCHAR(255), -- meeting-123, file-456
  success BOOLEAN NOT NULL,
  cost_incurred DECIMAL(10,4),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API Endpoints (MVP)

### 1. Create Permission Grant
```
POST /api/v1/grants
Authorization: Bearer {user_token}

{
  "agent_id": "uuid",
  "scopes": ["calendar:read", "calendar:write:meetings"],
  "expires_in_hours": 24,
  "budget_limit": 50.00
}

Response:
{
  "grant_id": "uuid",
  "token": "agent-auth-token-here",
  "expires_at": "2025-02-20T12:00:00Z"
}
```

### 2. Validate Token (for services)
```
POST /api/v1/validate
Authorization: Bearer {agent_token}

{
  "required_scope": "calendar:write:meetings",
  "action": "calendar.create"
}

Response:
{
  "valid": true,
  "user_id": "uuid",
  "remaining_budget": 45.50,
  "scopes": ["calendar:read", "calendar:write:meetings"]
}
```

### 3. Revoke Grant
```
DELETE /api/v1/grants/{grant_id}
Authorization: Bearer {user_token}

Response: 204 No Content
```

### 4. Log Action (for services)
```
POST /api/v1/audit
Authorization: Bearer {service_token}

{
  "grant_id": "uuid",
  "action": "calendar.create",
  "resource_id": "meeting-123",
  "success": true,
  "cost": 0.03
}

Response: 201 Created
```

## 🎨 Dashboard Features (MVP)

### User View:
1. **Active Grants** - List of agents with permissions
2. **Grant Details** - Scopes, expiry, usage
3. **Revoke Button** - One-click revocation
4. **Audit Log** - Recent agent actions
5. **Create Grant** - Simple form for new permissions

### Developer View (future):
1. **Register Agents** - Get agent IDs
2. **Usage Analytics** - How agents are being used
3. **Webhook Setup** - Get notified of revocations

## 🚀 Getting Started

### Prerequisites:
- Node.js 18+
- PostgreSQL or Supabase
- (Optional) Redis for token blacklisting

### Quick Start:
```bash
# Clone and setup
git clone [your-repo]
cd agent-auth-mvp
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Run migrations
npm run db:migrate

# Start development
npm run dev
```

## 📈 Business Model (Future)

### Free Tier:
- 100 grants/month
- Basic audit logging
- Community support

### Pro Tier ($49/month):
- Unlimited grants
- Advanced audit analytics
- Webhook integrations
- Priority support

### Enterprise Tier ($499/month):
- Custom scopes
- SLA guarantees
- On-premise deployment
- Custom integrations

## 🎯 Why This MVP First?

1. **Solves Immediate Pain**: Agents need auth NOW
2. **Simple Integration**: OAuth-like pattern developers understand
3. **Foundation for More**: Builds toward full AgentOS
4. **Your Strengths**: Compliance/security background
5. **Market Timing**: No clear leader yet

## 🔮 Future Extensions

1. **Compliance Layer** (your strength) - GDPR, HIPAA checks
2. **Payment Integration** - Budget enforcement
3. **Multi-agent Coordination** - Agent-to-agent permissions
4. **Marketplace** - Discover/certify agents
5. **Insurance Integration** - Agent liability coverage

## 🏁 Let's Build It

**Week 1 Goal**: Working API + dashboard that lets users grant/revoke permissions to agents.

**Start with**:
1. Database schema
2. Token generation/validation
3. Simple dashboard
4. Example integration

Ready to code? Let's start with the database schema and basic API.