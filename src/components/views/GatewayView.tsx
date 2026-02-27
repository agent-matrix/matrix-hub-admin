import React, { useState } from 'react';
import { Plus, Settings, Network, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import { MOCK_GATEWAY } from '@/lib/mockData';

interface MCPRegistrationForm {
  transport: 'SSE' | 'STDIO' | 'WEBSOCKET' | 'HTTP';
  url: string;
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string;
}

const initialFormState: MCPRegistrationForm = {
  transport: 'SSE',
  url: '',
  id: '',
  name: '',
  version: '0.1.0',
  description: '',
  capabilities: '',
};

export const GatewayView: React.FC = () => {
  const [formData, setFormData] = useState<MCPRegistrationForm>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [registeredServers, setRegisteredServers] = useState(MOCK_GATEWAY);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Validate required fields
      if (!formData.id || !formData.name || !formData.url) {
        throw new Error('Please fill in all required fields (ID, Name, URL)');
      }

      // Build the registration payload
      const payload = {
        endpoint: {
          transport: formData.transport,
          url: formData.url,
        },
        id: formData.id,
        name: formData.name,
        version: formData.version,
        description: formData.description,
        capabilities: formData.capabilities
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c.length > 0),
      };

      // Call through the admin API proxy (adds server-side auth token)
      const response = await fetch('/api/hub/registry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Success! Add to the list of registered servers
      const newServer = {
        id: result.uid || formData.id,
        name: formData.name,
        transport: formData.transport,
        url: formData.url,
        status: 'ACTIVE' as const,
      };

      setRegisteredServers((prev) => [newServer, ...prev]);

      setMessage({
        type: 'success',
        text: `Successfully registered ${formData.name}! UID: ${result.uid}`,
      });

      // Reset form
      setFormData(initialFormState);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to register MCP server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Gateway Routes
            </h2>
            <p className="text-zinc-400 text-sm">
              Active MCP server bridges and connection pools.
            </p>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Register Server
          </Button>
        </div>

        <div className="grid gap-4">
          {registeredServers.map((gw) => (
            <div
              key={gw.id}
              className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-blue-500/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    gw.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <Network size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{gw.name}</span>
                    <Badge color={gw.transport === 'SSE' ? 'blue' : 'amber'}>
                      {gw.transport}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mt-1">
                    {gw.url}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span
                    className={`text-xs font-bold ${
                      gw.status === 'ACTIVE'
                        ? 'text-emerald-500'
                        : 'text-zinc-500'
                    }`}
                  >
                    {gw.status}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    Uptime: 99.9%
                  </span>
                </div>
                <button className="p-2 text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-white/10 rounded-lg">
                  <Settings size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div id="registration-form">
          <Card title="Register New MCP Server">
            <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Success/Error Message */}
            {message && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg border ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                )}
                <span className="text-xs">{message.text}</span>
              </div>
            )}

            {/* Transport Type */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Transport Type *
              </label>
              <select
                name="transport"
                value={formData.transport}
                onChange={handleInputChange}
                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500/50 outline-none"
                required
              >
                <option value="SSE">SSE (Server-Sent Events)</option>
                <option value="STDIO">STDIO (Local Process)</option>
                <option value="WEBSOCKET">WebSocket</option>
                <option value="HTTP">HTTP</option>
              </select>
            </div>

            {/* Endpoint URL */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Endpoint URL *
              </label>
              <input
                type="text"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                placeholder="http://10.0.0.12:8080"
                required
              />
              <p className="text-xs text-zinc-600 mt-1">
                Full URL for network transports (SSE, HTTP, WebSocket)
              </p>
            </div>

            {/* Server ID */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Server ID *
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                placeholder="hello-sse-server"
                required
              />
              <p className="text-xs text-zinc-600 mt-1">
                Unique identifier (lowercase, hyphens allowed)
              </p>
            </div>

            {/* Server Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Server Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500/50 outline-none"
                placeholder="Hello SSE Server"
                required
              />
            </div>

            {/* Version */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Version
              </label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                placeholder="0.1.0"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500/50 outline-none resize-none"
                placeholder="Describe your MCP server..."
                rows={3}
              />
            </div>

            {/* Capabilities */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Capabilities
              </label>
              <input
                type="text"
                name="capabilities"
                value={formData.capabilities}
                onChange={handleInputChange}
                className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-blue-500/50 outline-none"
                placeholder="search, files, database"
              />
              <p className="text-xs text-zinc-600 mt-1">
                Comma-separated list of capabilities
              </p>
            </div>

            {/* Submit Button */}
            <Button
              variant="primary"
              className="w-full justify-center mt-2"
              type="submit"
              disabled={isSubmitting}
              icon={isSubmitting ? Loader2 : undefined}
            >
              {isSubmitting ? 'Registering...' : 'Register MCP Server'}
            </Button>
            </form>
          </Card>
        </div>

        <Card
          title="Traffic Stats"
          className="bg-gradient-to-br from-blue-900/10 to-transparent"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Requests/min</span>
              <span className="text-white font-mono text-lg">1,240</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[65%]" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Active Streams</span>
              <span className="text-white font-mono text-lg">48</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
