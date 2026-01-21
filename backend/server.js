const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Database connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// JWT setup
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'agent-auth-mvp-secret-key-change-in-production';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Simple authentication middleware (MVP - in production use proper auth)
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // In MVP, we'll accept any valid JWT with user_id
    // In production, validate against database
    req.user = { id: decoded.user_id, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Validate agent token middleware
const validateAgentToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Agent token required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted
    const blacklistCheck = await pool.query(
      'SELECT * FROM token_blacklist WHERE token_hash = $1',
      [bcrypt.hashSync(token, 10)]
    );
    
    if (blacklistCheck.rows.length > 0) {
      return res.status(401).json({ error: 'Token revoked' });
    }
    
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if grant is still valid
    const grantCheck = await pool.query(
      `SELECT pg.*, u.email as user_email, a.name as agent_name 
       FROM permission_grants pg
       JOIN users u ON pg.user_id = u.id
       JOIN agents a ON pg.agent_id = a.id
       WHERE pg.token_hash = $1 
         AND pg.is_revoked = FALSE 
         AND pg.expires_at > NOW()`,
      [bcrypt.hashSync(token, 10)]
    );
    
    if (grantCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired grant' });
    }
    
    req.grant = grantCheck.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid agent token' });
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'AgentAuth API',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// Get user info (for testing)
app.get('/api/user', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

// Create a test user token (MVP - in production use proper auth flow)
app.post('/api/test-login', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Get or create user
    let user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (user.rows.length === 0) {
      // Create test user
      user = await pool.query(
        'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
        [email, email.split('@')[0]]
      );
    }
    
    // Create JWT
    const token = jwt.sign(
      { 
        user_id: user.rows[0].id, 
        email: user.rows[0].email,
        type: 'user'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: user.rows[0] });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register an agent (developer endpoint)
app.post('/api/agents', authenticateUser, async (req, res) => {
  try {
    const { name, description, webhook_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO agents (name, description, developer_id, webhook_url) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, req.user.id, webhook_url]
    );
    
    res.status(201).json({ agent: result.rows[0] });
  } catch (error) {
    console.error('Agent registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create permission grant (user grants permissions to agent)
app.post('/api/grants', authenticateUser, async (req, res) => {
  try {
    const { agent_id, scopes, expires_in_hours = 24, budget_limit, rate_limit_per_day } = req.body;
    
    // Validate agent exists
    const agentCheck = await pool.query(
      'SELECT * FROM agents WHERE id = $1',
      [agent_id]
    );
    
    if (agentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expires_in_hours);
    
    // Generate token
    const tokenId = uuidv4();
    const token = jwt.sign(
      {
        grant_id: tokenId,
        user_id: req.user.id,
        agent_id: agent_id,
        scopes: scopes,
        type: 'agent'
      },
      JWT_SECRET,
      { expiresIn: `${expires_in_hours}h` }
    );
    
    // Hash token for storage
    const tokenHash = await bcrypt.hash(token, 10);
    
    // Create grant
    const result = await pool.query(
      `INSERT INTO permission_grants 
       (user_id, agent_id, scopes, token_hash, expires_at, budget_limit, rate_limit_per_day) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, agent_id, JSON.stringify(scopes), tokenHash, expiresAt, budget_limit, rate_limit_per_day]
    );
    
    res.status(201).json({
      grant: result.rows[0],
      token: token,
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Create grant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate agent token (for services to check permissions)
app.post('/api/validate', validateAgentToken, async (req, res) => {
  try {
    const { required_scope, action } = req.body;
    const grant = req.grant;
    
    // Check if required scope is in granted scopes
    const scopes = grant.scopes || [];
    const hasScope = !required_scope || scopes.includes(required_scope);
    
    // Check budget
    const withinBudget = !grant.budget_limit || grant.total_cost_incurred < grant.budget_limit;
    
    // Check rate limit
    const withinRateLimit = !grant.rate_limit_per_day || grant.total_calls_today < grant.rate_limit_per_day;
    
    if (!hasScope || !withinBudget || !withinRateLimit) {
      return res.status(403).json({
        valid: false,
        error: 'Permission denied',
        details: {
          missing_scope: !hasScope ? required_scope : null,
          budget_exceeded: !withinBudget,
          rate_limit_exceeded: !withinRateLimit
        }
      });
    }
    
    res.json({
      valid: true,
      user_id: grant.user_id,
      user_email: grant.user_email,
      agent_name: grant.agent_name,
      scopes: scopes,
      remaining_budget: grant.budget_limit ? grant.budget_limit - grant.total_cost_incurred : null,
      remaining_calls_today: grant.rate_limit_per_day ? grant.rate_limit_per_day - grant.total_calls_today : null
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log agent action (for services to report usage)
app.post('/api/audit', validateAgentToken, async (req, res) => {
  try {
    const { action, resource_id, success = true, cost = 0 } = req.body;
    const grant = req.grant;
    
    // Create audit log
    const auditResult = await pool.query(
      `INSERT INTO audit_logs (grant_id, action, resource_id, success, cost_incurred, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [grant.id, action, resource_id, success, cost, req.ip, req.get('User-Agent')]
    );
    
    // Update grant usage stats
    await pool.query(
      `UPDATE permission_grants 
       SET total_calls_today = total_calls_today + 1,
           total_cost_incurred = total_cost_incurred + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [cost, grant.id]
    );
    
    // Check if we should notify user (e.g., budget exceeded)
    if (grant.budget_limit && (grant.total_cost_incurred + cost) >= grant.budget_limit) {
      console.log(`💰 Budget exceeded for grant ${grant.id}`);
      // In production: send webhook/email notification
    }
    
    res.status(201).json({ audit: auditResult.rows[0] });
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's active grants
app.get('/api/grants', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pg.*, a.name as agent_name, a.description as agent_description
       FROM permission_grants pg
       JOIN agents a ON pg.agent_id = a.id
       WHERE pg.user_id = $1 AND pg.is_revoked = FALSE AND pg.expires_at > NOW()
       ORDER BY pg.created_at DESC`,
      [req.user.id]
    );
    
    res.json({ grants: result.rows });
  } catch (error) {
    console.error('Get grants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke a grant
app.delete('/api/grants/:grantId', authenticateUser, async (req, res) => {
  try {
    const { grantId } = req.params;
    
    // Get grant to verify ownership
    const grantCheck = await pool.query(
      'SELECT * FROM permission_grants WHERE id = $1 AND user_id = $2',
      [grantId, req.user.id]
    );
    
    if (grantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Grant not found or access denied' });
    }
    
    // Get token hash to blacklist
    const tokenHash = grantCheck.rows[0].token_hash;
    
    // Revoke grant
    await pool.query(
      'UPDATE permission_grants SET is_revoked = TRUE, revoked_at = NOW() WHERE id = $1',
      [grantId]
    );
    
    // Add to blacklist
    await pool.query(
      'INSERT INTO token_blacklist (token_hash, reason) VALUES ($1, $2)',
      [tokenHash, 'user_revoked']
    );
    
    // Notify agent via webhook if configured
    const agentResult = await pool.query(
      'SELECT a.webhook_url FROM agents a JOIN permission_grants pg ON a.id = pg.agent_id WHERE pg.id = $1',
      [grantId]
    );
    
    if (agentResult.rows[0]?.webhook_url) {
      // In production: send webhook asynchronously
      console.log(`🔔 Would send webhook to: ${agentResult.rows[0].webhook_url}`);
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Revoke grant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit logs for a grant
app.get('/api/grants/:grantId/audit', authenticateUser, async (req, res) => {
  try {
    const { grantId } = req.params;
    
    // Verify grant ownership
    const grantCheck = await pool.query(
      'SELECT * FROM permission_grants WHERE id = $1 AND user_id = $2',
      [grantId, req.user.id]
    );
    
    if (grantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Grant not found or access denied' });
    }
    
    const result = await pool.query(
      'SELECT * FROM audit_logs WHERE grant_id = $1 ORDER BY created_at DESC LIMIT 100',
      [grantId]
    );
    
    res.json({ audit_logs: result.rows });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AgentAuth API running on port ${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   Health: GET /api/health`);
  console.log(`   Test login: POST /api/test-login {email}`);
  console.log(`   Create grant: POST /api/grants {agent_id, scopes, ...}`);
  console.log(`   Validate token: POST /api/validate {required_scope}`);
  console.log(`   Log action: POST /api/audit {action, ...}`);
  console.log(`   Get grants: GET /api/grants`);
  console.log(`   Revoke grant: DELETE /api/grants/:id`);
});