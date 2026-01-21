// Example: Service Integration with AgentAuth
// This shows how a service (like a calendar API) would validate AgentAuth tokens

const axios = require('axios');
const express = require('express');
const app = express();
app.use(express.json());

const AGENT_AUTH_API = process.env.AGENT_AUTH_API || 'http://localhost:3001/api';

// Middleware to validate AgentAuth tokens
async function validateAgentAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'AgentAuth token required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Call AgentAuth API to validate token
    const validation = await axios.post(
      `${AGENT_AUTH_API}/validate`,
      {
        required_scope: req.requiredScope,
        action: req.action
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!validation.data.valid) {
      return res.status(403).json({ 
        error: 'Permission denied',
        details: validation.data
      });
    }
    
    // Attach user info to request
    req.agentAuth = validation.data;
    next();
    
  } catch (error) {
    console.error('AgentAuth validation failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    } else if (error.response?.status === 403) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    } else {
      return res.status(500).json({ error: 'Failed to validate permissions' });
    }
  }
}

// Log action to AgentAuth audit trail
async function logAgentAction(token, action, resourceId, success = true, cost = 0) {
  try {
    await axios.post(
      `${AGENT_AUTH_API}/audit`,
      {
        action,
        resource_id: resourceId,
        success,
        cost
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  } catch (error) {
    console.warn('Failed to log agent action:', error.message);
    // Continue even if audit logging fails
  }
}

// Example Calendar API endpoints

// Get user's meetings
app.get('/api/calendar/meetings', 
  (req, res, next) => {
    req.requiredScope = 'calendar:read';
    req.action = 'calendar.list';
    next();
  },
  validateAgentAuth,
  async (req, res) => {
    try {
      const userId = req.agentAuth.user_id;
      
      // Fetch meetings from your database
      const meetings = [
        { id: 'meeting-1', title: 'Team Standup', time: '10:00 AM' },
        { id: 'meeting-2', title: 'Client Call', time: '2:00 PM' }
      ];
      
      // Log the action
      const token = req.headers.authorization.split(' ')[1];
      await logAgentAction(token, 'calendar.list', null, true, 0.01);
      
      res.json({ meetings, user_id: userId });
      
    } catch (error) {
      console.error('Failed to get meetings:', error);
      
      // Log failed action
      const token = req.headers.authorization.split(' ')[1];
      await logAgentAction(token, 'calendar.list', null, false, 0);
      
      res.status(500).json({ error: 'Failed to fetch meetings' });
    }
  }
);

// Create a meeting
app.post('/api/calendar/meetings',
  (req, res, next) => {
    req.requiredScope = 'calendar:write:meetings';
    req.action = 'calendar.create';
    next();
  },
  validateAgentAuth,
  async (req, res) => {
    try {
      const { title, startTime, endTime, attendees } = req.body;
      const userId = req.agentAuth.user_id;
      
      // Validate input
      if (!title || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Create meeting in your database
      const meetingId = `meeting-${Date.now()}`;
      const meeting = {
        id: meetingId,
        title,
        startTime,
        endTime,
        attendees: attendees || [],
        createdBy: userId,
        createdAt: new Date().toISOString()
      };
      
      // Simulate database save
      console.log('Creating meeting:', meeting);
      
      // Log the action with cost
      const token = req.headers.authorization.split(' ')[1];
      await logAgentAction(token, 'calendar.create', meetingId, true, 0.03);
      
      // Check budget (AgentAuth already validated, but we can double-check)
      if (req.agentAuth.remaining_budget !== null && req.agentAuth.remaining_budget < 0.03) {
        return res.status(403).json({ error: 'Budget exceeded' });
      }
      
      res.status(201).json({ 
        meeting,
        message: 'Meeting created successfully'
      });
      
    } catch (error) {
      console.error('Failed to create meeting:', error);
      
      // Log failed action
      const token = req.headers.authorization.split(' ')[1];
      await logAgentAction(token, 'calendar.create', null, false, 0);
      
      res.status(500).json({ error: 'Failed to create meeting' });
    }
  }
);

// Cancel a meeting
app.delete('/api/calendar/meetings/:meetingId',
  (req, res, next) => {
    req.requiredScope = 'calendar:delete:meetings';
    req.action = 'calendar.cancel';
    next();
  },
  validateAgentAuth,
  async (req, res) => {
    try {
      const { meetingId } = req.params;
      const userId = req.agentAuth.user_id;
      
      // Verify meeting exists and user owns it
      // (In real implementation, check your database)
      console.log(`User ${userId} cancelling meeting ${meetingId}`);
      
      // Delete meeting from database
      // await database.deleteMeeting(meetingId, userId);
      
      // Log the action
      const token = req.headers.authorization.split(' ')[1];
      await logAgentAction(token, 'calendar.cancel', meetingId, true, 0.02);
      
      res.json({ 
        success: true,
        message: 'Meeting cancelled'
      });
      
    } catch (error) {
      console.error('Failed to cancel meeting:', error);
      
      const token = req.headers.authorization.split(' ')[1];
      await logAgentAction(token, 'calendar.cancel', req.params.meetingId, false, 0);
      
      res.status(500).json({ error: 'Failed to cancel meeting' });
    }
  }
);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Calendar API with AgentAuth',
    agent_auth: AGENT_AUTH_API
  });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`📅 Calendar API running on port ${PORT}`);
  console.log(`🔐 Integrated with AgentAuth: ${AGENT_AUTH_API}`);
  console.log('\nEndpoints:');
  console.log(`  GET  /api/calendar/meetings  (requires: calendar:read)`);
  console.log(`  POST /api/calendar/meetings  (requires: calendar:write:meetings)`);
  console.log(`  DELETE /api/calendar/meetings/:id  (requires: calendar:delete:meetings)`);
});

module.exports = {
  validateAgentAuth,
  logAgentAction,
  app
};