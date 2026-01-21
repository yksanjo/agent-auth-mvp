// Example: Calendar Agent using AgentAuth
// This shows how an agent would use AgentAuth tokens to access user calendars

const axios = require('axios');

class CalendarAgent {
  constructor(agentAuthToken, apiBaseUrl = 'http://localhost:3001/api') {
    this.agentAuthToken = agentAuthToken;
    this.apiBaseUrl = apiBaseUrl;
  }

  // Validate token and check permissions before making calendar API call
  async validatePermission(requiredScope) {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/validate`,
        { required_scope: requiredScope },
        {
          headers: { Authorization: `Bearer ${this.agentAuthToken}` }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Permission validation failed:', error.response?.data || error.message);
      throw new Error(`Permission denied: ${error.response?.data?.error || 'Invalid token'}`);
    }
  }

  // Log an action for audit trail
  async logAction(action, resourceId, success = true, cost = 0) {
    try {
      await axios.post(
        `${this.apiBaseUrl}/audit`,
        {
          action,
          resource_id: resourceId,
          success,
          cost
        },
        {
          headers: { Authorization: `Bearer ${this.agentAuthToken}` }
        }
      );
    } catch (error) {
      console.warn('Failed to log action:', error.message);
      // Don't throw - audit logging failure shouldn't break agent functionality
    }
  }

  // Example: Create a meeting (simulated)
  async createMeeting(title, startTime, endTime, attendees) {
    const startTime = new Date();
    
    try {
      // 1. Check if we have permission
      const validation = await this.validatePermission('calendar:write:meetings');
      console.log('Permission granted for:', validation.user_email);
      
      // 2. Make the actual API call (simulated here)
      console.log(`Creating meeting: ${title}`);
      console.log(`Time: ${startTime} to ${endTime}`);
      console.log(`Attendees: ${attendees.join(', ')}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const meetingId = `meeting-${Date.now()}`;
      
      // 3. Log the action for audit trail
      await this.logAction('calendar.create', meetingId, true, 0.03);
      
      console.log(`✅ Meeting created: ${meetingId}`);
      return { id: meetingId, success: true };
      
    } catch (error) {
      // Log failed attempt
      await this.logAction('calendar.create', null, false, 0);
      console.error('❌ Failed to create meeting:', error.message);
      throw error;
    }
  }

  // Example: List meetings (simulated)
  async listMeetings(date) {
    try {
      // Check permission
      await this.validatePermission('calendar:read');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const meetings = [
        { id: 'meeting-1', title: 'Team Standup', time: '10:00 AM' },
        { id: 'meeting-2', title: 'Client Call', time: '2:00 PM' }
      ];
      
      // Log the action
      await this.logAction('calendar.list', null, true, 0.01);
      
      return meetings;
    } catch (error) {
      await this.logAction('calendar.list', null, false, 0);
      throw error;
    }
  }

  // Example: Cancel meeting (simulated)
  async cancelMeeting(meetingId) {
    try {
      // Check permission - note the more specific scope
      await this.validatePermission('calendar:delete:meetings');
      
      console.log(`Cancelling meeting: ${meetingId}`);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Log the action
      await this.logAction('calendar.cancel', meetingId, true, 0.02);
      
      console.log(`✅ Meeting cancelled: ${meetingId}`);
      return { success: true };
    } catch (error) {
      await this.logAction('calendar.cancel', meetingId, false, 0);
      throw error;
    }
  }
}

// Example usage
async function runExample() {
  console.log('📅 Calendar Agent Example\n');
  
  // This token would be obtained from the user via AgentAuth dashboard
  const agentToken = 'YOUR_AGENT_AUTH_TOKEN_HERE';
  
  if (agentToken === 'YOUR_AGENT_AUTH_TOKEN_HERE') {
    console.log('⚠️  Please set a real agent token from the AgentAuth dashboard');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Login and create a grant');
    console.log('3. Copy the agent token and paste it here');
    return;
  }
  
  const agent = new CalendarAgent(agentToken);
  
  try {
    // Test 1: List meetings (requires calendar:read scope)
    console.log('Test 1: Listing meetings...');
    const meetings = await agent.listMeetings();
    console.log('Meetings:', meetings);
    
    // Test 2: Create meeting (requires calendar:write:meetings scope)
    console.log('\nTest 2: Creating meeting...');
    const newMeeting = await agent.createMeeting(
      'Project Kickoff',
      new Date(Date.now() + 86400000), // Tomorrow
      new Date(Date.now() + 86400000 + 3600000), // 1 hour later
      ['alice@example.com', 'bob@example.com']
    );
    console.log('Created:', newMeeting);
    
    // Test 3: Try to cancel without permission (should fail if scope not granted)
    console.log('\nTest 3: Attempting to cancel meeting...');
    try {
      await agent.cancelMeeting('meeting-123');
    } catch (error) {
      console.log('Expected error (if calendar:delete:meetings not granted):', error.message);
    }
    
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  runExample();
}

module.exports = CalendarAgent;