'use client';

import { useState, useEffect } from 'react';
import { 
  Key, 
  Shield, 
  Clock, 
  DollarSign,
  Zap,
  Eye,
  Trash2,
  Copy,
  CheckCircle,
  XCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Grant {
  id: string;
  agent_name: string;
  agent_description: string;
  scopes: string[];
  expires_at: string;
  budget_limit: number | null;
  rate_limit_per_day: number | null;
  total_cost_incurred: number;
  total_calls_today: number;
  created_at: string;
}

export default function Dashboard() {
  const [email, setEmail] = useState('test@example.com');
  const [token, setToken] = useState<string | null>(null);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [newGrant, setNewGrant] = useState({
    agent_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    scopes: ['calendar:read', 'calendar:write:meetings'],
    expires_in_hours: 24,
    budget_limit: 50,
    rate_limit_per_day: 100
  });

  // Test login
  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/test-login`, { email });
      setToken(response.data.token);
      localStorage.setItem('agent_auth_token', response.data.token);
      toast.success('Logged in successfully');
      fetchGrants(response.data.token);
    } catch (error) {
      toast.error('Login failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's grants
  const fetchGrants = async (userToken?: string) => {
    const authToken = userToken || token;
    if (!authToken) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/grants`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setGrants(response.data.grants);
    } catch (error) {
      console.error('Failed to fetch grants:', error);
    }
  };

  // Create new grant
  const handleCreateGrant = async () => {
    if (!token) {
      toast.error('Please login first');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/grants`, newGrant, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Grant created successfully!');
      toast(
        <div className="flex flex-col space-y-2">
          <div className="font-medium">Agent Token:</div>
          <div className="text-sm bg-gray-100 p-2 rounded font-mono break-all">
            {response.data.token}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(response.data.token);
              toast.success('Copied to clipboard!');
            }}
            className="btn-secondary text-sm flex items-center justify-center"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Token
          </button>
        </div>,
        { duration: 10000 }
      );
      
      fetchGrants();
      setNewGrant({
        agent_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        scopes: ['calendar:read', 'calendar:write:meetings'],
        expires_in_hours: 24,
        budget_limit: 50,
        rate_limit_per_day: 100
      });
    } catch (error) {
      toast.error('Failed to create grant');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Revoke grant
  const handleRevokeGrant = async (grantId: string) => {
    if (!token) return;

    if (!confirm('Are you sure you want to revoke this grant? The agent will immediately lose access.')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/grants/${grantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Grant revoked successfully');
      fetchGrants();
    } catch (error) {
      toast.error('Failed to revoke grant');
      console.error(error);
    }
  };

  // Check if token exists in localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('agent_auth_token');
    if (savedToken) {
      setToken(savedToken);
      fetchGrants(savedToken);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            OAuth for AI Agents
          </h1>
          <p className="text-xl mb-6 opacity-90">
            Grant limited permissions to AI agents. Set budgets, time limits, and revoke access instantly.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              <span>Granular Permissions</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>Time-limited Access</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              <span>Budget Controls</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              <span>Instant Revocation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Get Started</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email (MVP - no real auth yet)
            </label>
            <div className="flex space-x-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input flex-1"
                placeholder="Enter your email"
              />
              <button
                onClick={handleLogin}
                disabled={loading}
                className="btn-primary whitespace-nowrap"
              >
                {loading ? 'Logging in...' : 'Login / Create Account'}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              This creates a test account. In production, use proper OAuth.
            </p>
          </div>

          {token && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="font-medium">Logged in as {email}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('agent_auth_token');
                  setToken(null);
                  setGrants([]);
                  toast.success('Logged out');
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Grant Section */}
      {token && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Grant Permissions to Agent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent
              </label>
              <select
                value={newGrant.agent_id}
                onChange={(e) => setNewGrant({...newGrant, agent_id: e.target.value})}
                className="input w-full"
              >
                <option value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa">Calendar Assistant</option>
                <option value="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb">File Organizer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires In (hours)
              </label>
              <input
                type="number"
                value={newGrant.expires_in_hours}
                onChange={(e) => setNewGrant({...newGrant, expires_in_hours: parseInt(e.target.value)})}
                className="input w-full"
                min="1"
                max="720"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Limit ($)
              </label>
              <input
                type="number"
                value={newGrant.budget_limit}
                onChange={(e) => setNewGrant({...newGrant, budget_limit: parseFloat(e.target.value)})}
                className="input w-full"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate Limit (calls/day)
              </label>
              <input
                type="number"
                value={newGrant.rate_limit_per_day}
                onChange={(e) => setNewGrant({...newGrant, rate_limit_per_day: parseInt(e.target.value)})}
                className="input w-full"
                min="1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions (Scopes)
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {newGrant.scopes.map((scope, index) => (
                  <div key={index} className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                    {scope}
                    <button
                      onClick={() => {
                        const newScopes = [...newGrant.scopes];
                        newScopes.splice(index, 1);
                        setNewGrant({...newGrant, scopes: newScopes});
                      }}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add scope (e.g., calendar:read)"
                  className="input flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        setNewGrant({
                          ...newGrant,
                          scopes: [...newGrant.scopes, input.value.trim()]
                        });
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add scope"]') as HTMLInputElement;
                    if (input?.value.trim()) {
                      setNewGrant({
                        ...newGrant,
                        scopes: [...newGrant.scopes, input.value.trim()]
                      });
                      input.value = '';
                    }
                  }}
                  className="btn-secondary"
                >
                  Add Scope
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleCreateGrant}
              disabled={loading || newGrant.scopes.length === 0}
              className="btn-primary w-full md:w-auto"
            >
              {loading ? 'Creating Grant...' : 'Create Permission Grant'}
            </button>
          </div>
        </div>
      )}

      {/* Active Grants Section */}
      {token && grants.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Active Permission Grants</h2>
            <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
              {grants.length} active
            </span>
          </div>

          <div className="space-y-4">
            {grants.map((grant) => (
              <div key={grant.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{grant.agent_name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{grant.agent_description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {grant.scopes.map((scope, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {scope}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Expires</div>
                        <div className="font-medium">
                          {format(new Date(grant.expires_at), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Budget</div>
                        <div className="font-medium">
                          {grant.budget_limit ? `$${grant.total_cost_incurred.toFixed(2)} / $${grant.budget_limit}` : 'Unlimited'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Rate Limit</div>
                        <div className="font-medium">
                          {grant.rate_limit_per_day ? `${grant.total_calls_today} / ${grant.rate_limit_per_day} today` : 'Unlimited'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Created</div>
                        <div className="font-medium">
                          {format(new Date(grant.created_at), 'MMM d')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRevokeGrant(grant.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {token && grants.length === 0 && (
        <div className="card text-center py-12">
          <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Grants</h3>
          <p className="text-gray-600 mb-6">
            You haven't granted any permissions to agents yet. Create your first grant above.
          </p>
        </div>
      )}

      {/* How It Works */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">How AgentAuth Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-lg">1. Grant Permissions</h3>
            <p className="text-gray-600">
              Users specify exactly what agents can do, for how long, and with what budget.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-lg">2. Agents Use Tokens</h3>
            <p className="text-gray-600">
              Agents include the token in API calls. Services validate with AgentAuth.
            </p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-lg">3. Monitor & Control</h3>
            <p className="text-gray-600">
              Users see all agent actions and can revoke access instantly at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}